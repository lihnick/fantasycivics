var c1 = '-Ke5VqjCfDrMlPHuUixl';
var cd = new Date('2/6/2017').getTime();
var cu = 'RN3RCWtVE6SL5WE9NDPTfLVhQEH2';

var Database = InitDatabase();
var USER = false;
var KNOWN_USERS = {};
var SIMULATION_TIME = false;
var LEAGUE_ID = false;

function stopLoading(){
	var loading = document.getElementById('loading');
	var scorePage = document.getElementById('score-page');
	loading.style.display = 'none';
	scorePage.style.display = 'block';
}

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

var allPlayers = {};

function render(){

	localStorage.setItem('leagueid', LEAGUE_ID);

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

			//homeUser = zeroScores(homeUser);
			//awayUser = zeroScores(awayUser);

			for(var hid in homeUser.players){
				homeUser.players[hid].home = true;
				allPlayers[hid] = homeUser.players[hid];
			}
			for(var aid in awayUser.players){
				awayUser.players[aid].home = false;
				allPlayers[aid] = awayUser.players[aid];
			}

			var boxScoreDiv = renderBoxScore(match, homeUser, awayUser, league);
			var parent = document.getElementById('box-score');
			parent.appendChild(boxScoreDiv);
			var load = document.getElementById('loading-box-score');
			load.style.display = 'none';

			stopLoading();
			simulateMatch(match, allPlayers);

			Database.getLeaderboard({
				leagueid: league.leagueid
			}, league).then((leaderboard) => {
				var boardDiv = renderLeaderboard(leaderboard.rankings, leaderboard.records, league);
				var parent2 = document.getElementById('leaderboard');
				parent2.appendChild(boardDiv);
				var load2 = document.getElementById('loading-leaderboard');
				load2.style.display = 'none';
			}).catch(displayError);

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
		h2.innerText = 'Week ' + (match.week + 1) + ' Matchup';
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
					text: 0 //scores.home.lineup
				},
				'',
				'',
				{
					id: 'score-away-lineup',
					text: 0 //scores.away.lineup
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
				text: 0 //scoreFromMap(homePlayer.scores)
			},
			SPACER,
			awayPlayer.name,
			{
				id: 'score-' + awayPlayer.playerid,
				text: 0 //scoreFromMap(awayPlayer.scores)
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
					text: 0 //scores.home.bench
				},
				'',
				'',
				{
					id: 'score-away-bench',
					text: 0 //scores.away.bench
				}
			]);
	var playerTable = createDOMTable(false, rows);
	div.appendChild(h2);
	var bigScore = renderBigScore();
	div.appendChild(bigScore);
	var p = document.createElement('p');
	var winTeam = (match.winner === match.home) ? 'home' : 'away';
	var loseTeam = (match.winner === match.home) ? 'away' : 'home';
	p.innerText = league.users[match.winner].name + ' wins ' + scores[winTeam].lineup + ' - ' + scores[loseTeam].lineup + '.'
	p.id = 'game-result';
	p.style.display = 'none';
	div.appendChild(p);
	div.appendChild(playerTable);
	return div;
}

function getWrappedIndex(list, index){
	var idx = index % list.length;
	return idx;
}

function shuffleWithSeed(list, seed){
	var seed = seed.toLowerCase();
	var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
	var newList = [];
	while(list.length > 0){
		var sidx = getWrappedIndex(seed, newList.length);
		var letter = seed[sidx];
		var aidx = getWrappedIndex(list, alphabet.indexOf(letter));
		var nextItem = list.splice(aidx, 1)[0];
		newList.push(nextItem);
	}
	return newList;
}

var LIVE_TIMEOUT = 3000;
var FLASH_TIMEOUT = 750;

var ticker = {
	done: false,
	queue: [],
	total: 0
}

function simulateMatch(match, players){
	var step = (match.end - match.start) / 1;
	var nextTime = match.start + step;
	simulateMatchStep(match, players, match.start, nextTime, step, false);
}

function simulateMatchStep(match, players, startTime, endTime, step, lastRun){

	var doStep = new Promise((resolve, reject) => {
		var Scoring = Database.Scoring;
		var promises = [];
		for(dataset in Scoring.DATASETS){
			for(var pid in players){
				var p = Scoring.queryDataset(dataset, {
					from: startTime,
					to: endTime,
					ward: players[pid].ward
				});
				p.pid = pid;
				p.time = endTime;
				p.dataset = dataset;
				p.home = players[pid].home;
				promises.push(p);
			}
		}

		//promises = shuffle(promises);
		promises = shuffleWithSeed(promises, 'fantasycivics');
		ticker.total = promises.length;

		Promise.all(promises).then((data) => {
			data.forEach((update, i) => {
				var meta = promises[i];
				var score = Scoring.scoreData(update, meta.dataset, match.start, meta.time);
				if(score !== 0){
					ticker.queue.push({
						data: update,
						score: score,
						pid: meta.pid,
						time: meta.time,
						dataset: meta.dataset,
						home: meta.home
					});
				}
			});
			renderTicker(players, match);
			resolve(true);
		});
	});
	doStep.then(() => {
		var newTime = endTime + step;
		var last = false;
		var terminate = false;
		if(endTime === match.end){
			terminate = true;
		}
		if(newTime > match.end){
			last = true;
			newTime = match.end;
		}
		if(!lastRun){
			if(!terminate){
				console.log('second call')
				simulateMatchStep(match, players, endTime, newTime, step, last);
			}
		}
		else{
			console.log('All game data fetched.')
		}
	});
}

