var SOCRATA_URL = "https://data.cityofchicago.org/resource/787j-mys9.json"
var SECRET_TOKEN = "Le00VXF0GK0d8D1tTn2v6Vkpl";


function getData(url, query, callback, limit){
	query['$$app_token'] = SECRET_TOKEN;
	query['$limit'] = limit || 10;
	$.ajax({
		url: url,
		method: "GET",
		dataType: "json",
		data: query,
		success: function(data, status, jqxhr){
			callback(data);
		},
		error: function(jqxhr, status, error){
			console.error("Critical Error!");
		}
	});
}

var LIMIT = 3;

getData(SOCRATA_URL, {}, function(data){
	main(data);
}, LIMIT);

function main(data){
	console.log(data);
}


var Scoring = {

}