let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

let SOCRATA_DATASETS = {
	pot_holes: {
		name: 'Pot Holes',
		url: '787j-mys9.json'
	},
	graffiti: {
		name: 'Graffit',
		url: 'cdmx-wzbz.json'
	},
	rodent_baiting: {
		name: 'Rodent Baiting',
		url: 'dvua-vftq.json'
	}
}

let SCORING_SYSTEMS = [
	{
		name: 'Number of Events',
		scorePlayer: (data) => {
			return data.length;
		}
	},
	{
		name: 'Number of Votes',
		scorePlayer: (data) => {
			return data.filter(entry => entry.type === 'vote').length;
		}
	}
];

let sm = ScoringModule({
	database: DatabaseInstance,
	datasets: SOCRATA_DATASETS,
	players: PLAYER_MAP,
	range: {
		from: new Date('4/1/2017').getTime(),
		to: new Date('4/30/2017').getTime()
	}
});
sm.init().then(playerMap => {

	console.log(playerMap)

	window.addEventListener('score-roster', e => {
		let sidx = parseInt(e.detail.system);
		let system = SCORING_SYSTEMS[sidx];
		let id = e.detail.id;
		let out = document.getElementById(id);
		out.innerHTML = '';

		let scores = sm.scoreByFunction(system.scorePlayer);
		let table = RosterView(scores)
		out.appendChild(table);
		Sortable.initTable(table);
	});

}).catch(console.error);







