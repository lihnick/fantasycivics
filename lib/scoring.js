let ScoringModule = (setup) => {

	let copyPlayerMap = (map) => {
		return JSON.parse(JSON.stringify(map));
	}

	let db = setup.database;
	let datasetMap = setup.datasets;
	let playerMap = copyPlayerMap(setup.players);
	let range = setup.range;

	let DatabaseScoreModule = DatabaseScoring();

	let module = {

		players: {},

		init: () => {
			return new Promise((initResolve, initReject) => {
				let promises = [];
				let ocdPromise = new Promise((resolve, reject) => {
					let ocdRef = db.ref('city_council');
					let ocdQuery = ocdRef.orderByChild('timestamp').startAt(range.from).endAt(range.to);
					ocdQuery.once('value', snap => {
						let nodes = snap.val() || {};
						let val = Object.keys(nodes).map(nid => nodes[nid]).sort((a, b) => {
							return a.timestamp - b.timestamp;
						});
						resolve(val);
					}).catch(reject);
				});
				promises.push(ocdPromise);
				for(let pid in playerMap){
					let playerEntry = playerMap[pid];
					for(let did in datasetMap){
						let socrataPromise = DatabaseScoreModule.getFromDataset({
							player: pid,
							dataset: datasetMap[did].url,
							from: range.from,
							to: range.to
						});
						socrataPromise.pid = pid;
						socrataPromise.did = did;
						promises.push(socrataPromise);
					}
				}
				Promise.all(promises).then(data => {
					let dataMap = copyPlayerMap(playerMap);
					let ocdNodes = data[0];
					for(let pid in dataMap){
						dataMap[pid].data = [];
						ocdNodes.filter(ocdNode => {
							return ocdNode.ocd_person === dataMap[pid].ocd_person;
						}).forEach(ocdNode => {
							dataMap[pid].data.push(ocdNode);
						});
					}
					for(let i = 1; i < data.length; i++){
						let dataNodes = data[i];
						let meta = promises[i];
						dataNodes.forEach(node => {
							node.type = '311';
							node.dataset = meta.did;
							node.timestamp = new Date(node.creation_date).getTime();
							dataMap[meta.pid].data.push(node);
						});
					}
					module.players = dataMap;
					initResolve(dataMap);
				}).catch(initReject);
			});
		},

		scoreByFunction: (scoringFunction) => {
			let scoreMap = copyPlayerMap(playerMap);
			for(let pid in module.players){
				let player = module.players[pid];
				scoreMap[pid].data = player.data;
				scoreMap[pid].score = scoringFunction(player.data);
			}
			return scoreMap;
		}

	}

	return module;
	
}




