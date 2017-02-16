var Database = {
	
	getLeague: (params) => {
		return new Promise((resolve, reject) => {
			League.getLeague(params.leagueid).then((league) => {
				var rosters = league.rosters;
				var scorePromises = [];
				for(var uid in rosters){
					var roster = rosters[uid];
					for(var pid in roster){
						var p = Scoring.queryDataset('pot_holes', {
							'$where': Scoring.buildDateQuery('creation_date', params.from, params.to),
							'ward': PLAYER_MAP[pid].ward
						});
						p.uid = uid;
						p.pid = pid;
						scorePromises.push(p);
					}
				}
				Promise.all(scorePromises).then((scores) => {
					for(var s = 0; s < scores.length; s++){
						var data = scores[s];
						var meta = scorePromises[s];
						rosters[meta.uid][meta.pid].scores = {
							pot_holes: data.length
						}
					}
				}).then((scores) => {
					var response = {
						id: params.leagueid,
						name: league.name,
						start: league.start,
						end: league.end,
						from: params.from,
						to: params.to,
						users: league.users,
						rosters: rosters
					}
					resolve(response);
				})
			}).catch(reject);
		});
	}

}