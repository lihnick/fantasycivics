var c1 = '-Ke5VqjCfDrMlPHuUixl';
var cd = new Date('2/6/2017').getTime();
var cu = 'RN3RCWtVE6SL5WE9NDPTfLVhQEH2';

var Database = InitDatabase();
var USER = false;
var KNOWN_USERS = {};
var SIMULATION_TIME = false;
var LEAGUE_ID = false;

Database.Auth.getCurrentUser().then((user) => {
	login(user);
}).catch((err) => {
	if(err === 'No user currently authenticated.'){
		var params = getQueryParams(document.location.search);
		if(params.userid){
			login({
				userid: params.userid
			});
		}
		else{
			displayMessage('Log in in to play Fantasy Civics!');
		}
	}
	else{
		console.error(err);
	}
});

var loginBtn = document.getElementById('login-button')
loginBtn.addEventListener('click', (e) => {
	Database.Auth.signInUser().then((user) => {
		login(user);
	}).catch(displayError);
});

function login(user){
	USER = user;
	KNOWN_USERS[USER.userid] = USER;
	Database.updateUser(user).then((done) => {
		main();
	}).catch(displayError);
}

function getQueryParams(qs) {
	qs = qs.split('+').join(' ');
	var params = {},
		tokens,
		re = /[?&]?([^=]+)=([^&]*)/g;
	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	}
	return params;
}

function displayMessage(message){
	var box = document.getElementById('message-container');
	var output = document.getElementById('message');
	var close = document.getElementById('close-message');
	box.style.display = 'block';
	output.innerText = message;
	close.addEventListener('click', (e) => {
		box.style.display = 'none';
	});
}

function displayError(err){
	console.error(err);
	displayMessage('Error: ' + err.toString());
}

function main(){

	console.log('Logged in as: ', USER);

	var page = document.getElementById('page');
		page.style.display = 'block';
	var login = document.getElementById('login');
		login.style.display = 'none';

	var params = getQueryParams(document.location.search);
	SIMULATION_TIME = parseInt(params.time, 10);
	LEAGUE_ID = params.league;

	if(LEAGUE_ID && SIMULATION_TIME){
		render();
	}
	else if(!LEAGUE_ID && !SIMULATION_TIME){
		displayError('Missing {league} and {time}.');
	}
	else if(!LEAGUE_ID){
		displayError('Missing {league}.');
	}
	else if(!SIMULATION_TIME){
		displayError('Missing {time}.');
	}

}

function render(){

	Database.getMatchScore({
		userid: USER.userid,
		leagueid: LEAGUE_ID,
		on: SIMULATION_TIME
	}).then((score) => {

		var match = score.match;
			match.winner = score.winner;

		var homeUser = {
			userid: match.home,
			leagueid: LEAGUE_ID,
			players: score.rosters[match.home],
			from: match.start,
			to: match.end
		}
		var awayUser = {
			userid: match.away,
			leagueid: LEAGUE_ID,
			players: score.rosters[match.away],
			from: match.start,
			to: match.end
		}

		Database.getLeague({
			leagueid: LEAGUE_ID,
			from: match.start,
			to: match.end
		}).then((league) => {

			homeUser = zeroScores(homeUser);
			awayUser = zeroScores(awayUser);

			var boxScoreDiv = renderBoxScore(match, homeUser, awayUser, league);
			var parent = document.getElementById('box-score');
			parent.appendChild(boxScoreDiv);
			var load = document.getElementById('loading-box-score');
			load.style.display = 'none';

			var frm = 'M/D hh:mm A';
			console.log(moment(match.start).format(frm), moment(match.end).format(frm), match);

			simulateMatch(match, homeUser.players, true);
			simulateMatch(match, awayUser.players, false);

		}).catch(displayError);

	}).catch(displayError);
}

function zeroScores(team){
	for(var pid in team.players){
		for(var sid in team.players[pid].scores){
			team.players[pid].scores[sid] = 0;
		}
	}
	return team;
}

