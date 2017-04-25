function predictScore(x_axis, y_axis){
	var dy = y_axis[y_axis.length-1] - y_axis[0];
	var dx = x_axis[x_axis.length-1] - x_axis[0];
	var slope = dy / dx;
	var dt = x_axis[1] - x_axis[0];
	var predict_y = (slope * dt) + y_axis[y_axis.length-1];
	var predict_x = dt + x_axis[x_axis.length-1];
	return {
		x: predict_x,
		y: predict_y,
		slope: slope * DAY
	}
}

function getTracesFromScores(scores){
	var x_axis = [];
	var y_axis = [];
	scores.forEach(data => {
		var ts = data.timestamp || false;
		if(!ts){
			ts = (0.5 * (data.to - data.from)) + data.from;
		}
		x_axis.push(ts);
		y_axis.push(data.score);
	});
	return {
		x: x_axis,
		y: y_axis
	}
}

function renderGraph(idStr, scores){

	var traces = getTracesFromScores(scores);
	var x_axis = traces.x;
	var y_axis = traces.y;
	//var prediction = predictScore(x_axis, y_axis);
	var prediction = {
		x: x_axis.pop(),
		y: y_axis.pop()
	}

	x_axis = x_axis.map(ts => {
		var d = new Date(ts);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	});

	var layout = {
		yaxis: {
			title: 'Points Scored'
		},
		xaxis: {
			title: 'Date',
			tickformat: '%m/%d'
		},
		showlegend: true/*,
		legend: {
			orientation: 'h'
		}*/
	}

	var data = [{
		x: x_axis,
		y: y_axis,
		type: 'line',
		name: 'Historical Score'
	}, {
		x: [x_axis[x_axis.length-1], prediction.x],
		y: [y_axis[y_axis.length-1], prediction.y],
		type: 'line',
		name: 'Fantasy Civics Prediction',
		dash: 5
	}];

	Plotly.newPlot(idStr, data, layout);

}

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

	module.sumScores = (scoreMap) => {
		var sum = 0;
		for(var s in scoreMap){
			sum += scoreMap[s];
		}
		return sum;
	}

	module.predictNextScore = (data) => {
		var sum = data.reduce((score, val) => {
			return val + score;
		});
		var avg = sum / data.length;
		return avg;
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
					to: last.to + WEEK,
					//scores: {val: next},
					scores: futureScores,
					projection: true
				});
				// Render Report
				var overReport = document.createElement('div');
					overReport.classList.add('scouting-report-container');
				var report = document.createElement('div');
					report.id = 'scouting-table';
				var h = document.createElement('h2');
					h.innerText = player.name;
					overReport.appendChild(h);
				var hs = document.createElement('h4');
					hs.innerText = 'Alderman for Ward ' + player.ward;
					overReport.appendChild(hs);
				// Over Report Toggle Button
				var togBtn = document.createElement('button');
					togBtn.innerText = 'View Graph';
					togBtn.id = 'scouting-toggle';
				overReport.appendChild(togBtn);
				// Start Table
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
						td2.innerText = Math.round(module.sumScores(week.scores));
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
				overReport.appendChild(report);
				// Graph Start
				var plot = document.createElement('div');
					plot.id = 'scouting-plot';
					plot.style.display = 'none';
				overReport.appendChild(plot);
				var scorePlot = list.map(s => {
					return {
						// from: s.from,
						// to: s.to,
						timestamp: s.from,
						score: module.sumScores(s.scores)
					}
				});
				// End Graph
				var container = document.createElement('div');
					container.appendChild(overReport);
				vex.dialog.alert({
					unsafeMessage: container.innerHTML,
					afterOpen: e => {
						renderGraph('scouting-plot', scorePlot);
						var tTogBtn = document.getElementById('scouting-toggle');
						var tPlot = document.getElementById('scouting-plot');
						var tReport = document.getElementById('scouting-table');
						tTogBtn.addEventListener('click', e => {
							e.preventDefault();
							if(tPlot.style.display === 'none'){
								tPlot.style.display = 'inline-block';
								tReport.style.display = 'none';
								tTogBtn.innerText = 'View Table';
							}
							else{
								tPlot.style.display = 'none';
								tReport.style.display = 'inline-block';
								tTogBtn.innerText = 'View Graph';
							}
						});
					},
					callback: e => {

					}
				});
			});
		});
		return div;
	}

	return module;

}