function ScoutingReport(){

	var module = {};

	var alderman = getAldermanByWard(3);

	var from1 = Date.now() - WEEK;
	var to1 = Date.now();

	var from2 = Date.now() - (2 * WEEK);

	function getHistoricalScores(pid, from, to){
		var weeks = [];
		var current = from;
		while(current < to){
			weeks.push({
				from: current,
				to: current + WEEK
			});
			current += WEEK;
		}
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
				var scoreList = weeks.map(week => {
					var scores = {};
					packets.forEach((packet, idx) => {
						var score = Database.Scoring.scoreData(packet, week.from, week.to);
						var meta = promises[idx];
						scores[meta.dataset] = score;
					});
					week.scores = scores;
					return week;
				});
				resolve(scoreList);
			}).catch(reject);
		});
	}

	getHistoricalScores(alderman.pid, from1, to1).then(list => {
		list.forEach(week => {
			var score = sumScores(week.scores);
			console.log(moment(week.from).format('M/D') + ': ' + score);
		});
	});

	getHistoricalScores(alderman.pid, from2, to1).then(list => {
		list.forEach(week => {
			var score = sumScores(week.scores);
			console.log(moment(week.from).format('M/D') + ': ' + score);
		});
	});

	


	module.attachReport = (div, player) => {
		div.addEventListener('click', e => {
			console.log(player);
		});
		return div;
	}

	return module;

}