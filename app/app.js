
// Global Variables
var USER = {}; // stores data related to the user that's logged in
// Database as a global variable during development mode
var Database = InitDatabase(); // Moved to private variables, when in production mode
Database.IN_SIMULATED_TIME = true;


var test; // each time debug is called, the parameter is updated to test, for debugging
var private;


var Verbose = true;
var log = console.log;
var debug = (item) => {
	if (Verbose) {
		console.log(item);
		test = item;
	}
}
if (!Verbose) console.log("Debugging has been turned off.");

function getQueryParams(qs) {
	qs = qs.split('+').join(' ');
	var params = {},
		tokens,
		re = /[?&]?([^=]+)=([^&]*)/g;
	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	}
	return params;
}

function viewOutcome(){
	var leagueid = USER.leagueid;
	var sim = USER.rosterdate;
	var timestamp = sim.thisfrom + (0.5 * (sim.thisto - sim.thisfrom));
	var uParts = document.location.pathname.split('/');
	var pathname = uParts.slice(0, uParts.length - 1).join('/');
	var url = document.location.origin + pathname + '/live.html' + '?time=' + timestamp + '&league=' + leagueid;
	document.location = url;
}

function openScoutingModule(){
	var leagueid = USER.leagueid;
	var sim = USER.rosterdate;
	var timestamp = sim.thisfrom + (0.5 * (sim.thisto - sim.thisfrom));
	var uParts = document.location.pathname.split('/');
	var pathname = uParts.slice(0, uParts.length - 1).join('/');
	var url = document.location.origin + pathname + '/scout.html' + '?time=' + timestamp + '&league=' + leagueid;
	window.open(url, '_blank');
}

