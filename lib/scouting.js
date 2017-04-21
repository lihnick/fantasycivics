function ScoutingReport(){

	var module = {};

	module.getHistoricalScores = (pid, from, to) => {
		// Beware of truncation assumptions!
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
					'ward': player.ward
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

	module.attachReport = (div, player, range) => {
		div.classList.add('has-scouting-report');
		div.addEventListener('click', e => {
			console.log(player);
			var hp = module.getHistoricalScores(player.playerid, range.from, range.to);
			hp.then(list => {
				console.log(player.name);
				list.forEach(week => {
					var score = sumScores(week.scores);
					console.log(moment(week.from).format('M/D') + ': ' + score);
				});
			});
		});
		return div;
	}

	return module;

}