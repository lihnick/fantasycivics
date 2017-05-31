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
		breakdown: {
			council: {
				score: 0,
				text: 'City Council Actions'
			},
			311: {
				score: 0,
				text: '311 Requests'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			updateScore('311', player.data.filter(entry => entry.type === '311').length);
			updateScore('council', player.data.filter(entry => entry.type !== '311').length);
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	},
	{
		name: 'Number of Votes',
		breakdown: {
			votes: {
				score: 0,
				text: 'City Council Votes'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			updateScore('votes', player.data.filter(entry => entry.type === 'vote').length);
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	},
	{
		name: 'Winning Vote',
		breakdown: {
			pass: {
				score: 0,
				text: 'Sided with a passing vote.'
			},
			fail: {
				score: 0,
				text: 'Sided against a failing vote.'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			return player.data.filter(entry => {
				return entry.type === 'vote';
			}).forEach(entry => {
				let pass = entry.result === 'pass' && entry.option === 'yes';
				let fail = entry.result === 'fail' && entry.option === 'no';
				if(pass){
					updateScore('pass', 1);
				}
				else if(fail){
					updateScore('fail', -1);
				}
			});
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	},
	{
		name: 'Contrarian',
		breakdown: {
			contrarian: {
				score: 0,
				text: 'Voted Against a Mayor-Sponsored Bill'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			player.data.filter(entry => {
				return entry.type === 'vote';
			}).forEach(entry => {
				if(entry.mayor_sponsored && entry.option === 'no'){
					updateScore('contrarian', 1);
				}
			});
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	},
	{
		name: 'Rodent Ruler',
		breakdown: {
			closed: {
				score: 0,
				text: 'Closed Requests'
			},
			open: {
				score: 0,
				text: 'Open Requests'
			},
			bonus: {
				score: 0,
				text: 'Top Ten Wards for Rodent Baiting'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			let range = module.range;
			player.data.filter(entry => {
				return entry.dataset === 'rodent_baiting';
			}).forEach(entry => {
				let comp = entry.status === 'Completed';
				let inRange = false;
				let compOn = entry.completion_date;
				if(compOn){
					let compTime = new Date(compOn).getTime();
					inRange = (compTime < range.to);
				}
				let compInRange = comp && inRange;
				if(compInRange){
					updateScore('closed', 1);
				}
				else{
					updateScore('open', -1);
				}
			});
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
			if(topTen){
				updateScore('bonus', 50);
			}
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	},
	{
		name: 'Sponsorships',
		breakdown: {
			primary_pass: {
				score: 0,
				text: 'Primary Sponsor of Passing Bill'
			},
			other_pass: {
				score: 0,
				text: 'Sponsor of Passing Bill'
			},
			primary_fail: {
				score: 0,
				text: 'Primary Sponsor of Failing Bill'
			},
			other_fail: {
				score: 0,
				text: 'Sponsor of Failing Bill'
			}
		},
		scorePlayer: (player, module, updateScore) => {
			player.data.filter(entry => entry.type === 'sponsorship').forEach(entry => {
				let primary = entry.classification === 'Primary';
				let passed = entry.result === 'pass';
				if(primary){
					if(passed){
						updateScore('primary_pass', 10);
					}
					else{
						updateScore('primary_fail', -5);
					}
				}
				else{
					if(passed){
						updateScore('other_pass', 5);
					}
					else{
						updateScore('other_fail', -1);
					}
				}
			});
		},
		clickRow: (player, module) => {
			module.showBreakdown(player);
		}
	}
];