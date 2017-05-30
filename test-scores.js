let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

let ss = document.getElementsByClassName('select-system');
for(let s = 0; s < ss.length; s++){
	let selector = ss[s];
	SCORING_SYSTEMS.forEach((system, sidx) => {
		let option = document.createElement('option');
		option.value = sidx;
		option.innerText = system.name;
		selector.appendChild(option);
	});
	selector.addEventListener('change', e => {
		let id = e.target.dataset.holder;
		window.dispatchEvent(new CustomEvent('score-roster', {
			detail: {
				id: id,
				system: e.target.value
			}
		}));
	});
}

let displayScoredRoster = (id, module, system) => {
	let out = document.getElementById(id);
	out.innerHTML = '';
	let h = document.getElementById('h-' + id);
	let scores = module.scoreByFunction(system);
	h.innerText = system.name;
	let table = RosterView(scores, {
		clickRow: system.clickRow,
		module: module
	});
	out.appendChild(table);
	Sortable.initTable(table);
}

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

	//console.log(playerMap);

	var loadingScreen = document.getElementById('loading');
	loadingScreen.style.display = 'none';

	displayScoredRoster('roster1', sm, SCORING_SYSTEMS[0]);
	displayScoredRoster('roster2', sm, SCORING_SYSTEMS[1]);

	window.addEventListener('score-roster', e => {
		let sidx = parseInt(e.detail.system);
		let system = SCORING_SYSTEMS[sidx];
		let id = e.detail.id;
		displayScoredRoster(id, sm, system);
	});

}).catch(console.error);







