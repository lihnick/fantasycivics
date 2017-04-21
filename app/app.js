
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


// App APIs
function InitApplication() {

	// Private Variables, variables are function scoped

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

	var viewOutcome = () => {
		var leagueid = USER.leagueid;
		var sim = USER.rosterdate;
		var timestamp = sim.thisfrom + (0.5 * (sim.thisto - sim.thisfrom));
		var uParts = document.location.pathname.split('/');
		var pathname = uParts.slice(0, uParts.length - 1).join('/');
		var url = document.location.origin + pathname + '/live.html' + '?time=' + timestamp + '&league=' + leagueid;
		document.location = url;
	};

	var openScoutingModule = () => {
		var leagueid = USER.leagueid;
		var sim = USER.rosterdate;
		var timestamp = sim.thisfrom + (0.5 * (sim.thisto - sim.thisfrom));
		var uParts = document.location.pathname.split('/');
		var pathname = uParts.slice(0, uParts.length - 1).join('/');
		var url = document.location.origin + pathname + '/scout.html' + '?time=' + timestamp + '&league=' + leagueid;
		window.open(url, '_blank');
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

		}, function(err) {
			log(err);
			return err;
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

		getUser: () => {
			return USER;
		},

		// Check local storage for users that are logged in from previous sessions
		checkUser: () => {
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

		// Displays all the leagues one user is a part of
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
		}

	}; // end of application variable

	return Application;

} // end of factory function
