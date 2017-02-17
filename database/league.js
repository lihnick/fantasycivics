var TEST_USERS = {
	'userid0001': {
		name: 'Derek Eder'
	},
	'userid0002': {
		name: 'Nina Sandlin'
	},
	'userid0003': {
		name: 'Karl Fogel'
	}
}

var TEST_LEAGUE = {
	id: 'test',
	name: 'Test League',
	start: 1487138400000,
	end: 1489554000000,
	users: Object.keys(TEST_USERS),
	bots: BOT_MAP,
	players: PLAYER_MAP
}

var League = {

	STARTERS_PER_ROSTER: 3,
	SITTERS_PER_ROSTER: 2,
	DEFAULT_SEASON_LENGTH: 3,

	/*
	 * Fix list of users for a league
	 * Input: list of userids, map of bot users
	 * Output: list of userids
	 */
	fixUserList: (users, bots) => {
		var res = false;
		if(users.length < 1){
			throw new Error('List of userids is empty.');
		}
		else if(users.length % 2 !== 0){
			var newUsers = Util.clone(users);
			var botid = Util.getRandomKey(bots);
			newUsers.push(botid);
			res = newUsers;
		}
		return res;
	},

	/*
	 * Generate schedules for a league of users
	 * Input: list of userids (must be unique and even-length), number of weeks in season
	 * Output: a list of lists containing the matches for the season
	 */
	generateSchedule: (users, weeksInput) => {
		var schedule = [];
		var weeks = weeksInput || League.DEFAULT_SEASON_LENGTH;
		if(users.length < 1){
			throw new Error('List of userids is empty.');
		}
		else if(users.length % 2 !== 0){
			throw new Error('List of userids must be even in length.');
		}
		else if(weeks < 1){
			throw new Error('Season must be at least one week long');
		}
		else{
			var allWeeks = [];
			var half = Math.floor(users.length / 2);
			for(var a = 1; a < users.length; a++){
				var thisWeek = [];
				for(var u = 0; u < half; u++){
					var nidx = (u + a) % users.length;
					var opponent = users[nidx];
					if(users[u] === opponent){
						throw new Error('A user cannot be matched up against their own team.');
					}
					thisWeek.push({
						home: users[u],
						away: opponent
					});
				}
				allWeeks.push(thisWeek);
			}
			for(var w = 0; w < weeks; w++){
				// Later: Prevent repeated matchups in short leagues
				// Later: Equalize number of home/away matches
				var weekMatches = Util.getRandomItem(allWeeks);
				schedule.push(weekMatches);
			}
		}
		return schedule;
	},
	
	/*
	 * Generate rosters for a league of users from given players
	 * Input: list of userids (must be unique and even-length), map of players
	 * Output: map of rosters to userids
	 */
	generateRosters: (users, players) => {
		var rosterMap = {};
		if(users.length < 1){
			throw new Error('List of userids is empty.');
		}
		else if(users.length % 2 !== 0){
			throw new Error('List of userids must be even in length.');
		}
		else if(Object.keys(players).length < ((League.STARTERS_PER_ROSTER + League.SITTERS_PER_ROSTER) * users.length)){
			throw new Error('Not enough players to fill rosters.');
		}
		else{
			var possiblePlayers = Object.keys(players);
			for(var u = 0; u < users.length; u++){
				var uid = users[u];
				rosterMap[uid] = {};
				for(var p = 0; p < (League.STARTERS_PER_ROSTER + League.SITTERS_PER_ROSTER); p++){
					var ridx = Math.floor(possiblePlayers.length * Math.random());
					var pid = possiblePlayers.splice(ridx, 1)[0];
					rosterMap[uid][pid] = {
						starter: p < League.STARTERS_PER_ROSTER
					}
				}
			}
		}
		return rosterMap;
	},

	generateLeague: (config) => {
		if(!config.users){
			throw new Error('Must provide users in league config.');
		}
		else if(!config.bots){
			throw new Error('Must specify what bots to use in league config.');
		}
		else if(!config.players){
			throw new Error('Must specify what players to use in league config');
		}
		Util.checkValidTimestamp(config.start);
		Util.checkValidTimestamp(config.end);
		var start = Util.floorTimestamp(config.start);
		var end = Util.floorTimestamp(config.end);
		var users = League.fixUserList(config.users, config.bots);
		var rosters = League.generateRosters(users, config.players);
		var schedule = League.generateSchedule(users, config.weeks);
		var usersMap = {};
		for(var u = 0; u < users.length; u++){
			usersMap[users[u]] = {
				team: 'Untitled Team',
				wins: 0,
				losses: 0
			}
		}
		return {
			name: config.name || 'Untitled League',
			start: start,
			end: end,
			users: usersMap,
			schedule: schedule,
			rosters: rosters
		}
	},

	getLeague: (id) => {
		return new Promise((resolve, reject) => {
			// Dummy Data
			var res = false;
			try{
				res = League.generateLeague(TEST_LEAGUE);
				resolve(res);
			}
			catch(err){
				reject(err);
			}
		});
	}

}