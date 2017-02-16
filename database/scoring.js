var SOCRATA_URL = "https://data.cityofchicago.org/resource/";
var SECRET_TOKEN = "Le00VXF0GK0d8D1tTn2v6Vkpl";

var DATASETS = {
	pot_holes: '787j-mys9.json'
}

var Scoring = {

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
				Scoring.getSocrataData(SOCRATA_URL + DATASETS[dataset], query, resolve);
			}
			catch(e){
				reject(e);
			}
		});
	}

}