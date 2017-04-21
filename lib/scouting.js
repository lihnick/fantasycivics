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

	module.predictNextScore = (data) => {
		var sum = data.reduce((score, val) => {
			return val + score;
		});
		return sum / data.length;
	}

	module.attachReport = (div, player, range) => {
		div.classList.add('has-scouting-report');
		div.addEventListener('click', e => {
			var hp = module.getHistoricalScores(player.playerid, range.from, range.to);
			hp.then(list => {
				// Project Score
				var last = list[list.length-1];
				var futureScores = {};
				for(var did in last.scores){
					var scores = list.map(week => { return week.scores[did]; });
					var next = module.predictNextScore(scores);
					futureScores[did] = Math.round(next);
				}

				list.push({
					//label: 'Projected: ' + moment(last.from + WEEK).format('M/D'),
					from: last.from + WEEK,
					//scores: {val: next},
					scores: futureScores,
					projection: true
				});
				// Render Report
				var report = document.createElement('div');
					report.classList.add('scouting-report-container');
				var h = document.createElement('h2');
					h.innerText = player.name;
					report.appendChild(h);
				var hs = document.createElement('h4');
					hs.innerText = 'Alderman for Ward ' + player.ward;
					report.appendChild(hs);
				var p = document.createElement('p');
					p.innerHTML = 'Projected scores are <span class="projected-score">italicized</span>.';
					report.appendChild(p);
				var table = document.createElement('table');
				var thead = document.createElement('thead');
				var th1 = document.createElement('th');
					th1.innerText = 'Week';
				var th2 = document.createElement('th');
					th2.innerText = 'Total';
					thead.appendChild(th1);
					thead.appendChild(th2);
				for(var did in last.scores){
					var hd = document.createElement('th');
					hd.innerText = Database.Scoring.DATASET_NAMES[did];
					thead.appendChild(hd);
				}
					table.appendChild(thead);
				list.forEach(week => {
					var tr = document.createElement('tr');
					if(week.projection){
						tr.classList.add('projected-score');
					}
					var td1 = document.createElement('td');
					if(week.label){
						td1.innerText = week.label;
					}
					else{
						td1.innerText = moment(week.from).format('M/D');
					}
					var td2 = document.createElement('td');
						td2.innerText = Math.round(sumScores(week.scores));
						tr.appendChild(td1);
						tr.appendChild(td2);
					for(var did in week.scores){
						var sd = document.createElement('td');
						sd.innerText = Math.round(week.scores[did]);
						tr.appendChild(sd);
					}
					table.appendChild(tr);
				});
				report.appendChild(table);
				var container = document.createElement('div');
					container.appendChild(report);
				vex.dialog.alert({
					unsafeMessage: container.innerHTML,
					callback: e => {

					}
				});
			});
		});
		return div;
	}

	return module;

}