function DatabaseScoring(DatabaseInstance){

var db = DatabaseInstance;

var SOCRATA_URL = "https://data.cityofchicago.org/resource/";
var SECRET_TOKEN = "Le00VXF0GK0d8D1tTn2v6Vkpl";

function getAldermanByWard(num){
	var pnum = '' + num;
	while(pnum.length < 4){
		pnum = '0' + pnum;
	}
	var pid = 'playerid' + pnum
	var player = PLAYER_MAP[pid];
		player.pid = pid;
	return player;
}

var Scoring = {

	/*pot_holes: '787j-mys9.json',
	street_lights: 'h555-t6kz.json',
	graffiti: 'cdmx-wzbz.json',
	rodent_baiting: 'dvua-vftq.json',
	tree_trims: 'yvxb-fxjz.json',
	garbage_carts: 'a9br-8sqt.json'
	pot_holes: '787j-mys9.json',
	graffiti: 'cdmx-wzbz.json',
	rodent_baiting: 'dvua-vftq.json'
	street_lights: 'h555-t6kz.json',
	abandoned_vehicles: 'suj7-cg3j.json'*/

	DATASETS: {
		pot_holes: {
			name: 'Pot Holes',
			endpoint: '787j-mys9.json',
			source: 'SOCRATA',
			type: '311'
		},
		graffiti: {
			name: 'Graffiti',
			endpoint: 'cdmx-wzbz.json',
			source: 'SOCRATA',
			type: '311'
		},
		/*rodent_baiting: {
			name: 'Rodent Baiting',
			endpoint: 'dvua-vftq.json',
			source: 'SOCRATA',
			type: '311'
		},*/
		/*tree_trims: {
			name: 'Tree Trims',
			endpoint: 'yvxb-fxjz.json',
			source: 'SOCRATA',
			type: '311'
		}*/
		city_council: {
			name: 'City Council Votes',
			endpoint: 'city_council',
			source: 'FIREBASE',
			type: 'VOTES'
		}
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

	queryDataset: (did, params) => {
		return new Promise((resolve, reject) => {
			var dataset = Scoring.DATASETS[did];
			if(dataset.source === 'SOCRATA'){
				if(!params.from){
					reject('Missing {params.from} in queryDataset.');
				}
				else if(!params.to){
					reject('Missing {params.to} in queryDataset.');
				}
				else if(!params.ward){
					reject('Missing {params.ward} in queryDataset.');
				}
				try{
					var endpoint = dataset.endpoint;
					Scoring.getSocrataData(SOCRATA_URL + endpoint,  {
						'$where': Scoring.buildDateQuery('creation_date', params.from, params.to),
						'ward': params.ward
					}, function(data){
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
			}
			else if(dataset.source === 'FIREBASE'){
				var alderman = getAldermanByWard(params.ward);
				var ref = db.ref(dataset.endpoint);
				var query = ref.orderByChild('timestamp').startAt(params.from).endAt(params.to);
				query.once('value', snap => {
					var nodes = snap.val() || {};
					var data = Object.keys(nodes).map(nid => {
						return nodes[nid];
					}).filter(node => {
						return node.ocd_person === alderman.ocd_person;
					});
					resolve(data);
				}).catch(reject);
			}
			else{
				reject('Unknown dataset source.');
			}
		});
	},

	scoreData: (inData, did, from, to) => {
		var dataset = Scoring.DATASETS[did];
		if(dataset.type === '311'){
			return Scoring.score311(inData, did, from, to);
		}
		else if(dataset.type === 'VOTES'){
			return Scoring.scoreVotes(inData, did, from, to);
		}
		else if(dataset.type === 'ATTENDANCE'){
			return Scoring.scoreAttendance(inData, did, from, to);
		}
		else{
			throw new Error('Unknown dataset type.');
		}
	},

	score311: (inData, did, from, to) => {
		var data = inData.filter((issue) => {
			var openOn = issue.creation_date;
			var inWeek = false;
			if(openOn){
				var openTime = new Date(openOn).getTime();
				inWeek = (openTime > from);
			}
			return inWeek;
		});
		var open = data.filter((issue) => { return issue.status == 'Open' });
		var completed = data.filter((issue) => {
			var comp = issue.status === 'Completed';
			var inRange = false;
			var compOn = issue.completion_date;
			if(compOn){
				var compTime = new Date(compOn).getTime();
				inRange = (compTime < to);
			}
			return comp && inRange;
		});
		var score = completed.length - open.length;
		return Math.ceil(score / 10);
	},

	scoreVotes: (inData, did, from, to) => {
		//console.log(inData)
		let score = inData.filter(data => {
			return (data.timestamp > from && data.timestamp < to);
		}).filter(data => {
			return (data.type === 'vote' && data.identifier === 'O');
		}).reduce((acc, vote) => {
			let wonVotePass = (vote.option === 'yes' && vote.result === 'pass');
			let wonVoteFail = (vote.option === 'no' && vote.result === 'fail');
			let contrarian = (vote.option === 'no' && vote.mayor_sponsored);
			//let absent = (vote.option === 'absent');
			let update = acc;
			if(contrarian){
				update += 10;
				console.log('contrarian')
			}
			if(wonVotePass || wonVoteFail){
				update += 1;
			}
			else{
				update -= 1;
			}
			return update;
		}, 0);
		console.log(moment(from).format('M/D'), 'to', moment(to).format('M/D'))
		console.log('score:', score)
		return score;
	},

	scoreAttendance: (inData, did, from, to) => {
		return 0;
	}

}

return Scoring;

}