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
		scorePlayer: (data) => {
			return data.length;
		}
	},
	{
		name: 'Number of Votes',
		scorePlayer: (data) => {
			return data.filter(entry => entry.type === 'vote').length;
		}
	},
	{
		name: 'Winning Vote',
		scorePlayer: (data) => {
			return data.filter(entry => {
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
		scorePlayer: (data) => {
			return data.filter(entry => {
				return entry.type === 'vote';
			}).filter(entry => {
				let yes = !entry.mayor_sponsored && entry.option === 'yes';
				let no = entry.mayor_sponsored && entry.option === 'no';
				return yes || no;
			}).length;
		}
	}
];