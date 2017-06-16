let ScoringModule = (setup) => {

	let copyObject = (obj) => {
		return JSON.parse(JSON.stringify(obj));
	}

	let db = setup.database;
	let datasetMap = setup.datasets;
	let playerMap = copyObject(setup.players);
	let range = setup.range;

	let DatabaseScoreModule = DatabaseScoring();

	let module = {

		players: {},
		datasets: datasetMap,
		range: range,

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
					let dataMap = copyObject(playerMap);
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

		scoreByFunction: (system) => {
			let scoreMap = copyObject(module.players);
			for(let pid in scoreMap){
				let player = scoreMap[pid];
				let breakdown = copyObject(system.breakdown || {});
				let updateScore = (key, val) => {
					breakdown[key].score += val;
				}
				system.scorePlayer(player, module, updateScore);
				scoreMap[pid].breakdown = breakdown;
				scoreMap[pid].score = Object.keys(breakdown).map(key => {
					return breakdown[key].score;
				}).reduce((acc, val) => {
					return acc + val;
				}, 0);
			}
			return scoreMap;
		},

		showBreakdown: (player) => {
			let div = document.createElement('div');
				div.classList.add('scoring-breakdown');
			let h = document.createElement('h1');
				h.innerText = player.name;
				div.appendChild(h);
			let s = document.createElement('h4');
				s.innerText = 'Ward ' + player.ward;
				div.appendChild(s);
			let table = document.createElement('table');
			let trh = document.createElement('tr');
			let th1 = document.createElement('th');
				th1.innerText = 'Category';
				trh.appendChild(th1);
			let th2 = document.createElement('th');
				th2.innerText = 'Score';
				trh.appendChild(th2);
			table.appendChild(trh);
			for(let bid in player.breakdown){
				let category = player.breakdown[bid];
				let tr = document.createElement('tr');
				let td1 = document.createElement('td');
					td1.innerText = category.text;
					tr.appendChild(td1);
				let td2 = document.createElement('td');
					td2.innerText = category.score;
					tr.appendChild(td2);
				table.appendChild(tr);
			}
			let trt = document.createElement('tr');
			let tt1 = document.createElement('th');
				tt1.innerText = 'Total';
				trt.appendChild(tt1);
			let tt2 = document.createElement('th');
				tt2.innerText = player.score;
				trt.appendChild(tt2);
			table.appendChild(trt);
			div.appendChild(table);
			vex.dialog.alert({
				unsafeMessage: div.outerHTML
			});
		},

		forEachPlayer: () => {
			return Object.keys(module.players).map(pid => module.players[pid]);
		}

	}

	return module;
	
}

let getChildModule = (parentModule, playerMap) => {
	let module = ScoringModule({
		players: playerMap,
		range: parentModule.range
	});
	let playerDataMap = {};
	for(let pid in playerMap){
		playerDataMap[pid] = parentModule.players[pid];
	}
	module.players = playerDataMap;
	return module;
}