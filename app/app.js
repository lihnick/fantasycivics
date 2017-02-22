
// Global Variables
var Verbose = true;
var USER = {};
var Database = InitDatabase();
var test;

var log = console.log;
var debug = (item) => {
	if (Verbose) {
		console.log(item);
		test = item;
	}
}
if (!Verbose) console.log("Debugging has been turned off.");

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
					range: "",
					start: -1,
					end: -1,
					users: [],
					invite: ''
				}, 
				methods: {
					inviteUsers: () => {
						var tmp = APP['newLeague'];
						debug(APP);
						if (tmp.invite) {
							tmp.users.push(tmp.invite);
							tmp.invite = "";
						} else {
							alert("No Inputs");
						}
					},
					finalizeLeague: () => {
						var tmp = APP['newLeague'];
						if (tmp.name && tmp.users.length > 0) {
							var result = {
								name: tmp.name,
								start: tmp.start,
								end: tmp.end,
								users: tmp.users
							}
							log("Starting Game (Without the current user, current user info is retrieved from userLogin())");
							debug(result);
						} else {
							alert("Invalid Game");
						}
					}
				}
			});

			$(function() {
				$("#datepicker").datepicker({
					showOtherMonths: true,
					selectOtherMonths: true,
					altField: "#displayDate",
					altFormat: "'Ending on' DD, d MM, yy",
					onSelect: function() { // debugging purposes
						var start = new Date();
						var end = $(this).datepicker('getDate');
						log(start + " -- " + end);
						log(start.getTime() + " (Floored: " + Util.floorTimestamp(start.getTime()) + ") -- " + end.getTime());
						log(start.toLocaleDateString() + " -- " + end.toLocaleDateString());

						if ((Math.floor(( end - start ) / 86400000) + 1) < 1) 
							log("Invalid Date: " +  (Math.floor(( end - start ) / 86400000) + 1) + " days in duration.");
						else
							log("Duration: " + (Math.floor(( end - start ) / 86400000) + 1) + " days.");
						APP['newLeague'].range = $(this).datepicker('getDate');
					}
				});
			});

		},

		// Read Functions


		// Check local storage for users that are logged in from previous sessions 
		getUser: () => {
			// At minimum userid is required to identify a user
			if (localStorage.userid === undefined) {
				log("No user logged in.");
				return false;
			}
			else {
				USER.userid = localStorage.userid;
				USER.name = localStorage.name;
				USER.image = localStorage.image;
				USER.email = localStorage.email;
				debug(USER);
				document.getElementById("name").innerHTML = USER.name;
				document.getElementById("email").innerHTML = USER.email;
				document.getElementById("image").src = USER.image;
				return true;
			}

		},

		userLogout: () => {
			localStorage.removeItem("userid");
			localStorage.removeItem("name");
			localStorage.removeItem("email");
			localStorage.removeItem("image");
			window.location.href = "index.html";
		},

		// userLogin should use google authentication to get the user's id
		userLogin: () => {
			Database.Auth.signInUser().then(function(result) {
				log(result);
				localStorage.userid = result.userid;
				localStorage.name = result.name;
				localStorage.image = result.image;
				localStorage.email = result.email;
				window.location.href = "app.html";
			}, function(err) {
				alert(err);
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

