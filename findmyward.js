var app = {};

app.locateWard = function(resp){
	return new Promise((resolve, reject) => {
		var res = false;
		app.clnAddress = '';
		try{
			if(resp.ForwardGeocodeServiceOutput3 && typeof resp.ForwardGeocodeServiceOutput3 != 'undefined'){
				app.out = resp.ForwardGeocodeServiceOutput3;
				if(app.out.geoValues && typeof app.out.geoValues != 'undefined'){
					app.ward = parseInt(app.out.geoValues.geographyValue);
					app.clnAddress = app.out.fullAddress;
					if(app.ward == 0)throw (new Error("NO_WARD"));
					$.each(app.wardoffice, function(i,v){
						if(v.attributes["WARD"] == app.ward){
							res = v.attributes;	
						}
					});	
				}
				else{throw  (new Error("NO_ADDRESS"))}
			}

			
		}
		catch(err){
			var msg;
			if(err.message == 'NO_ADDRESS'){
				msg = 'Unable to find address in Chicago.';
			}else if(err.message == 'NO_WARD'){
				msg = 'No ward associated with address.'; 
			}
			reject(msg);
		}
		/**/
		resolve(res);
	});
}

var WARD_FILE_URL = 'https://gisapps.cityofchicago.org/WardGeocode/wardoffice.json';
var GEOCODE_URL = 'https://gisapps.cityofchicago.org/ElsProxy/fwdGeocode3';

window.onload =	function(){
	$.ajax({
		type:"GET",
		//url: "./wardoffice.json",
		url: WARD_FILE_URL,
		dataType:"json",
		success: function(resp){
			app.wardoffice = resp.features;
		},
		error: function(err){
			console.error("can't get ward office json");
		}
	});
};

$("#search").submit(function(evt){
	evt.preventDefault();
	//app.inFullAddr
	findMyWard();
});

function findMyWard(inFullAddr){
	return new Promise((resolve, reject) => {
		searchType = 'address';
		app.inFullAddr = $("#addressSearch").val();
		//$("#addressSearch").val('');
		$.ajax({
			type: "POST",
			//url: "/ElsProxy/fwdGeocode3",
			url: GEOCODE_URL,
			dataType: "json",
			data: '{ForwardGeocodeServiceInput3:{"systemId":"WARD_LOOKUP","offsetFt":"20","fullAddress":"'+inFullAddr+'", "getGeos":{"geographyName":"WARD"}}}',
			success: (data) => {
				app.locateWard(data).then(resolve).catch(reject);
			},
			error: function(err){
				console.error('geocode error', err)
				reject(err);
			}
		});
	});
}