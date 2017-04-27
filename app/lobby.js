var Database = InitDatabase();
var USER = false;

var MINUTE = 60 * 1000;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;

Database.Auth.getCurrentUser().then((user) => {
	Database.getUser({
		userid: user.userid
	}).then((userData) => {
		login(userData);
	}).catch(displayError);
}).catch((err) => {
	if(err === 'No user currently authenticated.'){
		displayMessage('Log in in to play Fantasy Civics!');
	}
	else{
		console.error(err);
	}
});

function login(user){
	USER = user;
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

var loginBtn = document.getElementById('login-button')
loginBtn.addEventListener('click', (e) => {
	Database.Auth.signInUser().then((user) => {
		login(user);
	}).catch(displayError);
});

var SAMPLE_LEAGUE_ID = '-KhTwyzlqYNlG8QF5Nur';
var LEAGUE_ID = false;
var GAME_STARTER = false;

var KNOWN_USERS = {};

var gameSettingAlert = false;

function main(){

	var page = document.getElementById('page');
		page.style.display = 'block';
	var login = document.getElementById('login');
		login.style.display = 'none';

	var params = getQueryParams(document.location.search);
	LEAGUE_ID = params.leagueid || localStorage.getItem('leagueid');

	Database.getLeagueData({
		leagueid: LEAGUE_ID
	}).then(league => {

		var leagueName = document.getElementById('league-name');
			leagueName.innerText = league.name;

		console.log(league)

		var info = getSimulationInfo(league);
		console.log(info);

		var weekStatus = document.getElementById('week-status');

		if(info.gameOver){
			weekStatus.innerText = 'This league\'s season is over.';
		}
		else{
			
			weekStatus.innerText = 'Waiting to start matches for week ' + info.weekNum + '/' + league.schedule.length + '.';

			updateKnownUsers(league.users).then(done => {

				GAME_STARTER = Object.keys(KNOWN_USERS).sort()[0];

				renderLobby({}, KNOWN_USERS, info.weekNum);

				Database.when('rosters_ready', {
					leagueid: LEAGUE_ID
				}, userMap => {
					renderLobby(userMap, KNOWN_USERS, info.weekNum);
				});

				Database.when('matches_set', {
					leagueid: LEAGUE_ID
				}, res => {
					if(gameSettingAlert){
						gameSettingAlert.close();
					}
					var lastWeekStart = info.weekStart - WEEK;
					console.log('matches_ready', res)
					if(res.simulationTime > lastWeekStart){
						var myMatch = false;
						var foundMyWeekIndex = false;
						var myWeekIndex = 0;
						league.schedule.forEach((week, widx) => {
							week.forEach(match => {
								console.log('check_weeks', widx, getMatchTime(match), res.simulationTime)
								if(res.simulationTime > match.start && res.simulationTime < match.end && !foundMyWeekIndex){
									myWeekIndex = widx;
									foundMyWeekIndex = true;
								}
							});
						});
						league.schedule[myWeekIndex].forEach(match => {
							if(match.home === USER.userid || match.away === USER.userid){
								myMatch = match;
							}
						})
						if(myMatch){
							var otherSide = (myMatch.home === USER.userid) ? 'away' : 'home';
							var opponent = KNOWN_USERS[myMatch[otherSide]].name;
							var myWeekNum = myWeekIndex + 1;
							vex.dialog.confirm({
								message: 'Are you ready to view your week ' + myWeekNum + ' match against ' + opponent + '?',
								callback: value => {
									if(value){
										goToMatchView({
											leagueid: LEAGUE_ID,
											on: res.simulationTime
										});
									}
								}
							});
						}
					}
				});

			}).catch(displayError);
		}

	}).catch(displayError);

}

function updateKnownUsers(map){
	return Promise.all(Object.keys(map).filter(userid => {
		return !(userid in KNOWN_USERS);
	}).map(userid => {
		return Database.getUser({
			userid: userid
		}).then(user => {
			KNOWN_USERS[user.userid] = user;
		});
	}));
}

function renderLobby(userStates, userMap, weekNum){
	var holder = document.getElementById('league-players');
	holder.innerHTML = '';
	for(var uid in userMap){
		var user = userMap[uid];
		var ready = userStates[uid] || false;
		var div = renderUser(user, ready);
		holder.appendChild(div);
	}
	if(readyToStart(userStates, userMap)){
		if(USER.userid === GAME_STARTER){
			var btn = document.createElement('button');
				btn.innerText = 'Start Week ' + weekNum + ' Matches';
				btn.addEventListener('click', e => {
					playMatches();
				});
			holder.appendChild(btn);
		}
		else{
			var p = document.createElement('p');
				p.innerText = KNOWN_USERS[GAME_STARTER].name + ' can now start the game!';
			holder.appendChild(p);
		}
	}
	else{
		var p = document.createElement('p');
			p.innerText = 'Some users are still setting their rosters...';
		holder.appendChild(p);
	}
}

function renderUser(user, ready){
	var div = document.createElement('div');
	var name = document.createElement('div');
		name.innerText = user.name + (ready ? ' is ' : ' is not ') + 'ready.';
	div.appendChild(name);
	if(USER.userid === user.userid){
		if(!ready){
			var btn = document.createElement('button');
				btn.innerText = 'I\'m ready!';
				btn.addEventListener('click', e => {
					Database.emit({
						leagueid: LEAGUE_ID,
						userid: USER.userid,
						event: 'rosters_ready' 
					}).then(done => {
						console.log('Ready to play!');
					});
				});
			div.appendChild(btn);
		}
		var btn2 = document.createElement('button');
			btn2.innerText = 'Edit My Roster';
			btn2.addEventListener('click', e => {
				Database.emit({
					leagueid: LEAGUE_ID,
					userid: USER.userid,
					event: 'rosters_not_ready'
				}).then(done => {
					// Redirect to Roster Edit Page
					goToRosterView({
						leagueid: LEAGUE_ID
					});
				});
			})
		div.appendChild(btn2);
	}
	return div;
}

function readyToStart(userStates, userMap){
	var readyCounter = 0;
	for(var uid in userMap){
		var ready = userStates[uid] || false;
		if(ready){
			readyCounter++;
		}
	}
	var allReady = readyCounter === Object.keys(userMap).length;
	return allReady;
}

function playMatches(){

	gameSettingAlert = vex.open('Setting up your league matches...');

	Database.getLeagueData({
		leagueid: LEAGUE_ID
	}).then(league => {

		var promises = [];
		var info = getSimulationInfo(league);

		league.schedule.forEach((week, widx) => {
			week.forEach((match, midx) => {
				if(!match.winner && info.simulationTime > match.start){
					var params = {
						leagueid: LEAGUE_ID,
						userid: match.home,
						on: getMatchTime(match)
					}
					console.log('determine match outcome for: ', params);
					var p = Database.setMatchOutcome(params);
					promises.push(p);
				}
			});
		});

		Promise.all(promises).then(done => {
			Database.emit({
				leagueid: LEAGUE_ID,
				userid: USER.userid,
				event: 'matches_set',
				data: info.simulationTime
			}).then(done => {
				console.log('Successfully set match outcomes.');
			}).catch(displayError);
		}).catch(displayError);

	}).catch(displayError);
}

function getSimulationInfo(league){
	var foundCurrentWeek = false;
	var weekIndex = 0;
	var info = {};
	league.schedule.forEach((week, widx) => {
		var hasWinner = false;
		week.forEach((match, midx) => {
			if(match.winner){
				hasWinner = true;
			}
		});
		if(!hasWinner && !foundCurrentWeek){
			weekIndex = widx;
			foundCurrentWeek = true;
		}
	});
	if(foundCurrentWeek){
		var match = league.schedule[weekIndex][0];
		console.log('Week ' + (weekIndex+1) + '/' + league.schedule.length);
		info.weekNum = (weekIndex+1);
		info.weekIndex = weekIndex;
		info.weekStart = match.start;
		info.weekEnd = match.end;
		info.simulationTime = getMatchTime(match);
		info.gameOver = false;
	}
	else{
		info.gameOver = true;
	}
	return info;
}

function getMatchTime(match){
	return ((0.5) * (match.end - match.start)) + match.start;
}

function goToMatchView(params){
	var uParts = document.location.pathname.split('/');
	var pathname = uParts.slice(0, uParts.length - 1).join('/');
	var url = document.location.origin + pathname + '/live.html' + '?time=' + params.on + '&league=' + params.leagueid;
	document.location = url;
}

function goToRosterView(params){
	localStorage.setItem('leagueid', params.leagueid);
	var uParts = document.location.pathname.split('/');
	var pathname = uParts.slice(0, uParts.length - 1).join('/');
	var url = document.location.origin + pathname + '/roster.html';
	document.location = url;
}
