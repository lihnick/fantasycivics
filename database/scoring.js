function DatabaseScoring(){

var SOCRATA_URL = "https://data.cityofchicago.org/resource/";
var SECRET_TOKEN = "Le00VXF0GK0d8D1tTn2v6Vkpl";

var Scoring = {

	DATASETS: {
		pot_holes: '787j-mys9.json',
		street_lights: 'h555-t6kz.json',
		graffiti: 'cdmx-wzbz.json'
	},

	DATASET_NAMES: {
		pot_holes: 'Pot Holes',
		street_lights: 'Light Outages',
		graffiti: 'Graffiti'
	},

	getSocrataData: (url, query, callback, limit) => {
		query['$$app_token'] = SECRET_TOKEN;
		// Deactivated query limits // query['$limit'] = limit;
		$.ajax({
			url: url,
			method: "GET",
			dataType: "json",
			data: query,
			success: function(data, status, jqxhr){				
				callback(data);
			},
			error: function(jqxhr, status, error){
				callback({
					failed: true,
					status: jqxhr.status
				});
				throw new Error("Socrata request failed: " + error);
			}
		});
	},

	buildDateQuery: (field, from, to) => {
		return field + " between '" + new Date(from).toISOString().split('.')[0] + "' and '" + new Date(to).toISOString().split('.')[0] + "'";
	},

	queryDataset: (dataset, query) => {
		return new Promise((resolve, reject) => {
			try{
				Scoring.getSocrataData(SOCRATA_URL + Scoring.DATASETS[dataset], query, function(data){
					if(data.failed){
						resolve([]);
					}
					else{
						resolve(data);
					}
				});
			}
			catch(e){
				console.log('Socrata/AJAX error allowed to be resolved.');
				console.error(e);
				//reject(e);
			}
		});
	}

}

return Scoring;

}