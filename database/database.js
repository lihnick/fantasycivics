var config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');

var db = DatabaseFirebase.database();

function getBotMap(){
	return new Promise((resolve, reject) => {
		try{
			var ref = db.ref('users');
			ref.orderByChild('bot').equalTo(true).on('child_added', (snapshot) => {
				var bot = snapshot.val();
				var botMap = {};
					botMap[snapshot.key] = bot;
					resolve(botMap);
			});
		}
		catch(err){
			reject(err);
		}
	});
}

var Database = {
	
	getUser: (uid) => {
		return new Promise((resolve, reject) => {
			var ref = db.ref('users/' + uid);
			ref.once('value', (snapshot) => {
				if(!snapshot.exists()){
					reject('User {userid: ' + uid + '} not found.');
				}
				else{
					var userData = snapshot.val();
					resolve(userData);
				}
			});
		});
	},

	createLeague: (params) => {
		return new Promise((resolve, reject) => {
			getBotMap().then((botMap) => {
				params.players = PLAYER_MAP;
				params.bots = botMap;
				var league = League.generateLeague(params);
				var ref = db.ref('leagues');
				ref.push(league).then((status) => {
					resolve({
						success: true,
						leagueid: status.key
					});
				});
			}).catch(reject)
		});
	},

	getLeague: (params) => {
		return new Promise((resolve, reject) => {
			new Promise((resolveLeague, rejectLeague) => {
				var ref = db.ref('leagues/' + params.leagueid);
				ref.once('value', (snapshot) => {
					if(!snapshot.exists()){
						reject('League {leagueid: ' + params.leagueid + '} not found.');
					}
					else{
						var leagueData = snapshot.val();
						leagueData.leagueid = params.leagueid;
						resolveLeague(leagueData);
					}
				}).catch(rejectLeague);
			}).then((league) => {
				var rosters = league.rosters;
				var userPromises = [];
				var promises = [];
				for(var uid in rosters){
					var q = Database.getUser(uid);
					q.uid = uid;
					q.type = 'user';
					promises.push(q);
					var roster = rosters[uid];
					for(var pid in roster){
						for(var dataset in Scoring.DATASETS){
							var p = Scoring.queryDataset(dataset, {
								'$where': Scoring.buildDateQuery('creation_date', params.from, params.to),
								'ward': PLAYER_MAP[pid].ward
							});
							p.uid = uid;
							p.pid = pid;
							p.type = 'score';
							p.dataset = dataset;
							promises.push(p);
						}
					}
				}
				Promise.all(promises).then((packets) => {
					for(var s = 0; s < packets.length; s++){
						var data = packets[s];
						var meta = promises[s];
						if(meta.type === 'user'){
							league.users[meta.uid].name = data.name;
						}
						else if(meta.type === 'score'){
							rosters[meta.uid][meta.pid].name = PLAYER_MAP[meta.pid].name;
							rosters[meta.uid][meta.pid].ward = PLAYER_MAP[meta.pid].ward;
							if(!rosters[meta.uid][meta.pid].scores){
								rosters[meta.uid][meta.pid].scores = {};
							}
							var dups = data.filter((issue) => { return issue.status == 'Open - Dup' });
							var completed = data.filter((issue) => { return issue.status === 'Completed' });
							rosters[meta.uid][meta.pid].scores[meta.dataset] = completed.length - dups.length;
						}
					}
				}).then(() => {
					var response = {
						leagueid: params.leagueid,
						name: league.name,
						start: league.start,
						end: league.end,
						from: params.from,
						to: params.to,
						schedule: league.schedule,
						users: league.users,
						rosters: rosters
					}
					resolve(response);
				}).catch(reject);
			}).catch(reject);
		});
	}

}