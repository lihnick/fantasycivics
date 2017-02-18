
// Global Variables
// var USER = {};

// App APIs
function Application() {

	// Private Variables
	var USER = {};

	// Public Variables
	return {
		// Write Functions

		createLeague: () => {
			Vue.component('invite-list', {
				props: ['invite'],
				template: '\
				<li>\
					{{ invite }}<button v-on:click="$emit(\'pop\')">X</button>\
				</li>'
			});

			if (Application['newLeague']) 
				return Application['newLeague'];
			else {
				Application['newLeague'] = new Vue({
					el: '#newLeague',
					data: {
						name: "",
						start: -1,
						end: -1,
						users: ['userid001', 'userid002', '', '', ''],
						invite: ''
					}, 
					methods: {
						inviteUsers: () => {
							console.log(this);
							this.users.push(this.invite);
							this.invite = '';
						}
					}
				});
			}
		},

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

	};
}

