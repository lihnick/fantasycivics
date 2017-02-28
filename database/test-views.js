function renderRosters(roster, uid, league){
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
	var entry = league.users[uid];
		h2.innerText = 'Roster for ' + entry.team + ' (' + entry.name + ')';
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
		hdr += '<td>Lock</td>'
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
		row += '<td>' + moment(Database.getLockTime(games[h])).format(dateFormat) + '</td>'
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

function renderPlayerScores(roster, league, sortFn){
	var dateFormat = 'dddd, M/D/YYYY';

	var div = document.createElement('div');
	var h2 = document.createElement('h2');
		h2.innerText = 'All Players: ' + league.name;
	var para = document.createElement('p');
		para.innerText = 'Scores from ' + moment(league.from).format(dateFormat) + ' to ' + moment(league.to).format(dateFormat) + ':';
	
	var table = document.createElement('table');
	var scoreHeaders = Object.keys(Database.Scoring.DATASETS);
	var hdr = '';
		hdr += '<tr>'
		hdr += '<td class="player-name">Player</td>'
		hdr += '<td class="center">Ward</td>'
	for(var h = 0; h < scoreHeaders.length; h++){
		hdr += '<td class="center">' + Database.Scoring.DATASET_NAMES[scoreHeaders[h]] + '</td>'
	}
		hdr += '<td class="center">Score</td>'
		hdr += '<td>Team</td>'
		hdr += '<td>Status</td>'
		hdr += '</tr>'

	var sumScores = (scoreMap) => {
		var outSum = 0;
		for(var dt in scoreMap){
			outSum += scoreMap[dt];
		}
		return outSum;
	}
	var starterSort = (a, b) => {
		var as = a.starter ? 1 : 0;
		var bs = b.starter ? 1 : 0;
		return bs - as;
	}
	var scoreSort = (a, b) => {
		return sumScores(b.scores) - sumScores(a.scores);
	}
	var wardSort = (a, b) => {
		return a.ward - b.ward;
	}
	var defaultSort = wardSort;
	var sorter = sortFn || defaultSort;

	var rosterList = Object.keys(roster).map((pid) => {
		roster[pid].playerid = pid;
		return roster[pid];
	}).sort(sorter);

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
		row += '<td>' + (player.owner ? league.users[player.owner].team : 'None') + '</td>'
		row += '<td>' + (player.owner ? (player.starter ? 'Starting' : 'Benched') : 'Free Agent') + '</td>'
		row += '</tr>';
		hdr += row;
	}

	table.innerHTML = hdr;
	div.appendChild(h2);
	div.appendChild(para);
	div.appendChild(table);
	document.body.appendChild(div);
}

function createDOMTable(headers, rows){
	function listToRow(list){
		return '<tr>' + list.map((val) => { return '<td>' + val + '</td>'}).join('') + '</tr>';
	}
	var table = document.createElement('table');
	var html = '';
	if(headers){
		html += listToRow(headers);
	}
	for(var r = 0; r < rows.length; r++){
		html += listToRow(rows[r]);
	}
	table.innerHTML = html;
	return table;
}

var rosterSort = (a, b) => {
	var as = a.starter ? 1 : 0;
	var bs = b.starter ? 1 : 0;
	return bs - as;
}

var scoreFromMap = (map) => {
	var score = 0;
	Object.keys(map).map((key) => { score += map[key]; return 0; })
	return score;
}

function renderBoxScore(match, home, away, league){
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
		h2.innerText = 'Week ' + match.week + ' Matchup';
	var rows = [];
	var homeRoster = Object.keys(home.players).map((pid) => { return home.players[pid]; }).sort(rosterSort);
	var awayRoster = Object.keys(away.players).map((pid) => { return away.players[pid]; }).sort(rosterSort);
	var scores = {
		home: {
			lineup: 0,
			bench: 0
		},
		away: {
			lineup: 0,
			bench: 0
		}
	}
	var startingLineup = true;
			rows.push([league.users[match.home].name, '', '', league.users[match.away].name, '']);
			rows.push([league.users[match.home].team, '', '', league.users[match.away].team, '']);
			rows.push(['Player', 'Score', ' - ', 'Score', 'Player']);
			rows.push(['Starting Lineup', '', '', 'Starting Lineup', '']);
	for(var j = 0; j < homeRoster.length; j++){
		var homePlayer = homeRoster[j];
		var awayPlayer = awayRoster[j];
		if(!homePlayer.starter && startingLineup){
			startingLineup = false;
			rows.push([
				'',
				scores.home.lineup,
				'',
				'',
				scores.away.lineup
			]);
			rows.push([
				'Bench',
				'',
				'',
				'Bench',
				''
			]);
		}
		rows.push([
			homePlayer.name,
			scoreFromMap(homePlayer.scores),
			' - ',
			awayPlayer.name,
			scoreFromMap(awayPlayer.scores)
		]);
		if(startingLineup){
			scores.home.lineup += scoreFromMap(homePlayer.scores);
			scores.away.lineup += scoreFromMap(awayPlayer.scores);
		}
		else{
			scores.home.bench += scoreFromMap(homePlayer.scores);
			scores.away.bench += scoreFromMap(awayPlayer.scores);
		}
	}
			rows.push([
				'',
				scores.home.bench,
				'',
				'',
				scores.away.bench
			]);
	var playerTable = createDOMTable(false, rows);
	div.appendChild(h2);
	div.appendChild(playerTable);
	document.body.appendChild(div);	
}

function renderLeaderboard(rankings, records, league){
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
		h2.innerText = league.name + ' Leaderboard';
	var headers = [
		'Rank',
		'Name',
		'Record'
	];
	var rows = rankings.map((user, i) => {
		return [
			(i + 1),
			user.name,
			'(' + user.wins.length + '-' + user.losses.length + ')'
		];
	})
	var playerTable = createDOMTable(headers, rows);
	div.appendChild(h2);
	div.appendChild(playerTable);
	document.body.appendChild(div);	
}
