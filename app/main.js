
// Global Variables
var USER = {};



// Write Functions

var createLeague = new Vue({
	el: '#league',
	data: {
		name: "",
		start: -1,
		end: -1,
		users: []
	}
});


var Application = {

	// Read Functions

	// userLogin should use google authentication to get the user's id
	userLogin: () => {
		USER['userid'] = "userid0001";
		console.log("Logged in as user: " + USER['userid']);
		// optional function call, to chain the process
		Application.getUser();
	},

	// Once the userLogin is called, call this function to get user info based on user id
	getUser: () => {
		Database.getUser(USER['userid']).then(function(result) {
			USER['name'] = result['name'];
			console.log(USER);
		}, function(err) {
			console.log(err);
		});
	}

}

