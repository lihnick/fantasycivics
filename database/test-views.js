function renderRosters(roster, uid, userMap){
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
	var entry = userMap[uid];
		h2.innerText = 'Roster for ' + entry.name;
	var table = document.createElement('table');
	var scoreHeaders = Object.keys(Database.Scoring.DATASETS);
	var scoreFill = '';
	var hdr = '';
		hdr += '<tr>'
		hdr += '<td class="player-name">Player</td>'
		hdr += '<td class="center">Ward</td>'
	for(var h = 0; h < scoreHeaders.length; h++){
		hdr += '<td class="center">' + Database.Scoring.DATASET_NAMES[scoreHeaders[h]] + '</td>'
		scoreFill += '<td></td>'
	}
		hdr += '<td class="center">Score</td>'
		hdr += '<td>Status</td>'
		hdr += '</tr>';
	var total = 0;
	var rosterList = Object.keys(roster).map((pid) => {
		roster[pid].playerid = pid;
		return roster[pid];
	}).sort((a, b) => {
		var as = a.starter ? 1 : 0;
		var bs = b.starter ? 1 : 0;
		return bs - as;
	});
	for(var p = 0; p < rosterList.length; p++){
	var player = rosterList[p];
	var score = 0;
	var row = '';
		row += '<tr>'
		row += '<td>' + player.name + '</td>'
		row += '<td class="center">' + player.ward + '</td>'
	for(var h = 0; h < scoreHeaders.length; h++){
		row += '<td class="center">' + player.scores[scoreHeaders[h]] + '</td>'
		score += player.scores[scoreHeaders[h]]
	}
		row += '<td class="center">' + score + '</td>'
		row += '<td>' + (player.starter ? 'Starting' : 'Benched') + '</td>'
		row += '</tr>';
		hdr += row;
		if(player.starter){
			total += score;
		}
	}
		hdr += '<tr><td></td><td></td>' + scoreFill + '<td class="center">' + total + '</td><td>Total</td></tr>'
	table.innerHTML = hdr;
	div.appendChild(h2);
	div.appendChild(table);
	document.body.appendChild(div);
}

function renderSchedule(schedule, league, userMap){
	var dateFormat = 'M/D h:mm A';
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
		h2.innerText = 'League Schedule for ' + league.name;
	var p = document.createElement('p');
		p.innerText += 'Season Starts: ' + moment(league.start).format(dateFormat) + '\n'
		p.innerText += 'Season Ends: ' + moment(league.end).format(dateFormat) + '\n'
	var matchDuration = moment.duration(moment(league.end).diff(league.start));
		p.innerText += 'Match Length: ' + (matchDuration.asDays() / league.schedule.length).toFixed(2) + ' days\n'
	var table = document.createElement('table');
	var hdr = '';
		hdr += '<tr>'
		hdr += '<td>Week</td>'
		hdr += '<td>Away</td>'
		hdr += '<td></td>'
		hdr += '<td>Home</td>'
		hdr += '<td>Start</td>'
		hdr += '<td>End</td>'
		hdr += '</tr>';
	for(var w = 0; w < schedule.length; w++){
		var games = schedule[w];
	for(var h = 0; h < games.length; h++){
		var row = '';
		row += '<tr>'
		row += '<td>Week ' + (w + 1) + '</td>'
		var home = userMap[games[h].home];
		var away = userMap[games[h].away];
		row += '<td>' + away.name + '</td>'
		row += '<td> @ </td>'
		row += '<td>' + home.name + '</td>'
		row += '<td>' + moment(games[h].start).format(dateFormat) + '</td>'
		row += '<td>' + moment(games[h].end).format(dateFormat) + '</td>'
		row += '<tr>'
		hdr += row;
	}
	}
	table.innerHTML = hdr;
	div.appendChild(h2);
	div.appendChild(p);
	div.appendChild(table);
	document.body.appendChild(div);
}