var Util = {
	
	uniqueList: (list) => {
		return [...new Set(list)];
	},

	clone: (obj) => {
		return JSON.parse(JSON.stringify(obj));
	}

}