function prependChild(parent, node){
	parent.insertBefore(node, parent.firstChild);
}

function pushToFeed(tick){
	var feed = document.getElementById('ticker-feed');
	var fp = document.createElement('p');
	if(tick.style){
		fp.appendChild(tick);
	}
	else{
		fp.innerText = tick;
	}
	prependChild(feed, fp);
	return fp;
}

// S/O: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

var MINUTES = 1000 * 60;
var HOURS = MINUTES * 60;

function leftPad(n){
	if(n === 0){
		return '00';
	}
	else{
		return n;
	}
}

function renderTicker(players, match){

	var lastTick = Date.now();

	var cidx = setInterval(() => {
		//console.log(((Date.now()-lastTick)/1000).toFixed(1) + ' secs');
		lastTick = Date.now();
		if(ticker.queue.length > 0){

			//console.log(ticker.queue.length)
			var next = ticker.queue.shift();

			var gameClock = document.getElementById('game-clock');
			var remaining = (ticker.queue.length / ticker.total) * (match.end - match.start);
			var hoursLeft = remaining / HOURS;
			var minutesLeft = (remaining % HOURS) / MINUTES;
			gameClock.innerText = Math.floor(hoursLeft) + ':' + leftPad(Math.floor(minutesLeft));

			var word = (next.score > 0) ? 'fixed' : 'missed';
			var tick = 'Ward ' + players[next.pid].ward + ' ' + word + ' ' + Math.abs(next.score) + ' ' + Database.Scoring.DATASETS[next.dataset].name.toLowerCase();
			var updateMeta = players[next.pid].name;
			if(next.score !== 0){
				//console.log(tick);
				var node = document.createElement('div');
				var met = document.createElement('p');
					met.classList.add('feed-meta');
					met.innerText = updateMeta;
				var upd = document.createElement('p');
					upd.classList.add('feed-item');
					upd.innerText = tick;
				node.appendChild(met);
				node.appendChild(upd);
				var fp = pushToFeed(node);
				var feedFlash = (next.score > 0) ? 'green' : 'red';
				flashDiv(fp, feedFlash);
				updateScoreFromTick(next, players);
			}
		}
		else{
			clearInterval(cidx);
			pushToFeed('Game over.');
			var gameRes = document.getElementById('game-result');
			gameRes.style.display = 'block';
			var ldbd = document.getElementById('leaderboard-container');
			ldbd.style.display = 'inline-block';
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
		var flash = (newScore > currentScore) ? 'green' : 'red';
		flashDiv(scoreSlot, flash);
	}
	var starter = players[update.pid].starter;
	var tid = 'score-' + (update.home ? 'home' : 'away') + '-' + (starter ? 'lineup' : 'bench');
	var teamScoreSlot = document.getElementById(tid);
	var currentTeamScore = parseInt(teamScoreSlot.innerText, 10);
	var newTeamScore = currentTeamScore + update.score;
	if(newTeamScore !== currentTeamScore){
		teamScoreSlot.innerText = newTeamScore;
		var teamFlash = (newTeamScore > currentTeamScore) ? 'green' : 'red';
		flashDiv(teamScoreSlot, teamFlash);
	}
	//
	if(starter){
		var starter = players[update.pid].starter;
		var tid = 'big-score-' + (update.home ? 'home' : 'away');
		var teamScoreSlot = document.getElementById(tid);
		var currentTeamScore = parseInt(teamScoreSlot.innerText, 10);
		var newTeamScore = currentTeamScore + update.score;
		if(newTeamScore !== currentTeamScore){
			teamScoreSlot.innerText = newTeamScore;
			var teamFlash = (newTeamScore > currentTeamScore) ? 'green' : 'red';
			flashDiv(teamScoreSlot, teamFlash);
		}
	}
	//
	}
	catch(e){
		console.log(id)
		console.log(update)
		console.log(players)
		console.log(scoreSlot)
		console.log(document.getElementById(id.trim() + ''))
	}
}

function flashDiv(el, color){
	el.style.background = color;
	el.style.color = 'white';
	setTimeout(() => {
		el.style.background = 'transparent';
		el.style.color = 'black';
	}, FLASH_TIMEOUT);
}

function renderLeaderboard(rankings, records, league){
	var div = document.createElement('div');
	var h2 = document.createElement('h2');
		h2.innerText = league.name;
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
	return div;	
}

function renderBigScore(){
	var div = document.createElement('div');
		div.classList.add('big-score');
	var home = document.createElement('h1');
		home.id = 'big-score-home';
		home.innerText = '0';
	var away = document.createElement('h1');
		away.id = 'big-score-away';
		away.innerText = '0';
	div.appendChild(home);
	div.appendChild(away);
	return div;
}
