var League = {

	PLAYERS_PER_ROSTER: 5,

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
			var bot = Util.getRandomKey(bots);
			newUsers.push(bots);
			res = newUsers;
		}
		return res;
	},

	/*
	 * Generate schedules for a league of users
	 * Input: list of userids (must be unique and even-length)
	 * Output: some wild data structure
	 */
	generateSchedule: (users) => {
		var schedule = false;
		if(users.length < 1){
			throw new Error('List of userids is empty.');
		}
		else if(users.length % 2 !== 0){
			throw new Error('List of userids must be even in length.');
		}
		else{

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
		else if(Object.keys(players).length < (League.PLAYERS_PER_ROSTER * users.length)){
			throw new Error('Not enough players to fill rosters.');
		}
		else{
			var possiblePlayers = Object.keys(players);
			for(var u = 0; u < users.length; u++){
				var uid = users[u];
				rosterMap[uid] = [];
				for(var p = 0; p < League.PLAYERS_PER_ROSTER; p++){
					var ridx = Math.floor(possiblePlayers.length * Math.random());
					var pid = possiblePlayers.splice(ridx, 1)[0];
					rosterMap[uid].push(pid);
				}
			}
		}
		return rosterMap;
	}

}