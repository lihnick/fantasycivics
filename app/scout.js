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

function renderPlayerSelector(holder, players){
	holder.innerHTML = '';
	for(var pid in players){
		var player = players[pid];
		var opt = document.createElement('option');
			opt.value = pid;
			opt.innerText = player.name + ' (Ward ' + player.ward + ')';
			holder.appendChild(opt);
	}
}

var MINUTE = 60 * 1000;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;

function getHistoricalScores(pid, league, weeks){
	var w = weeks || league.schedule.length;
	return new Promise((resolve, reject) => {
		var ranges = [];
		var loopTime = league.start - (w * WEEK);
		while(loopTime < SIMULATION_TIME){
			ranges.push({
				from: loopTime,
				to: loopTime + WEEK
			});
			loopTime += WEEK;
		}
		var promises = [];
		ranges.forEach(range => {
			var p = Database.getPlayer({
				playerid: pid,
				leagueid: LEAGUE_ID,
				from: range.from,
				to: range.to
			});
			promises.push(p);
		});
		Promise.all(promises).then(data => {
			var scores = data.map(playerData => {
				var sum = 0;
				for(var sp in playerData.scores){
					sum += playerData.scores[sp];
				}
				return {
					score: sum,
					from: playerData.from,
					to: playerData.to
				}
			});
			resolve(scores);
		});
	});
}

function renderScoutingReport(pid, league){
	getHistoricalScores(pid, league).then(scores => {
		renderGraph(scores);
	});
}

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
		var ts = (0.5 * (data.to - data.from)) + data.from;
		x_axis.push(ts);
		y_axis.push(data.score);
	});
	return {
		x: x_axis,
		y: y_axis
	}
}

function renderGraph(scores){

	var traces = getTracesFromScores(scores);
	var x_axis = traces.x;
	var y_axis = traces.y;
	var prediction = predictScore(x_axis, y_axis);

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

	Plotly.newPlot('plot', data, layout);

}

function getPlayerNameString(pid){
	var player = PLAYER_MAP[pid];
	return player.name + '(Ward ' + player.ward + ')';
}

function renderPowerRankings(holder, players, league){
	var promises = [];
	for(var pid in players){
		var p = getHistoricalScores(pid, league);
			p.pid = pid;
		promises.push(p);
	}
	function getPlayerPrediction(scores){
		var traces = getTracesFromScores(scores);
		return predictScore(traces.x, traces.y);
	}
	Promise.all(promises).then(playerScores => {
		var list = playerScores.map((ps, idx) => {
			ps.pid = promises[idx].pid;
			return ps;
		});
		var sorted = list.sort((a, b) => {
			var ap = getPlayerPrediction(a);
			var bp = getPlayerPrediction(b);
			return bp.y - ap.y;
		});
		holder.innerHTML = '';
		for(var i = 0; i < 10; i++){
			var pred = sorted[i];
			var name = getPlayerNameString(pred.pid);
			var sign = pred.y > 0 ? '+' : '';
			var li = document.createElement('li');
				li.innerText = sign + pred.y + ' ' + name;
				holder.appendChild(li);
		}
	});
}

function render(){

	Database.getLeague({
		leagueid: LEAGUE_ID,
		from: SIMULATION_TIME,
		to: SIMULATION_TIME
	}).then(league => {
		

		Database.getAllPlayers({
			leagueid: LEAGUE_ID,
			from: SIMULATION_TIME,
			to: SIMULATION_TIME
		}, league).then(players => {

			var sel = document.getElementById('player-selector');
			renderPlayerSelector(sel, players);

			//var ol = document.getElementById('power-rankings');
			//renderPowerRankings(ol, players, league);

			var but = document.getElementById('scouting-button');
			but.addEventListener('click', e => {
				var pid = sel.value;
				renderScoutingReport(pid, league);
			});

			var pids = Object.keys(players);
			renderScoutingReport(pids[0], league);

		});


	});


}