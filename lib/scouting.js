function ScoutingReport(){

	var module = {};

	var alderman = getAldermanByWard(3);

	var from1 = Date.now() - WEEK;
	var to1 = Date.now();

	var from2 = Date.now() - (2 * WEEK);

	function getHistoricalScores(pid, from, to){
		return new Promise((resolve, reject) => {
			var player = PLAYER_MAP[pid];
			var promises = [];
			for(var dataset in Database.Scoring.DATASETS){
				var p = Database.Scoring.queryDataset(dataset, {
					'$where': Database.Scoring.buildDateQuery('creation_date', from, to),
					'ward': alderman.ward
				});
				p.dataset = dataset;
				promises.push(p);
			}
			Promise.all(promises).then(packets => {
				var scores = {};
				packets.forEach((packet, idx) => {
					var score = Database.Scoring.scoreData(packet, from, to);
					var meta = promises[idx];
					scores[meta.dataset] = score;
				});
				resolve(scores);
			}).catch(reject);
		});
	}

	getHistoricalScores(alderman.pid, from1, to1).then(scores => {
		console.log(moment(from1).format('M/D'));
		console.log(scores);
		console.log(sumScores(scores));
	});

	getHistoricalScores(alderman.pid, from2, to1).then(scores => {
		console.log(moment(from2).format('M/D'));
		console.log(scores);
		console.log(sumScores(scores));
	});

	


	module.attachReport = (div, player) => {
		div.addEventListener('click', e => {
			console.log(player);
		});
		return div;
	}

	return module;

}