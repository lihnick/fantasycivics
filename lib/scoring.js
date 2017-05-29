let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');
let DatabaseInstance = DatabaseFirebase.database();

let ScoringModule = (db) => {

	let ocdNodes = [];

	let module = {
		init: () => {
			return new Promise((resolve, reject) => {
				let ocdRef = db.ref('city_council');
				ocdRef.once('value', snap => {
					let nodes = snap.val() || {};
					ocdNodes = Object.keys(nodes).map(nid => nodes[nid]).sort((a, b) => {
						return a.timestamp - b.timestamp;
					});
					resolve(true);
				}).catch(reject);
			});
		}
	}


}