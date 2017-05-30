let SOCRATA_DATASETS = {
	pot_holes: {
		name: 'Pot Holes',
		url: '787j-mys9.json'
	},
	graffiti: {
		name: 'Graffit',
		url: 'cdmx-wzbz.json'
	},
	rodent_baiting: {
		name: 'Rodent Baiting',
		url: 'dvua-vftq.json'
	}
}

let SCORING_SYSTEMS = [
	{
		name: 'Number of Events',
		scorePlayer: (player) => {
			return player.data.length;
		}
	},
	{
		name: 'Number of Votes',
		scorePlayer: (player) => {
			return player.data.filter(entry => entry.type === 'vote').length;
		}
	},
	{
		name: 'Winning Vote',
		scorePlayer: (player) => {
			return player.data.filter(entry => {
				return entry.type === 'vote';
			}).filter(entry => {
				let pass = entry.result === 'pass' && entry.option === 'yes';
				let fail = entry.result === 'fail' && entry.option === 'no';
				return pass || fail;
			}).length;
		}
	},
	{
		name: 'Contrarian',
		scorePlayer: (player) => {
			return player.data.filter(entry => {
				return entry.type === 'vote';
			}).filter(entry => {
				return entry.mayor_sponsored && entry.option === 'no';
			}).length;
		},
		clickRow: (player) => {
			console.log(player)
			let n = player.data.filter(entry => {
				return entry.type === 'vote' && entry.mayor_sponsored && entry.option === 'no';
			});
			console.log(n);
			vex.dialog.alert(player.name + ' voted no against the mayor ' + n.length + ' times.');
		}
	},
	{
		name: 'Rodent Baiting',
		scorePlayer: (player, module) => {
			let range = module.range;
			return player.data.filter(entry => {
				return entry.dataset === 'rodent_baiting';
			}).reduce((score, entry) => {
				let comp = entry.status === 'Completed';
				let inRange = false;
				let compOn = entry.completion_date;
				if(compOn){
					let compTime = new Date(compOn).getTime();
					inRange = (compTime < range.to);
				}
				let compInRange = comp && inRange;
				return score + (compInRange ? 1 : -1);
			}, 0);
		},
		clickRow: (player, module) => {
			let rodents = player.data.filter(entry => entry.dataset === 'rodent_baiting');
			let range = module.range;
			let c = rodents.filter(entry => {
				let comp = entry.status === 'Completed';
				let inRange = false;
				let compOn = entry.completion_date;
				if(compOn){
					let compTime = new Date(compOn).getTime();
					inRange = (compTime < range.to);
				}
				let compInRange = comp && inRange;
				return compInRange;
			}).length;
			let u = rodents.filter(entry => {
				let comp = entry.status === 'Completed';
				let inRange = false;
				let compOn = entry.completion_date;
				if(compOn){
					let compTime = new Date(compOn).getTime();
					inRange = (compTime < range.to);
				}
				let compInRange = comp && inRange;
				return !compInRange;
			}).length;
			vex.dialog.alert(player.name + ' closed ' + c + ' rodent baiting requests and left ' + u + ' open, for a score of ' + player.score);
		}
	},
	{
		name: 'Rodent Ruler',
		scorePlayer: (player, module) => {
			let range = module.range;
			let ratRankings = Object.keys(module.players).map(pid => {
				let p = module.players[pid];
				p.pid = pid;
				return p;
			}).map(p => {
				let ratScore = p.data.filter(entry => {
					return entry.dataset === 'rodent_baiting';
				}).reduce((score, entry) => {
					let comp = entry.status === 'Completed';
					let inRange = false;
					let compOn = entry.completion_date;
					if(compOn){
						let compTime = new Date(compOn).getTime();
						inRange = (compTime < range.to);
					}
					let compInRange = comp && inRange;
					return score + (compInRange ? 1 : -1);
				}, 0);
				module.players[p.pid].ratScore = ratScore;
				p.ratScore = ratScore;
				return p;
			}).sort((a, b) => {
				return b.ratScore - a.ratScore;
			}).map(p => p.ocd_person);
			let rank = ratRankings.indexOf(player.ocd_person);
			let topTen = (rank >= 0 && rank <= 9);
			return topTen ? 50 : 0;
		},
		clickRow: (player, module) => {
			let range = module.range;
			let ratScore = player.data.filter(entry => {
				return entry.dataset === 'rodent_baiting';
			}).reduce((score, entry) => {
				let comp = entry.status === 'Completed';
				let inRange = false;
				let compOn = entry.completion_date;
				if(compOn){
					let compTime = new Date(compOn).getTime();
					inRange = (compTime < range.to);
				}
				let compInRange = comp && inRange;
				return score + (compInRange ? 1 : -1);
			}, 0);
			vex.dialog.alert(player.name + ' scored ' + ratScore + ' points on rodent baiting.');
		}
	}
];