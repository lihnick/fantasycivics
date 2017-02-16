var League = {

	PLAYERS_PER_ROSTER: 5,
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
		else if(userids.length % 2 !== 0){
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
		var L = this;
		var rosterMap = {};
		if(users.length < 1){
			throw new Error('List of userids is empty.');
		}
		else if(userids.length % 2 !== 0){
			throw new Error('List of userids must be even in length.');
		}
		else if(Object.keys(players).length < L.PLAYERS_PER_ROSTER * users.length){
			throw new Errors('Not enough players to fill rosters.');
		}
		else{

		}
		return rosterMap;
	}

}