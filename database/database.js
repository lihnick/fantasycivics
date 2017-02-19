function InitDatabase(){

var config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
var DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Database');

var db = DatabaseFirebase.database();

var League = DatabaseLeague();
var Scoring = DatabaseScoring();

function getBotMap(){
	return new Promise((resolve, reject) => {
		try{
			var ref = db.ref('users');
			var query = ref.orderByChild('bot').startAt(true).endAt(true);
			query.once('value', (snapshot) => {
				var botMap = snapshot.val();
				resolve(botMap);
			});
		}
		catch(err){
			reject(err);
		}
	});
}

var Database = {

	Auth: DatabaseAuth(DatabaseFirebase),
	Scoring: Scoring,

	updateUser: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}

		return new Promise((resolve, reject) => {
			var ref = db.ref('users/' + params.userid);
			ref.once('value', (snapshot) => {
				if(snapshot.exists()){
					var userData = snapshot.val();
					var newData = {
						name: params.name || userData.name,
						image: params.image || userData.image,
						email: params.email || userData.image
					}
					ref.set(newData).then(() => {
						resolve({
							success: true,
							newUser: false
						});
					});
				}
				else{
					ref.set(params).then(() => {
						resolve({
							success: true,
							newUser: true
						});
					});
				}
			}).catch(reject);
		});
	},
	
	getUser: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}

		return new Promise((resolve, reject) => {
			var ref = db.ref('users/' + params.userid);
			ref.once('value', (snapshot) => {
				if(!snapshot.exists()){
					reject('User {userid: ' + params.userid + '} not found.');
				}
				else{
					var userData = snapshot.val();
					resolve({
						userid: params.userid,
						name: userData.name || false,
						email: userData.email || false,
						image: userData.image || false
					});
				}
			});
		});
	},

	getUserLeagues: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}

		return new Promise((resolve, reject) => {
			var res = {
				userid: params.userid,
				leagues: {}
			}
			var ref = db.ref('leagues');
			ref.once('value', (snapshot) => {
				var leagueMap = snapshot.val();
				for(var lid in leagueMap){
					var league = leagueMap[lid];
					if(params.userid in league.users){
						res.leagues[lid] = {
							name: league.name,
							start: league.start,
							end: league.end,
							users: league.users
						}
					}
				}
				resolve(res);
			}).catch(reject);
		});
	},

	createLeagueInvitation: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}
		if(!params.name){
			params.name = 'Untitled League';
		}

		return new Promise((resolve, reject) => {
			var ref = db.ref('invitations');
			ref.push({
				league: {
					name: params.name,
					creator: params.userid
				}
			}).then((node) => {
				Database.acceptLeagueInvitation({
					userid: params.userid,
					inviteid: node.key
				}).then((res) => {
					resolve(res);
				}).catch(reject);
			}).catch(reject);
		});
	},

	acceptLeagueInvitation: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}
		if(!params.inviteid){
			throw new Error('Must specify {inviteid}.');
		}
		
		return new Promise((resolve, reject) => {
			var members = db.ref('invitations/' + params.inviteid + '/members/' + params.userid);
			members.set({
				userid: params.userid,
				accepted: Date.now()
			}).then(() => {
				resolve({
					success: true,
					inviteid: params.inviteid
				});
			}).catch(reject);
		});
	},

	getLeagueInvitations: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}

		return new Promise((resolve, reject) => {
			var ref = db.ref('invitations');
			var query = ref.orderByChild('league/creator').startAt(params.userid).endAt(params.userid);
			query.once('value', (snapshot) => {
				var res = snapshot.val();
				resolve(res);
			}).catch(reject);
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
		if(!params.leagueid){
			throw new Error('Must specify {leagueid}.');
		}
		else if(!params.from){
			throw new Error('Must specify {from}.');
		}
		else if(!params.to){
			throw new Error('Must specify {to}.');
		}
		
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
					var q = Database.getUser({
						userid: uid
					});
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
	},

	getRoster: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}
		else if(!params.leagueid){
			throw new Error('Must specify {leagueid}.');
		}
		else if(!params.from){
			throw new Error('Must specify {from}.');
		}
		else if(!params.to){
			throw new Error('Must specify {to}.');
		}

		return new Promise((resolve, reject) => {
			Database.getLeague(params).then((league) => {
				var playerMap = league.rosters[params.userid];
				if(!playerMap){
					reject('Not roster for user {userid: ' + params.userid + '} found in league {leagueid: ' + params.leagueid + '}.');
				}
				var res = {
					userid: params.userid,
					leagueid: params.leagueid,
					from: params.from,
					to: params.to,
					players: playerMap
				}
				resolve(res);
			}).catch(reject);
		});
	},

	getPlayer: (params) => {
		if(!params.playerid){
			throw new Error('Must specify {playerid}.');
		}
		else if(!PLAYER_MAP[params.playerid]){
			throw new Error('Could not find player {playerid: ' + params.playerid + '}.');
		}
		else if(!params.leagueid){
			console.warn('No {leagueid} specified.');
		}
		else if(!params.from){
			throw new Error('Must specify {from}.');
		}
		else if(!params.to){
			throw new Error('Must specify {to}.');
		}

		return new Promise((resolve, reject) => {
			var playerData = PLAYER_MAP[params.playerid];
			var res = {
				playerid: params.playerid,
				leagueid: params.leagueid,
				from: params.from,
				to: params.to,
				owner: false,
				name: playerData.name,
				ward: playerData.ward,
				starter: false,
				scores: {}
			}
			Database.getLeague(params).then((league) => {
				var onRoster = false;
				for(var uid in league.rosters){
					for(var pid in league.rosters[uid]){
						if(pid === params.playerid){
							res.owner = uid;
							res.starter = league.rosters[uid][pid].starter;
							res.scores = league.rosters[uid][pid].scores;
							onRoster = true;
						}
					}
				}
				if(!onRoster){
					var promises = [];
					for(var dataset in Scoring.DATASETS){
						var p = Scoring.queryDataset(dataset, {
							'$where': Scoring.buildDateQuery('creation_date', params.from, params.to),
							'ward': playerData.ward
						});
						p.playerid = params.playerid;
						p.type = 'score';
						p.dataset = dataset;
						promises.push(p);
					}
					Promise.all(promises).then((packets) => {
						for(var s = 0; s < packets.length; s++){
							var data = packets[s];
							var meta = promises[s];
							if(meta.type === 'score'){
								var dups = data.filter((issue) => { return issue.status == 'Open - Dup' });
								var completed = data.filter((issue) => { return issue.status === 'Completed' });
								res.scores[meta.dataset] = completed.length - dups.length;
							}
						}
					}).then(() => {
						resolve(res);
					}).catch(reject);
				}
				else{
					resolve(res);
				}
			}).catch(reject);
		});
	},

	getMatch: (params) => {
		if(!params.userid){
			throw new Error('Must specify {userid}.');
		}
		else if(!params.leagueid){
			throw new Error('Must specify {leagueid}.');
		}
		else if(!params.on){
			throw new Error('Must specify {on}.');
		}

		return new Promise((resolve, reject) => {
			var res = {
				leagueid: params.leagueid,
				userid: params.userid,
				on: params.on,
				start: false,
				end: false,
				home: false,
				away: false
			}
			var foundDate = false;
			var foundUser = false;
			var ref = db.ref('leagues/' + params.leagueid + '/schedule');
			ref.once('value', (snapshot) => {
				var schedule = snapshot.val();
				for(var week in schedule){
					var games = schedule[week];
					var sampleGame = games[0];
					if(params.on < sampleGame.end && params.on > sampleGame.start){
						foundDate = true;
						for(var gid in games){
							var game = games[gid];
							if(game.home === params.userid || game.away === params.userid){
								foundUser = true;
								res.start = game.start;
								res.end = game.end;
								res.home = game.home;
								res.away = game.away;
								break;
							}
						}
						break;
					}
				}
				if(foundDate && foundUser){
					resolve(res);
				}
				else if(!foundUser){
					reject('Could not find a match for user {userid: ' + params.userid + '} in league {leagueid: ' + params.leagueid + '}.');
				}
				else if(!foundDate){
					reject('There are no matches on {' + new Date(params.on) + '} in league {leagueid: ' + params.leagueid + '}.');
				}
			})
		});
	},

	movePlayer: (params) => {
		if(!params.leagueid){
			throw new Error('Must specify {leagueid}.');
		}
		else if(!params.userid){
			throw new Error('Must specify {userid}.');
		}
		else if(!params.sit){
			throw new Error('Must specify {sit}.');
		}
		else if(!params.start){
			throw new Error('Must specify {start}.');
		}

		return new Promise((resolve, reject) => {
			var ref = db.ref('leagues/' + params.leagueid + '/rosters/' + params.userid);
			ref.once('value', (snapshot) => {
				var players = snapshot.val();
				if(!players){
					reject('No roster for user {userid: ' + params.userid + '} in league {leagueid: ' + params.leagueid + '}');
				}
				else if(!(params.sit in players)){
					reject('Player {sit:playerid: ' + params.sit + '} is not on the roster');
				}
				else if(!(params.start in players)){
					reject('Player {start:playerid: ' + params.start + '} is not on the roster');	
				}
				else if(players[params.sit].starter === false){
					reject('Cannot sit player {playerid: ' + params.sit + '}, already benched.');
				}
				else if(players[params.start].starter === true){
					reject('Cannot start player {playerid: ' + params.start + '}, already starting.');
				}
				else{
					players[params.sit].starter = false;
					players[params.start].starter = true;
					ref.set(players).then(() => {
						resolve({
							success: true
						});
					});
				}
			}).catch(reject);
		});		
	}

}

return Database;

}