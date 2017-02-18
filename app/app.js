
// Global Variables
var USER = {};
var test;

// App APIs
function Application() {

	// Private Variables
	//		These variables are function scoped
	var APP = {};

	// Public Variables
	return {

		// Write Functions

		createLeague: () => {
			Vue.component('invite-list', {
				props: ['invite'],
				template: '<li>{{ invite }}<button v-on:click="$emit(\'pop\')">X</button></li>'
			});

			APP['newLeague'] = new Vue({
				el: '#newLeague',
				data: {
					name: "",
					start: -1,
					end: -1,
					users: [],
					invite: ''
				}, 
				methods: {
					inviteUsers: () => {
						var tmp = APP['newLeague'];
						test = APP;
						if (tmp.invite) {
							tmp.users.push(tmp.invite);
							tmp.invite = "";
						} else {
							alert("No Inputs");
						}
					},
					createLeague: () => {
						var tmp = APP['newLeague'];
						if (tmp.name && tmp.users.length > 0) {
							var result = {
								name: tmp.name,
								start: tmp.start,
								end: tmp.end,
								users: tmp.users
							}
							console.log("Starting Game (Without the current user, current user info is retrieved from userLogin())");
							console.log(result);
						} else {
							alert("Invalid Game");
						}
					}
				}
			});
		},

		// Read Functions

		// userLogin should use google authentication to get the user's id
		userLogin: () => {
			USER['userid'] = "userid0001";
			console.log("Logged in as user: " + USER['userid']);
			// optional function call, to chain the process
			Application().getUser();
		},

		// Once the userLogin is called, call this function to get user info based on user id
		getUser: () => {
			Database.getUser(USER['userid']).then(function(result) {
				USER['name'] = result.name;
				console.log(USER);
			}, function(err) {
				console.log(err);
			});
		},

		getUserLeagues: () => {

		},

		getLeague: () => {
			Database.getLeague("-KdEABT6mOvW_ayE5p2Z").then(function(result) {
				console.log(result);
			}, function(err) {
				console.log(err);
			});
		}

	};
}

