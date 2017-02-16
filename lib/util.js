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
	}

}