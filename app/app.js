
// Global Variables
var Verbose = true;
var USER = {}; // stores data related to the user that's logged in
// Database as a global variable during development mode
var Database = InitDatabase(); // Moved to private variables, when in production mode
var test; // each time debug is called, the parameter is updated to test, for debugging

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
	var APP = {}; // stores infomation related to Vue.js
	var Constants = {
		logoutRedirect: 'index.html',
		loginRedirect: 'app.html',
		userIdTag: 'userid',
		userEmailTag: 'email',
		userImageTag: 'image',
		userNameTag: 'name'
	};

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

		// displays user info in html elements
		displayUser: () => {
			document.getElementById(Constants.userIdTag).innerHTML = USER.userid;
			document.getElementById(Constants.userNameTag).innerHTML = USER.name;
			document.getElementById(Constants.userEmailTag).innerHTML = USER.email;
			document.getElementById(Constants.userImageTag).src = USER.image;
		},


		// Check local storage for users that are logged in from previous sessions 
		getUser: () => {
			// At minimum userid is required to identify a user
			if (localStorage.userid === undefined) {
				log("No user logged in.");
				return false;
			}
			else {
				USER.userid = localStorage[Constants.userIdTag];
				USER.name = localStorage[Constants.userNameTag];
				USER.email = localStorage[Constants.userEmailTag];
				USER.image = localStorage[Constants.userImageTag];

				// getCurrentUser() will be reset once another page loads
				// Database.Auth.getCurrentUser().then(function(result) {
				// 	log("users should be the same");
				// 	debug(result);
				// 	debug(USER);
				// }, function(err) {
				// 	alert("Database cannot authenticate user");
				// });

				return true;
			}
		},

		userLogout: () => {
			localStorage.removeItem(Constants.userIdTag);
			localStorage.removeItem(Constants.userNameTag);
			localStorage.removeItem(Constants.userEmailTag);
			localStorage.removeItem(Constants.userImageTag);
			Database.Auth.signOutUser(); // not sure if this is needed, but just in case
			window.location.href = Constants.logoutRedirect;
		},

		// userLogin should use google authentication to get the user's id
		userLogin: () => {
			Database.Auth.signInUser().then(function(result) {
				log(result);
				localStorage[Constants.userIdTag] = result.userid;
				localStorage[Constants.userNameTag] = result.name;
				localStorage[Constants.userEmailTag] = result.email;
				localStorage[Constants.userImageTag] = result.image;
				window.location.href = Constants.loginRedirect;
			}, function(err) {
				alert(err);
			});
		},

		getUserLeagues: () => {
			//Database.getUserLeagues({userid: USER.userid}).then(function(result) {
			Database.getUserLeagues({userid: "testuser0001"}).then(function(result) {
				log(result);

				var tmp = Object.keys(result.leagues);
				var leagues = [];
				for (idx in tmp) {
					var usr = Object.keys(result.leagues[tmp[idx]].users);
					var usrLst = [];
					for (i in usr) {
						usrLst.push({
							userid: usr[i],
							team: result.leagues[tmp[idx]].users[usr[i]].team,
							losses: result.leagues[tmp[idx]].users[usr[i]].losses,
							wins: result.leagues[tmp[idx]].users[usr[i]].wins
						});
					}
					leagues.push({
						leagueid: tmp[idx],
						name: result.leagues[tmp[idx]].name,
						start: result.leagues[tmp[idx]].start,
						end: result.leagues[tmp[idx]].end,
						users: usrLst
					});
				}
				log(leagues);
				USER.userLeagues = leagues;
			}, function(err) {
				log(err);
			});
		},

		displayLeagues: () => {


			Vue.component('league-list', {
				props: ['idx'],
				template: '<li>{{ idx.name }} | {{ idx.start }} to {{ idx.end }}<button v-on:click="$emit(\'info\')">info</button></li>'
			});

			APP['displayLeagues'] = new Vue({
				el: '#displayLeagues',
				data: {
					leagueids: Object.keys(USER.userLeagues),
					leagues: USER.userLeagues
				},
				methods: {
					getIdx: (idx) => {
						log(idx);
						log(USER.userLeagues[idx].users);
					}
				}
			});
		},

		getLeague: () => {
			Database.getLeague("-KdEABT6mOvW_ayE5p2Z").then(function(result) {
				console.log(result);
			}, function(err) {
				console.log(err);
			});
		},

		// Gets the user's roster based on a selected league
		getRoster: () => {
			log("Get Roster is currently using a temporary user and league, update when create league, invite users, etc. functions are done.");
			var tmp = {
				userid: 'testuser0001',
				leagueid: '-KdIiWEUj7_toD3MKMO_',
				from: 1483250400000,
				to: 1485928800000
			}

			Vue.component('roster-list', {
				props: ['row'],
				template: '<tr><td> {{ row.name }} </td> <td>{{ row.scores.graffiti }}</td> <td>{{ row.scores.pot_holes }}</td> <td>{{ row.scores.street_lights }}</td> <td>{{ row.scores.graffiti + row.scores.pot_holes + row.scores.street_lights }}</td> <td>{{ (row.starter)? \'Starter\' : \'Benched\' }}</td> <td><button v-on:click="$emit(\'toggle\')">Toggle</button></td><td>{{ row.pending }}</td></tr>'
			});

			Database.getRoster(tmp).then(function(result) {
				test = result;
				var playerList = [];
				USER['roster'] = {
					userid: result.userid,
					leagueid: result.leagueid,
					from: result.from,
					to: result.to,
					players: playerList
				};
				Object.keys(result.players).map(function(id) {
					playerList.push({
						playerid: id,
						name: result.players[id].name,
						owner: result.players[id].owner,
						starter: result.players[id].starter,
						ward: result.players[id].ward,
						scores: result.players[id].scores,
						pending: ""
					});
				});
				log(USER['roster']);

				var workingRoster = jQuery.extend(true, {}, USER['roster']['players']);

				APP['userRoster'] = new Vue({
					el: '#userRoster',
					data: {
						players: workingRoster,
						aggregator: Object.keys(workingRoster).map(function(id) {
							return workingRoster[id].scores.graffiti + workingRoster[id].scores.pot_holes + workingRoster[id].scores.street_lights;
						}).reduce((a, b) => a + b, 0),
						toggle: {}
					},
					methods: {
						togglePlayer: (idx) => {
							var tmp = APP['userRoster'];
							test = tmp;
							log(idx + " - " + tmp.players[idx].playerid);
							var update = (tmp.players[idx].starter)? "Benching" : "Starting";
							if (tmp.toggle[tmp.players[idx].playerid]) { // toggle operation already done
								tmp.players[idx].pending = "";
								delete tmp.toggle[tmp.players[idx].playerid];
							}
							else {
								tmp.toggle[tmp.players[idx].playerid] = update;
								tmp.players[idx].pending = update;
							}
						},

						updateLineup: () => {
							var tmp = APP['userRoster'];
							tmp.validateLineup();
							
						},

						validateLineup: () => {
							var tmp = APP['userRoster'];
							log(tmp.toggle);
							var benching = [];
							var starting = [];
							Object.keys(tmp.toggle).map(function(idx) {
								console.log(tmp.toggle[idx]);
							});
						},

						updateRoster: () => {

						},

						revertChange: () => {
							var tmp = APP['userRoster'];
							tmp.players = jQuery.extend(true, {}, USER['roster']['players']);
							tmp.toggle = {};
						},

						checkUpdates: () => {
							log("checking for updates");
							Application().getRoster();
							Application().getAllPlayers();
						}
					}
				});

			}, function(err) {
				log(err);
			});
		},

		getAllPlayers: () => {
			log("Get Roster is currently using a temporary user and league, update when create league, invite users, etc. functions are done.");
			var tmp = {
				leagueid: '-KdIiWEUj7_toD3MKMO_',
				from: 1483250400000,
				to: 1485928800000
			}

			Vue.component('player-list', {
				props: ['row'],
				template: '<tr>\
					<td> {{ row.name }} </td>\
					<td>{{ row.scores.graffiti }}</td>\
					<td>{{ row.scores.pot_holes }}</td>\
					<td>{{ row.scores.street_lights }}</td>\
					<td>{{ row.scores.graffiti + row.scores.pot_holes + row.scores.street_lights }}</td>\
					<td>{{ (!row.owner)? \'None\' : row.owner }}</td>\
					<td>\
					<div>\
						<button v-on:click="$emit(\'toggle\')" :disabled="(!row.owner)? false : true">Swap</button>\
						<div>\
							<a>person 1</a>\
							<a>person 2</a>\
							<a>person 3</a>\
							<a>person 4</a>\
							<a>person 5</a>\
						</div>\
					</div>\
					</td>\
					<td>{{ row.pending }}</td>\
				</tr>'
			});

			Database.getAllPlayers(tmp).then(function(result) {
				USER['allPlayers'] = [];
				Object.keys(result).sort().map(function(id) {
					USER['allPlayers'].push(result[id]);
				});
				log(USER.allPlayers);

				var workingPlayers = jQuery.extend(true, {}, USER['allPlayers']);


				APP['allPlayers'] = new Vue({
					el: '#allPlayers',
					data: {
						players: workingPlayers
					},
					methods: {

					}
				});

			}, function(err) {

			});
		}

	};
}

