var Database = InitDatabase();
var USER = false;
var KNOWN_USERS = {};
var WATCH_LEAGUES = {};
var YOUR_LEAGUES = {};
var STUB = false;

Database.Auth.getCurrentUser().then((user) => {
	Database.getUser({
		userid: user.userid
	}).then((userData) => {
		login(userData);
	}).catch(displayError);
}).catch((err) => {
	if(err === 'No user currently authenticated.'){
		displayMessage('Log in in to play Fantasy Civics!');
		var params = getQueryParams(document.location.search);
		var redirect = 'join.html?code=' + params.code;
		var uParts = document.location.pathname.split('/');
		var pathname = uParts.slice(0, uParts.length - 1).join('/');
		var url = document.location.origin + pathname + '/index.html?redirect=' + redirect;
		document.location = url;
	}
	else{
		console.error(err);
	}
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

var loginBtn = document.getElementById('login-button')
loginBtn.addEventListener('click', (e) => {
	Database.Auth.signInUser().then((user) => {
		login(user);
	}).catch(displayError);
});

function main(){

	var page = document.getElementById('page');
		page.style.display = 'block';
	var login = document.getElementById('login');
		login.style.display = 'none';

	var params = getQueryParams(document.location.search);

	if(params.code){
		Database.acceptLeagueInvitation({
			userid: USER.userid,
			inviteid: params.code
		}).then((res) => {
			render(params.code);
		}).catch(displayError);
	}
	else{
		renderCreatorView();
	}

}

function render(inviteid){
	var clc = document.getElementById('start-league-container');
		clc.style.display = 'none';
	var wlc = document.getElementById('waiting-league-container');
		wlc.style.display = 'block';
	var crb = document.getElementById('league-create');
	var renderProm = renderWaitingRoom(inviteid);
	renderProm.then(done => {
		if(STUB){
			crb.addEventListener('click', e => {
				startLeagueFromStub(STUB, inviteid);
			});
		}
		else{
			crb.style.display = 'none';
		}
		Database.when('people_join', {
			inviteid: inviteid
		}, (res) => {
			renderWaitingRoom(inviteid);
		});
		Database.when('league_created', {
			inviteid: inviteid
		}, res => {
			console.log(res)
			vex.dialog.alert({
				message: 'Ready to join your league?',
				callback: value => {
					if(value){
						goToLobbyView({
							leagueid: res.leagueid
						})
					}
				}
			});
		});
	});
}

function renderWaitingRoom(inviteid){
	return Database.getLeagueInvitations({
		userid: USER.userid
	}).then((userLeagues) => {
		var stub = userLeagues[inviteid];
		if(stub){
			STUB = stub;
			var lwrName = document.getElementById('lwr-name');
				lwrName.innerText = stub.league.name;
			var link = document.location.origin + document.location.pathname;
				link += '?code=' + inviteid;
			var aLink = document.getElementById('league-invite');
				aLink.href = link;
			var ul = document.createElement('ul');
			var promises = [];
			Object.keys(stub.members).forEach(uid => {
				var p = Database.getUser({
					userid: uid
				});
				p.userid = uid;
				promises.push(p);
			});
			Promise.all(promises).then(users => {
				var memDiv = document.getElementById('members');
					memDiv.innerHTML = '';
				users.forEach(user => {
				var li = document.createElement('li');
					li.innerText = user.name;
					ul.appendChild(li);
				});
				memDiv.appendChild(ul);
			});
		}
		else{
			var hideTheWholeThing = document.getElementById('creator-join-page');
			var loadingScreen = document.getElementById('loading');
			loadingScreen.style.display = 'flex';
			hideTheWholeThing.style.display = 'none';
		}
	});
}

function renderCreatorView(){

	var createBtn = document.getElementById('create-button')
	createBtn.addEventListener('click', (e) => {
		createLeagueInvitation();
	});
	
	Database.getLeagueInvitations({
		userid: USER.userid
	}).then((userLeagues) => {
		var selector = document.getElementById('league-select');
		for(var iid in userLeagues){
			var lg = userLeagues[iid];
			var opt = document.createElement('option');
				opt.value = iid;
				opt.innerText = lg.league.name;
			selector.appendChild(opt);
		}
		var selectBtn = document.getElementById('select-button')
		selectBtn.addEventListener('click', (e) => {
			var sel_iid = selector.value;
			render(sel_iid);
		});
	});

}

function createLeagueInvitation(){
	var nameInput = document.getElementById('league-name');
	if(nameInput.value){
		Database.createLeagueInvitation({
			userid: USER.userid,
			name: nameInput.value
		}).then((res) => {
			console.log('Join League with Code: ' + res.inviteid);
			render(res.inviteid);
		}).catch(displayError);
	}
	else{
		displayError('No league name given.');
	}
}

function startLeagueFromStub(stub, inviteid){
	try{
		Database.createLeague({
			name: stub.league.name,
			users: Object.keys(stub.members),
			start: getLatestSunday() - (4 * WEEK),
			end: getLatestSunday(),
			weeks: 4
		}).then((res) => {
			displayMessage('Created League: ' + res.leagueid);
			Database.emit({
				overkey: inviteid,
				leagueid: res.leagueid,
				userid: USER.userid,
				event: 'league_created',
				data: inviteid
			}).then(done => {
				// Created the league
			}).catch(displayError);
		}).catch(displayError);
	}
	catch(err){
		displayError(err);
	}
}

var MINUTE = 60 * 1000;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;

function getLatestSunday(){
	var now = Date.now();
	var d = new Date(now);
	var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	var ts = date.getTime() - DAY;
	while(new Date(ts).getDay() !== 0){
		ts -= DAY;
	}
	return ts;
}

function goToLobbyView(params){
	var uParts = document.location.pathname.split('/');
	var pathname = uParts.slice(0, uParts.length - 1).join('/');
	var url = document.location.origin + pathname + '/lobby.html?leagueid=' + params.leagueid;
	document.location = url;
}
