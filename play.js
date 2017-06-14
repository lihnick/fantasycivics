let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

let displayScoredRoster = (id, module, system) => {
	let out = document.getElementById(id);
	out.innerHTML = '';
	let scores = module.scoreByFunction(system);
	let columns = [
		{
			header: 'Name',
			cell: (player) => {
				return player.name;
			}
		},
		{
			header: 'Ward',
			cell: (player) => {
				return player.ward;
			}
		},
		{
			header: 'Total',
			cell: (player) => {
				return player.score;
			}
		}
	];
	for(let bid in system.breakdown){
		let cat = system.breakdown[bid];
		columns.push({
			header: cat.header || 'N/A',
			cell: (player) => {
				/*let div = document.createElement('div');
					div.innerText = player.breakdown[bid].score;
					div.addEventListener('click', e => {
						vex.dialog.alert(cat.text);
					});
				return div;*/
				return player.breakdown[bid].score;
			}
		});
	}
	columns.push({
		header: 'Breakdown',
		cell: (player) => {
			let button = document.createElement('button');
				button.innerText = 'View';
				button.addEventListener('click', e => {
					console.log(player);
					system.clickRow(player, module);
				});
			return button;
		}
	});
	let table = RosterView(scores, {
		module: module,
		columns: columns
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

	window.playerMap = playerMap;

	var loadingScreen = document.getElementById('loading');
	loadingScreen.style.display = 'none';

	displayScoredRoster('whole-league', sm, MAIN_SCORING_SYSTEM);

	let rosterMap = {};
	let count = 0;
	for(let pid in playerMap){
		if(count < 5){
			rosterMap[pid] = playerMap[pid];
			count++;
		}
	}

	console.log(rosterMap);

	let cm = getChildModule(sm, rosterMap);
	displayScoredRoster('your-roster', cm, MAIN_SCORING_SYSTEM);

}).catch(console.error);