// App APIs
function InitApplication() {

	// Private Variables
	//		These variables are function scoped
	var Constants = {
		logoutRedirect: 'index.html',
		loginRedirect: 'app.html',
		leagueRedirect: 'roster.html',
		pending: 'Pending',
		pendingBench: 'Benching',
		pendingStart: 'Starting',
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


	function probablyRedirect(ignoreThisArgumentHahahaha){
		var params = getQueryParams(document.location.search);
		if(params.league){
			// Copied from Load League
			log("next load league haosheng is a badger");
			USER.leagueid = params.league;
			var idx = -1;
			USER.userLeagues.forEach((badger, bidx) => {
				if(badger.leagueid === params.league){
					idx = bidx;
				}
			});
			if(idx > -1){
				localStorage[Constants.userSelectedLeague] = USER.leagueid;
				localStorage[Constants.seletedLeagueStart] = USER.userLeagues[idx].start;
				localStorage[Constants.seletedLeagueEnd] = USER.userLeagues[idx].end;
				window.location.href = Constants.leagueRedirect;
			}
		}
	}

	var getLeague = (params) => {
		if(!params.userid)
			throw new Error('Must specify {userid}.');
		else if(!params.leagueid)
			throw new Error('Must specify {leagueid}.');
		else if(!params.from)
			throw new Error('Must specify {from}.');
		else if(!params.to)
			throw new Error('Must specify {to}.');

		return Database.getLeague(params).then(function(result) {
			log(result);
			return result; // this return is used by loadRosterPage()
		}, function(err) {
			log(err);
		});
	};

	// Gets the user's roster based on a selected league
	var getRoster = (params) => {
		if(!params.userid)
			throw new Error('Must specify {userid}.');
		else if(!params.leagueid)
			throw new Error('Must specify {leagueid}.');
		else if(!params.from)
			throw new Error('Must specify {from}.');
		else if(!params.to)
			throw new Error('Must specify {to}.');

		return Database.getRoster(params).then(function(rosterData) {
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

		}).catch((err) => {
			log("Error thrown, " + err);
		});
	};

	var getLeagueData = () => {
		if (!USER['leagueid'])
			throw new Error("Leagueid not found.");
		return Database.getLeagueData({leagueid: USER['leagueid']}).then((leagueData) => {
			var tmp = leagueData.users[Object.keys(leagueData.users)[0]];
			var idx = parseInt(tmp.losses) + parseInt(tmp.wins);
			var obj = leagueData.schedule[idx][0]
			USER['rosterdate'] = {
				prevfrom: obj.start - (obj.end - obj.start),
				prevto: obj.start,
				thisfrom: obj.start,
				thisto: obj.end,
				week: idx
			};
			log(leagueData);
			test = leagueData;
		}).catch((err) => {
			log("Error thrown, " + err);
		});
	};

	var getUserLeagues = () => {
		if (!USER['userid']) 
			throw new Error("Userid not found.");
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

			probablyRedirect(USER.userLeagues);

		}, function(err) {
			log(err);
			return err;
		});
	};

	var getAllPlayers = (params) => {
		if(!params.leagueid)
			throw new Error('DB - leagueid not found.');
		else if(!params.from)
			throw new Error('DB - starting date not found');
		else if(!params.to)
			throw new Error('DB - ending date not found');

		 //-KdqV4iI8CRGl3GiB24P, -KdIiWEUj7_toD3MKMO_

		return Database.getAllPlayers(params).then(function(result) {
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

		}).catch((err) => {
			log("Thrown, " + err);
		});
	};


	var getMatch = () => {
		log("Get Match has a 1 offset to account for the greater, but not equal operator");
		var tmpdata = {
			userid: USER['userid'],
			leagueid: USER['leagueid'],
			on: parseInt(USER['leaguestart'] + 1)
		};
		log(tmpdata);
		Database.getMatch(tmpdata).then(console.log);
	};

	var getLeagueInvites = (params) => {
		if(!params.userid)
			throw new Error('Must specify {userid}.');
		return Database.getLeagueInvitations(params).then((invitation) => {
			if (invitation.success) {
				USER['invites'] = [];
				Object.keys(invitation).map((id) => {
					var membersList = [];
					Object.keys(invitation[id].members).map((usrid) => {
						membersList.push({
							userid: invitation[id].members[usrid].userid,
							accepted: invitation[id].members[usrid].accepted
						});
					});
					USER['invites'].push({
						leagueid: id,
						league: invitation[id].league,
						members: membersList
					});
				});
				log(USER['invites']);
			}
		}).catch((err) => {
			log(err);
		});
	}


	private = [Constants];


	// Public Variables
	var Application = {

		// Write Functions
		createLeague: () => {
			getLeagueInvites({
				userid: USER['userid']
			}).then(() => {

				USER['_invite-list'] = Vue.component('invite-list', {
					props: ['invite'],
					template: '<li>{{ invite }}<button v-on:click="$emit(\'pop\')">X</button></li>'
				});

				USER['_newLeague'] = new Vue({
					el: '#newLeague',
					data: {
						sim: true,
						name: "",
						start: -1,
						end: -1,
						users: [],
						invites: []
					}, 
					methods: {
						validate: () => {
							if (!USER['_newLeague'].name)
								return false;
							if (USER['_newLeague'].sim) { 
								if (USER['_newLeague'].end <= USER['_newLeague'].start && USER['_newLeague'].start < 0)
									return false;
							} else {
								if (USER['_newLeague'].end <= new Date().getTime() && USER['_newLeague'].start < 0)
									return false;
							}
							return true;
						},
						getInviteURL: () => {
							Database.createLeagueInvitation({
								userid: USER['userid'],
								name: USER['_newLeague'].name
							}).then((invitation) => {
								if (invitation.success) {
									log(invitation.inviteid);
								}
							}).catch((err) => {
								log(err);
							});


							// if (!USER['_newLeague'].sim) 
							// 	alert("Normal game is currently unavailable, please use simulated game.");
							// else if (!USER['_newLeague'].validate()) {
							// 	alert("Invalid League Information.");
							// }
							// else {
							// 	log("start: " + moment(USER['_newLeague'].start).format("MM/DD/YY"));
							// 	log("end: " + moment(USER['_newLeague'].end).format("MM/DD/YY"));
							// 	Database.createLeagueInvitation({
							// 		userid: USER['userid'],
							// 		name: USER['_newLeague'].name
							// 	}).then((invitation) => {
							// 		test = invitation;
							// 	}).catch((err) => {
							// 		log(err);
							// 	});
							// }

						},
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
					var dateFormat = "mm/dd/yy",
					start = $( "#startSim" ).datepicker({
						showOtherMonths: true,
						selectOtherMonths: true,
						defaultDate: "+1w",
						changeMonth: true,
						maxDate: 0
					})
					.on( "change", function() { // executes when the end datepicker is updated
						end.datepicker( "option", "minDate", getDate( this ) );

						log($(this).datepicker('getDate'));
						log($(this).datepicker('getDate').getTime());

						USER['_newLeague'].start = $(this).datepicker('getDate').getTime();
					}),
					end = $( "#endSim" ).datepicker({
						showOtherMonths: true,
						selectOtherMonths: true,
						defaultDate: "+1w",
						changeMonth: true,
						maxDate: 0
					})
					.on( "change", function() { // executes when start datepicker is updated
						start.datepicker( "option", "maxDate", getDate( this ) );

						log($(this).datepicker('getDate'));
						log($(this).datepicker('getDate').getTime());

						USER['_newLeague'].end = $(this).datepicker('getDate').getTime();
					});

					function getDate( element ) {
						var date;
						try {
							date = $.datepicker.parseDate(dateFormat, element.value);
						} catch( error ) {
							date = null;
						}
						return date;
					}
				});

				// Datepicker format for creating a normal game from now to a future date
				$(function() {
					$("#datepicker").datepicker({
						showOtherMonths: true,
						selectOtherMonths: true,
						altField: "#endGame",
						altFormat: "'Ending on' DD, d MM, yy",
						minDate: 0,
						beforeShowDay: (date) => {
							var day = date.getDay();
							return [(day == new Date().getDay()), ''];
						},
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

							USER['_newLeague'].start = Util.floorTimestamp(new Date().getTime());
							USER['_newLeague'].end = $(this).datepicker('getDate').getTime();
						}
					});
				});
			}).catch((err) => {
				log(err);
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

		displayUserLeagues: () => {
			getUserLeagues().then(() => {
				Vue.component('league-list', {
					props: ['row'],
					template: '<tr>\
						<td>{{ (selectedLeague(row.leagueid))? \"Selected\" : \"\" }}</td>\
						<td><button v-on:click="$emit(\'select\')">Select</button></td>\
						<td>{{ row.name }}</td>\
						<td>{{ momentDate(row.start, \"MM/DD/YY\") }}</td>\
						<td>{{ momentDate(row.end, \"MM/DD/YY\") }}</td>\
						<td><div v-for="(user, idx) in row.users">\
							<pre>Team: {{ user.team }}	Wins: {{ user.wins}}	Losses: {{ user.losses }}</pre>\
						</div></td>\
					</tr>',
					methods: {
						momentDate: (date, format) => {
							return moment(date).format(format);
						},
						selectedLeague: (curLeague) => {
							if (!USER.leagueid)
								return false;
							if (USER.leagueid != curLeague)
								return false;
							return true;
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

		displayRoster: () => {
			if(!USER.userid)
				throw new Error('userid not found.');
			else if(!USER.leagueid)
				throw new Error('leagueid not found.');
			else if(!USER.rosterdate.prevfrom)
				throw new Error('starting date not found');
			else if(!USER.rosterdate.prevto)
				throw new Error('ending date not found');

			getRoster({
				userid: USER.userid,
				leagueid: USER.leagueid,
				from: USER.rosterdate.prevfrom,
				to: USER.rosterdate.prevto
			}).then(() => {
				if (!USER['_roster-list']) {
					USER['_roster-list'] = Vue.component('roster-list', {
						props: ['row', 'header'],
						template: '<tr>\
							<td>{{ row.name }}</td>\
							<td>{{ row.scores[Object.keys(header)[0]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[1]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[2]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[0]] + row.scores[Object.keys(header)[1]] + row.scores[Object.keys(header)[2]] }}</td>\
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
						headers: Database.Scoring.DATASET_NAMES,
						leaguename: USER['selectedleague']['name'],
						players: USER['roster']['players'],
						// update aggregator, reference scoring.js
						aggregator: Object.keys(USER['roster']['players']).map(function(id) {
							if (!USER['roster']['players'][id].starter){
								return 0;
							}
							var cols = Object.keys(Database.Scoring.DATASET_NAMES);
							return USER['roster']['players'][id].scores[cols[0]] + USER['roster']['players'][id].scores[cols[1]] + USER['roster']['players'][id].scores[cols[2]];
						}).reduce((a, b) => a + b, 0),
						toggle: {}
					},
					methods: {
						updateAggregator: () => {
							USER['_userRoster'].aggregator = Object.keys(USER['_userRoster'].players).map(function(id) {
							if (!USER['roster']['players'][id].starter){
								return 0;
							}
							var cols = Object.keys(Database.Scoring.DATASET_NAMES);
							return USER['roster']['players'][id].scores[cols[0]] + USER['roster']['players'][id].scores[cols[1]] + USER['roster']['players'][id].scores[cols[2]];
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
									if (Database.IN_SIMULATED_TIME) {
										move['timestamp'] = (USER.rosterdate.prevto - USER.rosterdate.prevfrom)/2 + USER.rosterdate.prevfrom;
									}
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

		displayAllPlayers: () => {
			if(!USER.leagueid)
				throw new Error('UI - leagueid not found.');
			else if(!USER.rosterdate.prevfrom)
				throw new Error('UI - starting date not found');
			else if(!USER.rosterdate.prevto)
				throw new Error('UI - ending date not found');

			getAllPlayers({
				leagueid: USER.leagueid,
				from: USER.rosterdate.prevfrom,
				to: USER.rosterdate.prevto
			}).then(() => {
				if (!USER['_player-list']) {
					USER['_player-list'] = Vue.component('player-list', {
						props: ['row', 'header'],
						template: '<tr>\
							<td>{{ row.ward }}</td>\
							<td>{{ row.name }} </td>\
							<td>{{ row.scores[Object.keys(header)[0]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[1]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[2]] }}</td>\
							<td>{{ row.scores[Object.keys(header)[0]] + row.scores[Object.keys(header)[1]] + row.scores[Object.keys(header)[2]] }}</td>\
							<td>{{ (!row.owner)? \'None\' : checkName(row.owner) }}</td>\
							<td><button v-on:click="$emit(\'acquire\')" :disabled="(!row.owner || checkUser(row))? false : true">{{ (checkUser(row)) ? \'Drop\' : \'Acquire\' }}</button></td>\
							<td>{{ row.pending }}</td>\
						</tr>',
						methods: {
							checkUser: (other) => {
								return (other.owner == USER['userid']);
							},
							checkName: (owner) => {
								if (USER['selectedleague']) {
									return USER['selectedleague'].users[owner].name;
								}
								return owner;
							}
						}
					});
				}
				// Save point
				// In order for sorting to work, the _player-list template needs to enclose the whole table element

				var workingPlayers = jQuery.extend(true, {}, USER['allPlayers']);
				var userRosters = USER['allPlayers'].filter(function(item) {
					if (item.owner == "testuser0001") return item;
				});

				USER['_allPlayers'] = new Vue({
					el: '#allPlayers',
					data: {
						headers: Database.Scoring.DATASET_NAMES,
						players: workingPlayers,
						rosters: userRosters,
						order: 0,
						reverse: 1
					},
					methods: {
						ordering: (orderBy) => {
							USER['_allPlayers'].reverse *= -1;
							USER['_allPlayers'].order = orderBy;
							var header = Object.keys(Database.Scoring.DATASET_NAMES);
							var comparator = [	(a, b) => {return (a.ward > b.ward) ? 1 : ((b.ward > a.ward)? -1 : 0);},
												(a, b) => {return (a.name > b.name)? 1 : ((b.name > a.name)? -1 : 0);},
												(a, b) => {return (a.scores[header[0]] > b.scores[header[0]])? 1 : ((b.scores[header[0]] > a.scores[header[0]])? -1 : 0);},
												(a, b) => {return (a.scores[header[1]] > b.scores[header[1]])? 1 : ((b.scores[header[1]] > a.scores[header[1]])? -1 : 0);},
												(a, b) => {return (a.scores[header[2]] > b.scores[header[2]])? 1 : ((b.scores[header[2]] > a.scores[header[2]])? -1 : 0);},
												(a, b) => {return ( (a.scores[header[0]] + a.scores[header[1]] + a.scores[header[2]]) > (b.scores[header[0]] + b.scores[header[1]] + b.scores[header[2]]) )? 1 : (( (b.scores[header[0]] + b.scores[header[1]] + b.scores[header[2]]) > (a.scores[header[0]] + a.scores[header[1]] + a.scores[header[2]]) )? -1 : 0);},
												(a, b) => {return (b.owner == false || a.owner > b.owner)? 1 : ((a.owner == false || b.owner > a.owner)? -1 : 0);},
												(a, b) => {return (a.ward > b.ward)? 1 : ((b.ward > a.ward)? -1 : 0);}	];

							var sorted = USER.allPlayers.sort(comparator[orderBy]);
							if (USER['_allPlayers'].reverse == -1)
								sorted.reverse();
							
							for (var i = 0; i < Object.keys(USER['_allPlayers'].players).length; i++) {
								USER._allPlayers.players[i] = Object.assign({}, USER._allPlayers.players[i], {
									ward: sorted[i].ward,
									name: sorted[i].name,
									owner: sorted[i].owner,
									playerid: sorted[i].playerid,
									starter: sorted[i].starter,
									scores: sorted[i].scores,
									pending: (USER['workingPlayers'] && USER['workingPlayers'].playerid == sorted[i].playerid)? USER['workingPlayers'].pending : sorted[i].pending
								});
							}
						},
						acquirePlayer: (idx) => {
							var tmp = USER['_allPlayers'];

							if (USER['workingPlayers']) {
								// makes sure the selected is not the same, if so undo the selected
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
									if (Database.IN_SIMULATED_TIME) {
										move['timestamp'] = (USER.rosterdate.prevto - USER.rosterdate.prevfrom)/2 + USER.rosterdate.prevfrom;
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
									}).catch((err) => {
										log(err);
										alert("Player Taken");
										USER['workingPlayers'] = tmp.players[idx].pending = "";
										USER['workingPlayers'] = null;
										getAllPlayers({
											leagueid: USER.leagueid,
											from: USER.rosterdate.prevfrom,
											to: USER.rosterdate.prevto
										}).then(() => {
											log("Updates after an error");
											if (USER['_allPlayers']) {
												var currentOrder = USER['_allPlayers'].order;
												var currentReverse = USER['_allPlayers'].reverse * -1;
												USER['_allPlayers'].reverse = 1;
												USER['_allPlayers'].ordering(1);
												for (var i = 0; i < Object.keys(USER['_allPlayers'].players).length; i++) {
													USER._allPlayers.players[i] = Object.assign({}, USER._allPlayers.players[i], USER.allPlayers[i]);
												}
												USER['_allPlayers'].reverse = currentReverse;
												USER['_allPlayers'].ordering(currentOrder);
											}
										}).catch((err) => {
											log(err);
										});
									});
								}
								else {
									log("Invalid Add/Drop of players");
								}
							}
							// selecting the first player to add or drop
							else {
								log(idx);
								tmp.players[idx].pending = (tmp.players[idx].owner)? Constants.pendingDrop : Constants.pendingAcquire;
								USER['workingPlayers'] = tmp.players[idx];
							}
						}
					}
				});
			}); 

			Database.when('rosters_change', {
				leagueid: USER['leagueid']
			}, (change) => {
				if (change.changed) {
					getAllPlayers({
						leagueid: USER.leagueid,
						from: USER.rosterdate.prevfrom,
						to: USER.rosterdate.prevto
					}).then(() => {
						log("Player List updated");
						if (USER['_allPlayers']) {
							var currentOrder = USER['_allPlayers'].order;
							var currentReverse = USER['_allPlayers'].reverse * -1;
							USER['_allPlayers'].reverse = 1;
							USER['_allPlayers'].ordering(1);
							for (var i = 0; i < Object.keys(USER['_allPlayers'].players).length; i++) {
								if (USER.allPlayers[i].owner != USER['_allPlayers'].players[i].owner)
									USER._allPlayers.players[i] = Object.assign({}, USER._allPlayers.players[i], {owner: USER.allPlayers[i].owner});
								// 	Vue.set(USER['_allPlayers'].players[i], 'owner', USER.allPlayers[i].owner);
							}
							USER['_allPlayers'].reverse = currentReverse;
							USER['_allPlayers'].ordering(currentOrder);
						}
					}).catch((err) => {
						log(err);
					});
				}
			});
		},

		setMatchOutcome: () => {
			if (!USER['userid']) 
				throw new Error("UI - userid not found.");
			if (!USER['leagueid'])
				throw new Error("UI - leagueid not found.");
			if (!USER['rosterdate']['prevfrom'] || !USER['rosterdate']['prevto'])
				throw new Error("UI - date range not found.")
			log((USER.rosterdate.thisto - USER.rosterdate.thisfrom)/2 + USER.rosterdate.thisfrom);
			Database.setMatchOutcome({
				userid: USER['userid'],
				leagueid: USER['leagueid'],
				on: (USER.rosterdate.thisto - USER.rosterdate.thisfrom)/2 + USER.rosterdate.thisfrom
			}).then((matchOutcome) => {
				if (matchOutcome.success) {
					log("Success");
					viewOutcome();
				}
			}).catch((err) => {
				console.error(err)
			});
		},

		// this function is specific to the items needed at the roster page
		loadRosterPage: () => {

			var loadRosterPageCallBack = () => {
				getLeagueData({
					leagueid: USER['leagueid']
				}).then(() => {
					getLeague({
						userid: USER.userid,
						leagueid: USER.leagueid,
						from: USER.rosterdate.prevfrom,
						to: USER.rosterdate.prevto
					}).then((userSelect) => {
						log(userSelect);
						USER['selectedleague'] = userSelect;
						log(USER);
						Application.displayRoster();
						Application.displayAllPlayers();
					})
				}).catch((err) => {
					log("Thrown, " + err);
				});
			}

			loadRosterPageCallBack();
		}
	}; // end of application variable

	return Application;
	
} // end of factory function
