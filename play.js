let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

let LOADING_MESSAGES = [
	'Organizing obscure paperwork...',
	'It\'s always a good day to learn about civics.',
	'Fantasy Civics was created with love at ChiHackNight.',
	'Submitting FOIA requests...',
	'Analyzing your alders\' smile...',
	'Calculating your alders\' favorite emoji...'
];

let loadingMessage = document.getElementById('loading-message');
let lidx = Math.floor(Math.random() * LOADING_MESSAGES.length);
loadingMessage.innerText = LOADING_MESSAGES[lidx] || 'Loading Fantasy Civics';

let getEmail = (msg, params) => {
	vex.dialog.prompt({
		message: msg,
		placeholder: 'you@email.com',
		callback: (value) => {
			if(value){
				let email = value.trim();
				let roster = false;
				if(params){
					roster = params.roster || false;
				}
				DatabaseInstance.ref('email-update-list').push({
					email: email,
					timestamp: Date.now(),
					roster: roster
				}).then(done => {
					vex.dialog.alert('You\'re in! We\'ll send monthly updates to ' + email + '.');
				}).catch(err => {
					vex.dialog.alert('Error: ' + err);
				});
			}
		}
	});
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

let fillSpans = (tag, text) => {
	let spans = document.getElementsByClassName(tag);
	for(let s = 0; s < spans.length; s++){
		let span = spans[s];
			span.innerText = text;
	}
}

let params = getQueryParams(document.location.search);
let CIPHER = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';

let now = new Date('5/1/2017');//new Date();
let thisMonth = new Date(now.getFullYear(), now.getMonth());
let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
fillSpans('fill-this-month', moment(thisMonth).format('MMMM'));
fillSpans('fill-last-month', moment(lastMonth).format('MMMM'));

let allPlayers = {};
Object.keys(PLAYER_MAP).forEach(pid => {
	let player = PLAYER_MAP[pid];
		player.pid = pid;
	allPlayers[pid] = player;
});

let sm = ScoringModule({
	database: DatabaseInstance,
	datasets: SOCRATA_DATASETS,
	players: allPlayers,
	range: {
		from: lastMonth.getTime(),
		to: thisMonth.getTime()
	}
});
sm.init().then(playerMap => {

	window.playerMap = playerMap;

	let leagueView = CustomRosterView('whole-league', {
		module: sm,
		system: MAIN_SCORING_SYSTEM,
		columns: ['headshot', 'name', 'ward', 'total', 'breakdown', 'add']
	});

	let rosterMap = {};
	if(params.r){
		let rMap = {};
		let wards = params.r.split('').map(c => CIPHER.indexOf(c) + 1).filter((w,i) => i < 5);
		let players = Object.keys(playerMap).map(pid => playerMap[pid]);
		players.forEach(player => {
			if(wards.indexOf(player.ward) > -1){
				rMap[player.pid] = player;
			}
		});
		rosterMap = rMap;
	}
	if(Object.keys(rosterMap).length < 1){
		let count = 0;
		for(let pid in playerMap){
			if(count < 3){
				rosterMap[pid] = playerMap[pid];
				count++;
			}
		}
	}

	let rosterView = CustomRosterView('your-roster', {
		module: getChildModule(sm, rosterMap),
		system: MAIN_SCORING_SYSTEM,
		columns: ['headshot', 'name', 'ward', 'total', 'breakdown', 'drop']
	});

	leagueView.on('add', (player) => {
		let size = Object.keys(rosterView.module.players).length + 1;
		if(size > 5){
			vex.dialog.alert('Too many players! Drop someone from your roster before adding.');
		}
		else{
			rosterView.module.players[player.pid] = player;
			rosterView.render();
		}
	});

	let displaySelectedPlayer = (data) => {
		let div = PlayerView(data.player, data.module);
		let out = document.getElementById('selected-player');
			out.innerHTML = '';
			out.appendChild(div);
	}

	leagueView.on('view', (data) => {
		displaySelectedPlayer(data);
	});

	rosterView.on('drop', (player) => {
		delete rosterView.module.players[player.pid];
		rosterView.render();
	});

	rosterView.on('view', (data) => {
		displaySelectedPlayer(data);
	});

	let shareRosterBtn = document.getElementById('share-roster');
	shareRosterBtn.addEventListener('click', e => {
		let pMap = rosterView.module.players;
		let rosterHash = '';
		Object.keys(pMap).map(pid => pMap[pid]).forEach(player => {
			let idx = player.ward - 1;
			rosterHash += CIPHER.charAt(idx);
		});
		let url = window.location.origin + window.location.pathname + '?r=' + rosterHash;
		vex.dialog.prompt({
			message: 'Share this link:',
			value: url,
			callback: (value) => {
				getEmail('Want to get an update when new scores are in? We only send one email a month.', {
					roster: rosterHash
				});
			}
		});
	});

	let emailBtn = document.getElementById('email-updates');
	emailBtn.addEventListener('click', e => {
		getEmail('We\'ll send you one email a month to let you know when new scores are in.');
	});

	var loadingScreen = document.getElementById('loading');
		loadingScreen.style.display = 'none';

}).catch((err) => {
	console.trace();
	console.error(err);
});







