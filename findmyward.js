var app = {};

app.locateWard = function(resp){
	var res = false;
	$("#addrResult").remove();
	$("#clnAddr").remove();
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
						app.highlightWard(v);
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
			msg = 'Unable to find address: '+app.inFullAddr;
		}else if(err.message == 'NO_WARD'){
			msg = 'No Ward Associated with address: '+app.clnAddress; 
		}
		var ld = $(document.createElement('div'));
		ld.attr('id','addrResult');
		ld.html('<table id="data"><tr><td style="text-align:left; color: red; background:aliceblue; text-decoration:italic;">'+msg+'</td></tr></table>');
		$("#addrButton").append(ld);
	}
	/**/
	return res;
}

			
app.highlightWard = function(resp)
{
	var data = resp.attributes;

		//$('<div><b>Found address:&nbsp;&nbsp'+app.clnAddress+'</div>').attr({id:"clnAddr"}).appendTo("#addrButton");
		var output = '<table id="data">';
		output += '<tr><td colspan="2" style="text-align:left; background:aliceblue;">Found address:&nbsp;&nbsp<i style="background:aliceblue;">'+app.clnAddress+'</i></td></tr>';
		output += '<tr><td>Ward:</td><td>' +data['WARD']+'</td></tr>';
		output += '<tr><td>Alderman:</td><td>'+data['ALDERMAN']+'</td></tr>';
		output += '<tr><td>Office Address:</td><td>'+data['ADDRESS']+'</td></tr>';
		output += '<tr><td>Ward Phone:</td><td>'+data['WARD_PHONE']+'</td></tr></table>';
		var ld = $(document.createElement('div'));
		ld.attr('id','addrResult');
		ld.html(output);
		$("#addrButton").append(ld);
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
				var res = app.locateWard(data);
				resolve(res);
			},
			error: function(err){
				console.error('geocode error', err)
				reject(err);
			}
		});
	});
}