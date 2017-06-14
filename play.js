let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

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
		from: new Date('4/1/2017').getTime(),
		to: new Date('4/30/2017').getTime()
	}
});
sm.init().then(playerMap => {

	window.playerMap = playerMap;
	var loadingScreen = document.getElementById('loading');
		loadingScreen.style.display = 'none';

	let leagueView = CustomRosterView('whole-league', {
		module: sm,
		system: MAIN_SCORING_SYSTEM,
		columns: ['name', 'ward', 'total', 'breakdown', 'add']
	});

	let rosterMap = {};
	let count = 0;
	for(let pid in playerMap){
		if(count < 3){
			rosterMap[pid] = playerMap[pid];
			count++;
		}
	}

	let rosterView = CustomRosterView('your-roster', {
		module: getChildModule(sm, rosterMap),
		system: MAIN_SCORING_SYSTEM,
		columns: ['name', 'ward', 'total', 'drop']
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

	rosterView.on('drop', (player) => {
		delete rosterView.module.players[player.pid];
		rosterView.render();
	});

}).catch((err) => {
	console.trace();
	console.error(err);
});







