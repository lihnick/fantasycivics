
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
	var Constants = {
		logoutRedirect: 'index.html',
		loginRedirect: 'app.html',
		leagueRedirect: 'roster.html',
		pending: 'Pending',
		pendingBench: 'Benching',
		pendingStart: 'starting',
		pendingAcquire: 'Acquiring',
		pendingDrop: 'Dropping',
		userIdTag: 'userid',
		userEmailTag: 'email',
		userImageTag: 'image',
		userNameTag: 'name',
		userSelectedLeague: 'leagueid',
		seletedLeagueStart: 'leaguestart',
		seletedLeagueEnd: 'leagueend'
	};

	// Public Variables
	return {

		// Write Functions

		createLeague: () => {
			Vue.component('invite-list', {
				props: ['invite'],
				template: '<li>{{ invite }}<button v-on:click="$emit(\'pop\')">X</button></li>'
			});

			USER['_newLeague'] = new Vue({
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
						var tmp = USER['_newLeague'];
						debug(USER);
						if (tmp.invite) {
							tmp.users.push(tmp.invite);
							tmp.invite = "";
						} else {
							alert("No Inputs");
						}
					},
					finalizeLeague: () => {
						var tmp = USER['_newLeague'];
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
						USER['_newLeague'].range = $(this).datepicker('getDate');
					}
				});
			});

		},

		// Read Functions

		// displays user info in html elements
		displayUser: () => {
			if (document.getElementById(Constants.userIdTag))
				document.getElementById(Constants.userIdTag).innerText = USER.userid;
			if (document.getElementById(Constants.userNameTag))
				document.getElementById(Constants.userNameTag).innerText = USER.name;
			if (document.getElementById(Constants.userEmailTag))
				document.getElementById(Constants.userEmailTag).innerText = USER.email;
			if (document.getElementById(Constants.userImageTag))
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
				USER.leagueid = localStorage[Constants.userSelectedLeague];
				USER.leaguestart = parseInt(localStorage[Constants.seletedLeagueStart]);
				USER.leagueend = parseInt(localStorage[Constants.seletedLeagueEnd]);
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
			localStorage.removeItem(Constants.userSelectedLeague);
			localStorage.removeItem(Constants.seletedLeagueStart);
			localStorage.removeItem(Constants.seletedLeagueEnd);
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
				log(result);
				Database.updateUser(result).then(() => {
					log("test");
					window.location.href = Constants.loginRedirect;
				}).catch((err) => {log(err)});	
				log("done");
			}, function(err) {
				alert(err);
			});
		},

		getUserLeagues: () => {
			if (!USER['userid']) 
				return;
			return Database.getUserLeagues({userid: USER.userid}).then(function(userLeagueList) {
				log(userLeagueList);
				test = userLeagueList;
				if (Object.keys(userLeagueList.leagues).length == 0) {
					log("No League available, create one above.");
					return;
				}
				USER['userLeagues'] = Object.keys(userLeagueList.leagues).map(function(key) {
					var usrLst = Object.keys(userLeagueList.leagues[key].users).map(function(usrs) {
						return {
							userid: usrs,
							team: userLeagueList.leagues[key].users[usrs].team,
							losses: userLeagueList.leagues[key].users[usrs].losses,
							wins: userLeagueList.leagues[key].users[usrs].wins
						}
					});
					return {
						leagueid: key,
						name: userLeagueList.leagues[key].name,
						start: userLeagueList.leagues[key].start,
						end: userLeagueList.leagues[key].end,
						users: usrLst
					}
				});
				log(USER.userLeagues);

			}, function(err) {
				log(err);
				return err;
			});
		},

		displayUserLeagues: () => {
			Application().getUserLeagues().then(() => {
				Vue.component('league-list', {
					props: ['row'],
					template: '<tr>\
						<td><button v-on:click="$emit(\'info\')">info</button></td>\
						<td>{{ row.name }}</td>\
						<td>{{ momentDate(row.start, \"MM/DD/YY\") }}</td>\
						<td>{{ momentDate(row.end, \"MM/DD/YY\") }}</td>\
						<td><div v-for="(user, idx) in row.users">\
							<pre>Team: {{ user.team}}	Wins: {{ user.wins}}	Losses: {{ user.losses }}</pre>\
						</div></td>\
					</tr>',
					methods: {
						momentDate: (date, format) => {
							return moment(date).format(format);
						}
					}
				});

				USER['_userLeagues'] = new Vue({
					el: '#userLeagues',
					data: {
						leagueids: Object.keys(USER.userLeagues),
						leagues: USER.userLeagues
					},
					methods: {
						loadLeague: (idx) => {
							log("next");
							USER.leagueid = USER.userLeagues[idx].leagueid;
							localStorage[Constants.userSelectedLeague] = USER.userLeagues[idx].leagueid;
							localStorage[Constants.seletedLeagueStart] = USER.userLeagues[idx].start;
							localStorage[Constants.seletedLeagueEnd] = USER.userLeagues[idx].end;
							window.location.href = Constants.leagueRedirect;
						}
					}
				});
			});			
		},

		getLeague: (params) => {
			if(!params.userid)
				throw new Error('Must specify {userid}.');
			else if(!params.leagueid)
				throw new Error('Must specify {leagueid}.');
			else if(!params.from)
				throw new Error('Must specify {from}.');
			else if(!params.to)
				throw new Error('Must specify {to}.');
			return Database.getLeague({
				leagueid: params.userid,
				leagueid: params.leagueid,
				from: params.from,
				to: params.to
			}).then(function(result) {
				log(result);
				return result;
			}, function(err) {
				log(err);
			});
		},

		// Gets the user's roster based on a selected league
		getRoster: () => {
			var userdata = {
				userid: USER['userid'],
				leagueid: USER['leagueid'], //-KdqV4iI8CRGl3GiB24P, -KdIiWEUj7_toD3MKMO_
				from: USER['leaguestart'],
				to: USER['leagueend']
			}

			return Database.getRoster(userdata).then(function(rosterData) {
				test = rosterData;
				var playerList = Object.keys(rosterData.players).map(function(id) {
					return {
						playerid: id,
						name: rosterData.players[id].name,
						owner: rosterData.players[id].owner,
						starter: rosterData.players[id].starter,
						ward: rosterData.players[id].ward,
						scores: rosterData.players[id].scores,
						pending: ""
					};
				});
				USER['roster'] = {
					userid: rosterData.userid,
					leagueid: rosterData.leagueid,
					from: rosterData.from,
					to: rosterData.to,
					players: playerList
				};
				log(USER['roster']);

			}, function(err) {
				log(err);
			});
		},

		displayRoster: () => {
			Application().getRoster().then(() => {
				if (!USER['_roster-list']) {
					USER['_roster-list'] = Vue.component('roster-list', {
						props: ['row'],
						template: '<tr>\
							<td>{{ row.name }}</td>\
							<td>{{ row.scores.graffiti }}</td>\
							<td>{{ row.scores.pot_holes }}</td>\
							<td>{{ row.scores.street_lights }}</td>\
							<td>{{ row.scores.graffiti + row.scores.pot_holes + row.scores.street_lights }}</td>\
							<td>{{ (row.starter)? \'Starter\' : \'Benched\' }}</td>\
							<td><button v-on:click="$emit(\'toggle\')">Toggle</button></td>\
							<td>{{ row.pending }}</td>\
						</tr>'
					});
				}

				//var workingRoster = jQuery.extend(true, {}, USER['roster']['players']);
				USER['_userRoster'] = new Vue({
					el: '#userRoster',
					data: {
						players: USER['roster']['players'],
						// update aggregator, reference scoring.js
						aggregator: Object.keys(USER['roster']['players']).map(function(id) {
							if (!USER['roster']['players'][id].starter){
								return 0;
							}
							return USER['roster']['players'][id].scores.graffiti + USER['roster']['players'][id].scores.pot_holes + USER['roster']['players'][id].scores.street_lights;
						}).reduce((a, b) => a + b, 0),
						toggle: {}
					},
					methods: {
						updateAggregator: () => {
							USER['_userRoster'].aggregator = Object.keys(USER['_userRoster'].players).map(function(id) {
								if (!USER['_userRoster'].players[id].starter){
									return 0;
								}
								return USER['_userRoster'].players[id].scores.graffiti + USER['_userRoster'].players[id].scores.pot_holes + USER['_userRoster'].players[id].scores.street_lights;
							}).reduce((a, b) => a + b, 0);
						},
						togglePlayer: (idx) => { 
							var tmp = USER['_userRoster'];

							if (USER['workingRoster']) {
								// makes sure the selected is not the same, if so undo select
								if (USER['workingRoster'].playerid == tmp.players[idx].playerid) {
									tmp.players[idx].pending = "";
									USER['workingRoster'] = null;
								} 
								// if everything checks out with the player move, then update database
								else if (USER['workingRoster'].starter != tmp.players[idx].starter) {
									tmp.players[idx].pending = (tmp.players[idx].starter)? Constants.pendingBench : Constants.pendingStart;
									var p1 = USER['workingRoster'];
									var p2 = tmp.players[idx];
									var move = {
										userid: USER['userid'],
										leagueid: USER['leagueid'],
										sit: (p1.starter)? p1.playerid : p2.playerid,
										start: (!p1.starter)? p1.playerid : p2.playerid
									}
									// temporarily disable the toggle buttons
									log(move);
									test = move;
									Database.movePlayer(move).then(function(movePlayer) {
										if (movePlayer.success){
											p1.starter = p2.starter;
											p2.starter = !p2.starter;
											p1.pending = p2.pending = "";
											USER['roster']['players'] = tmp.players; // temporary fix
											USER['workingRoster'] = null;
										}
									}).catch(function(err) {
										log(err);
									});
								}
								// otherwise, revert and show error in user's movement
								else {
									log("Invalid player movement!");
									tmp.players[idx].pending = USER['workingRoster'].pending = "";
									USER['workingRoster'] = null;
								}
							}
							// adds pending update to the UI
							else {
								tmp.players[idx].pending = (tmp.players[idx].starter)? Constants.pendingBench : Constants.pendingStart;
								USER['workingRoster'] = tmp.players[idx];
							}
						}
					}
				});
			});
		},

		getAllPlayers: () => {
			var userdata = {
				leagueid: USER['leagueid'], //-KdqV4iI8CRGl3GiB24P, -KdIiWEUj7_toD3MKMO_
				from: USER['leaguestart'],
				to: USER['leagueend']
			}

			return Database.getAllPlayers(userdata).then(function(result) {
				USER['allPlayers'] = [];
				log(result);
				Object.keys(result).sort().map(function(id) {
					USER['allPlayers'].push({
						name: result[id].name,
						owner: result[id].owner,
						playerid: result[id].playerid,
						scores: result[id].scores,
						starter: result[id].starter,
						ward: result[id].ward,
						pending: ""
					});
				});
				log(USER.allPlayers);

			}, function(err) {
				log(err);
			});
		},

		displayAllPlayers: () => {
			Application().getAllPlayers().then(() => {
				if (!USER['_player-list']) {
					USER['_player-list'] = Vue.component('player-list', {
						props: ['row'],
						template: '<tr>\
							<td> {{ row.name }} </td>\
							<td>{{ row.scores.graffiti }}</td>\
							<td>{{ row.scores.pot_holes }}</td>\
							<td>{{ row.scores.street_lights }}</td>\
							<td>{{ row.scores.graffiti + row.scores.pot_holes + row.scores.street_lights }}</td>\
							<td>{{ (!row.owner)? \'None\' : checkName(row.owner) }}</td>\
							<td><button v-on:click="$emit(\'acquire\')" :disabled="(!row.owner || checkUser(row))? false : true">{{ (checkUser(row)) ? \'Drop\' : \'Acquire\' }}</button></td>\
							<td>{{ row.pending }}</td>\
						</tr>',
						methods: {
							checkUser: (other) => {
								return (other.owner == USER['userid']);
							},
							checkName: (owner) => {
								if (USER['selectedLeague']) 
									return USER['selectedLeague'].users[owner].name;
								return owner;
							}
						}
					});
				}

				var workingPlayers = jQuery.extend(true, {}, USER['allPlayers']);
				var userRosters = USER['allPlayers'].filter(function(item) {
					if (item.owner == "testuser0001") return item;
				});

				USER['_allPlayers'] = new Vue({
					el: '#allPlayers',
					data: {
						players: workingPlayers,
						rosters: userRosters
					},
					methods: {
						acquirePlayer: (idx) => {
							var tmp = USER['_allPlayers'];

							if (USER['workingPlayers']) {
								// makes sure the selected is not the same, if so undo select
								if (USER['workingPlayers'].playerid == tmp.players[idx].playerid) {
									tmp.players[idx].pending = "";
									USER['workingPlayers'] = null;
								}
								else if (USER['workingPlayers'].owner ==  USER['userid'] && tmp.players[idx].owner == false ||
										 USER['workingPlayers'].owner ==  false && tmp.players[idx].owner == USER['userid']) {
									tmp.players[idx].pending = (tmp.players[idx].owner)? Constants.pendingDrop : Constants.pendingAcquire;
									var p1 = USER['workingPlayers'];
									var p2 = tmp.players[idx];
									var move = {
										userid: USER['userid'],
										leagueid: USER['leagueid'],
										add: (!p1.owner)? p1.playerid : p2.playerid,
										drop: (p1.owner)? p1.playerid : p2.playerid
									}
									// it would be nice, if I can just recall the Application().getRoster() function, but freezes the UI
									// Updates to add/drop player will also affect the roster
									Database.acquirePlayer(move).then(function(acquirePlayer) {
										if (acquirePlayer.success) {
											p1.pending = p2.pending = "";
											if (p1.owner == false) {
												p1.owner = p2.owner;
												p2.owner = false;
												if (USER['_userRoster']) {
													USER['_userRoster'].players.filter(function(item) {
														if (item.playerid == p2.playerid) {
															item.name = p1.name;
															item.playerid = p1.playerid;
															item.scores = p1.scores;
															item.ward = p1.ward;
														}
													});
													USER['_userRoster'].updateAggregator();
												}
											} else {
												p2.owner = p1.owner;
												p1.owner = false;
												if (USER['_userRoster']) {
													USER['_userRoster'].players.filter(function(item) {
														if (item.playerid == p1.playerid) {
															item.name = p2.name;
															item.playerid = p2.playerid;
															item.scores = p2.scores;
															item.ward = p2.ward;
														}
													});
													USER['_userRoster'].updateAggregator();
												}
											}
											USER['workingPlayers'] = null;
											
										}
									}).catch(function(err) {
										log(err);
									});
								}
								else {
									log("Invalid Add/Drop of players");
								}
							}
							else {
								tmp.players[idx].pending = (tmp.players[idx].owner)? Constants.pendingDrop : Constants.pendingAcquire;
								USER['workingPlayers'] = tmp.players[idx];
							}
						}
					}
				});

			}); 
		},

		getMatch: () => {
			log("Get Match has a 1 offset to account for the greater, but not equal operator");
			var tmpdata = {
				userid: USER['userid'],
				leagueid: USER['leagueid'],
				on: parseInt(USER['leaguestart'] + 1)
			};
			log(tmpdata);
			Database.getMatch(tmpdata).then(console.log);
		},

		// this function is specific to the items needed at the roster page
		loadRosterPage: () => {
			Application().getLeague({
				userid: USER['userid'],
				leagueid: USER['leagueid'],
				from: USER['leaguestart'],
				to: USER['leagueend']
			}).then((leagueLen) => {
				if (!USER['selectedLeague']) {
					USER['selectedLeague'] = leagueLen;
				}
				Application().displayRoster();
				Application().displayAllPlayers();
			});
		}
	}; // end of return
} // end of factory function

