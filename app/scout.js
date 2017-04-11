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

function renderScoutingReport(pid, league){

	console.log(league);

	var ranges = [];
	var loopTime = league.start - (4 * WEEK);
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
			renderPlayerSelector(sel, players)

			var but = document.getElementById('scouting-button');
			but.addEventListener('click', e => {
				var pid = sel.value;
				renderScoutingReport(pid, league);
			});

		});


	});


}