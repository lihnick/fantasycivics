
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
		pending: 'Pending',
		pendingBench: 'Benching',
		pendingStart: 'starting',
		pendingAcquire: 'Acquiring',
		pendingDrop: 'Dropping',
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

			USER['_displayLeagues'] = new Vue({
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
			var tmpdata = {
				userid: 'testuser0001',
				leagueid: '-KdqV4iI8CRGl3GiB24P', //-KdqV4iI8CRGl3GiB24P, -KdIiWEUj7_toD3MKMO_
				from: 1483250400000,
				to: 1485928800000
			}

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

			Database.getRoster(tmpdata).then(function(rosterData) {
				test = rosterData;
				log(rosterData);
				var playerList = [];
				USER['roster'] = {
					userid: rosterData.userid,
					leagueid: rosterData.leagueid,
					from: rosterData.from,
					to: rosterData.to,
					players: playerList
				};
				Object.keys(rosterData.players).map(function(id) {
					playerList.push({
						playerid: id,
						name: rosterData.players[id].name,
						owner: rosterData.players[id].owner,
						starter: rosterData.players[id].starter,
						ward: rosterData.players[id].ward,
						scores: rosterData.players[id].scores,
						pending: ""
					});
				});
				log(USER['roster']);

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
								// else if (USER['workingRoster'].owner == false && tmp.players[idx].owner == tmpdata.userid) {
								// 	tmp.players[idx].pending = Constants.pendingDrop;
								// 	var acquire = {
								// 		userid: tmpdata.userid,
								// 		leagueid: tmpdata.leagueid,
								// 		add: USER['workingRoster'].playerid,
								// 		drop: tmp.players[idx].playerid
								// 	}
								// 	Database.acquirePlayer(acquire).then(function(acquirePlayer) {
								// 		if (acquirePlayer.success) {
								// 			log("player acquired");
								// 			var p1 = USER['workingRoster'];
								// 			var p2 = tmp.players[idx];
											
								// 			p1.pending = p2.pending = "";
								// 			p1.owner = p2.owner;
								// 			p1.starter = p2.starter;
								// 			Object.keys(USER['_allPlayers'].players).map(function(index) {
								// 				if (USER['_allPlayers'].players[index].playerid == p2.playerid) {
								// 					USER['_allPlayers'].players[index].owner = p2.owner = false;
								// 				}
								// 			});

								// 			tmp.players.splice(idx, 1);
								// 			tmp.players.push(p1);

								// 			USER['workingRoster'] = null;
								// 		}
								// 	}).catch(function(err) {
								// 		log(err);
								// 		revertChange();
								// 	});
								// }
								// if everything checks out with the player move, then update database
								else if (USER['workingRoster'].starter != tmp.players[idx].starter) {
									tmp.players[idx].pending = (tmp.players[idx].starter)? Constants.pendingBench : Constants.pendingStart;
									var p1 = USER['workingRoster'];
									var p2 = tmp.players[idx];
									var move = {
										userid: tmpdata.userid,
										leagueid: tmpdata.leagueid,
										sit: (p1.starter)? p1.playerid : p2.playerid,
										start: (!p1.starter)? p1.playerid : p2.playerid
									}
									// temporarily disable the toggle buttons
									log(move);
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
										revertChange();
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

			}, function(err) {
				log(err);
			});
		},

		getAllPlayers: () => {
			log("Get Roster is currently using a temporary user and league, update when create league, invite users, etc. functions are done.");
			var tmpdata = {
				leagueid: '-KdqV4iI8CRGl3GiB24P', //-KdqV4iI8CRGl3GiB24P, -KdIiWEUj7_toD3MKMO_
				from: 1483250400000,
				to: 1485928800000
			}

			USER['_player-list'] = Vue.component('player-list', {
				props: ['row'],
				template: '<tr>\
					<td> {{ row.name }} </td>\
					<td>{{ row.scores.graffiti }}</td>\
					<td>{{ row.scores.pot_holes }}</td>\
					<td>{{ row.scores.street_lights }}</td>\
					<td>{{ row.scores.graffiti + row.scores.pot_holes + row.scores.street_lights }}</td>\
					<td>{{ (!row.owner)? \'None\' : row.owner }}</td>\
					<td><button v-on:click="$emit(\'acquire\')" :disabled="(!row.owner || row.owner == \'testuser0001\')? false : true">{{ (row.owner == \'testuser0001\') ? \'Drop\' : \'Acquire\' }}</button></td>\
					<td>{{ row.pending }}</td>\
				</tr>'
			});

			Database.getAllPlayers(tmpdata).then(function(result) {
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
								else if (USER['workingPlayers'].owner ==  "testuser0001" && tmp.players[idx].owner == false ||
										 USER['workingPlayers'].owner ==  false && tmp.players[idx].owner == "testuser0001") {
									tmp.players[idx].pending = (tmp.players[idx].owner)? Constants.pendingDrop : Constants.pendingAcquire;
									var p1 = USER['workingPlayers'];
									var p2 = tmp.players[idx];
									var move = {
										userid: 'testuser0001',
										leagueid: tmpdata.leagueid,
										add: (!p1.owner)? p1.playerid : p2.playerid,
										drop: (p1.owner)? p1.playerid : p2.playerid
									}
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

			}, function(err) {

			});
		}

	};
}

