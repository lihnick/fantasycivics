var Util = {
	
	uniqueList: (list) => {
		return [...new Set(list)];
	},

	clone: (obj) => {
		return JSON.parse(JSON.stringify(obj));
	},

	getRandomKey: (map) => {
		var list = Object.keys(map);
		var ridx = Math.floor(list.length * Math.random());
		return list[ridx];
	},

	getRandomItem: (input) => {
		var list = input;
		// Defend map case later
		var ridx = Math.floor(list.length * Math.random());
		return list[ridx];
	},

	floorTimestamp: (ts) => {
		var td = new Date(ts);
		// SHOULD I USE UTC????
			td.setMilliseconds(0);
			td.setSeconds(0);
			td.setMinutes(0);
			td.setHours(0);
		var nts = td.getTime();
		return nts;
	},

	checkValidTimestamp: (ts, name) => {
		try{
			new Date(ts);
		}
		catch(e){
			throw new Error('Invalid timestamp: ' + name);
		}
	}

}