function createDOMTable(headers, rows){
	function listToRow(list){
		return '<tr>' + list.map((val) => {
			if(val.id){
				return '<td id="' + val.id + '">' + val.text + '</td>';
			}
			else{
				return '<td>' + val + '</td>';
			}
		}).join('') + '</tr>';
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
	var SPACER = '<span class="spacer"></span>';
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
			rows.push(['Player', 'Score', SPACER, 'Score', 'Player']);
			rows.push(['Starting Lineup', '', '', 'Starting Lineup', '']);
	for(var j = 0; j < homeRoster.length; j++){
		var homePlayer = homeRoster[j];
		var awayPlayer = awayRoster[j];
		if(!homePlayer.starter && startingLineup){
			startingLineup = false;
			rows.push([
				'',
				{
					id: 'score-home-lineup',
					text: scores.home.lineup
				},
				'',
				'',
				{
					id: 'score-away-lineup',
					text: scores.away.lineup
				}
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
			{
				id: 'score-' + homePlayer.playerid,
				text: scoreFromMap(homePlayer.scores)
			},
			SPACER,
			awayPlayer.name,
			{
				id: 'score-' + awayPlayer.playerid,
				text: scoreFromMap(awayPlayer.scores)
			}
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
				{
					id: 'score-home-bench',
					text: scores.home.bench
				},
				'',
				'',
				{
					id: 'score-away-bench',
					text: scores.away.bench
				}
			]);
	var playerTable = createDOMTable(false, rows);
	div.appendChild(h2);
	var p = document.createElement('p');
	var winTeam = (match.winner === match.home) ? 'home' : 'away';
	var loseTeam = (match.winner === match.home) ? 'away' : 'home';
	p.innerText = league.users[match.winner].name + ' wins ' + scores[winTeam].lineup + ' - ' + scores[loseTeam].lineup + '.'
	//div.appendChild(p);
	div.appendChild(playerTable);
	return div;
}

var LIVE_TIMEOUT = 5000;

var tickerSpace = {
	home: {
		done: false,
		queue: []
	},
	away: {
		done: false,
		queue: []
	}
}

function simulateMatch(match, players, home){

	var step = (match.end - match.start) / 1;
	var nextTime = match.start + step;
	simulateMatchStep(match, players, home, match.start, nextTime, step, false);

}

function simulateMatchStep(match, players, home, startTime, endTime, step, lastRun){

	var frm = 'M/D hh:mm A';
	console.log(moment(startTime).format(frm), moment(endTime).format(frm), moment(match.end).format(frm), lastRun)

	var doStep = new Promise((resolve, reject) => {
		var Scoring = Database.Scoring;
		var promises = [];
		for(dataset in Scoring.DATASETS){
			for(var pid in players){
				var p = Scoring.queryDataset(dataset, {
					'$where': Scoring.buildDateQuery('creation_date', startTime, endTime),
					'ward': players[pid].ward
				});
				p.pid = pid;
				p.time = endTime;
				p.dataset = dataset;
				promises.push(p);
			}
		}

		var ticker = home ? tickerSpace.home : tickerSpace.away;

		Promise.all(promises).then((data) => {
			data.forEach((update, i) => {
				var meta = promises[i];
				ticker.queue.push({
					data: update,
					score: Scoring.scoreData(update, match.start, meta.time),
					pid: meta.pid,
					time: meta.time,
					dataset: meta.dataset,
					home: home
				});
			});
			renderTicker(players, home);
			resolve(true);
		});
	});
	doStep.then(() => {
		var newTime = endTime + step;
		var last = false;
		if(newTime >= match.end){
			last = true;
			newTime = match.end;
		}
		if(!lastRun){
			simulateMatchStep(match, players, home, endTime, newTime, step, last);
		}
		else{
			console.log('All game data fetched.')
		}
	});
}

function renderTicker(players, home){

	var ticker = home ? tickerSpace.home : tickerSpace.away;

	setInterval(() => {
		if(ticker.queue.length > 0){
			var next = ticker.queue.shift();
			var tick = players[next.pid].name + ' scored ' + next.score + ' points on ' + Database.Scoring.DATASET_NAMES[next.dataset];
			if(next.score !== 0){
				//console.log(tick);
				updateScoreFromTick(next, players);
			}
		}
	}, LIVE_TIMEOUT);
	
}

function updateScoreFromTick(update, players){
	try{
	var id = 'score-' + update.pid;
	var scoreSlot = document.getElementById(id);
	var currentScore = parseInt(scoreSlot.innerText, 10);
	var newScore = currentScore + update.score;
	if(newScore !== currentScore){
		scoreSlot.innerText = newScore;
		flashDiv(scoreSlot);
	}
	var starter = players[update.pid].starter;
	var tid = 'score-' + (update.home ? 'home' : 'away') + '-' + (starter ? 'lineup' : 'bench');
	var teamScoreSlot = document.getElementById(tid);
	var currentTeamScore = parseInt(teamScoreSlot.innerText, 10);
	var newTeamScore = currentTeamScore + update.score;
	if(newTeamScore !== currentTeamScore){
		teamScoreSlot.innerText = newTeamScore;
		flashDiv(teamScoreSlot);
	}
	}
	catch(e){
		console.log(id)
		console.log(update)
		console.log(players)
		console.log(scoreSlot)
		console.log(document.getElementById(id.trim() + ''))
	}
}

function flashDiv(el){
	el.style.color = 'red';
	setTimeout(() => {
		el.style.color = 'black';
	}, LIVE_TIMEOUT);
}