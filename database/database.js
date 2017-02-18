var Database = {
	
	getUser: (uid) => {
		return new Promise((resolve, reject) => {
			var entry = TEST_USERS[uid] || BOT_MAP[uid];
			resolve(entry);
		});
	},

	createLeague: (params) => {
		return false;
	},

	getLeague: (params) => {
		return new Promise((resolve, reject) => {
			League.getLeague(params.leagueid).then((league) => {
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
						id: params.leagueid,
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