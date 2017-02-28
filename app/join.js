var Database = InitDatabase();
var USER = false;
var KNOWN_USERS = {};

Database.Auth.getCurrentUser().then((user) => {
	login(user);
}).catch((err) => {
	if(err === 'No user currently authenticated.'){
		console.log(err);
	}
	else{
		console.error(err);
	}
});

var loginBtn = document.getElementById('login-button')
loginBtn.addEventListener('click', (e) => {
	Database.Auth.signInUser().then((user) => {
		login(user);
	}).catch(console.error);
});

function main(){
	console.log('Logged in as: ', USER);

	var page = document.getElementById('page');
		page.style.display = 'block';
	var login = document.getElementById('login');
		login.style.display = 'none';
	var createBtn = document.getElementById('create-button')
	
	createBtn.addEventListener('click', (e) => {
		createLeagueInvitation();
	});
	
	renderUserLeagues();

}

function login(user){
	USER = user;
	KNOWN_USERS[USER.userid] = USER;
	Database.updateUser(user).then((done) => {
		main();
	}).catch(console.error);
}

function createLeagueInvitation(){
	Database.createLeagueInvitation({
		userid: USER.userid,
		name: 'ChiHackNight Demo League'
	}).then((res) => {
		console.log('Join League with Code: ' + res.inviteid);
		renderUserLeagues();
	}).catch(console.error);
}

function joinLeague(inviteid){
	Database.acceptLeagueInvitation({
		userid: USER.userid,
		inviteid: inviteid
	}).then((res) => {
		presentJoined();
	}).catch(console.error);
}

function presentJoined(){

}

function renderUserLeagues(){
	Database.getLeagueInvitations({
		userid: USER.userid
	}).then((res) => {
		var output = document.getElementById('waiting-leagues');
		var html = '';
		if(res){
			var promises = [];
			for(var iid in res){
				for(var uid in res[iid].members){
					var p = new Promise((resolve, reject) => {
						if(uid in KNOWN_USERS){
							resolve(KNOWN_USERS[uid]);
						}
						else{
							Database.getUser({
								userid: uid
							}).then((user) => {
								resolve(user);
							}).catch(reject);
						}
					})
					promises.push(p);
				}
			}
			Promise.all(promises).then((users) => {
				for(var u = 0; u < users.length; u++){
					var user = users[u];
					KNOWN_USERS[user.userid] = user;
				}
				for(var inviteid in res){
					var stub = res[inviteid];
					var lh = '';
						lh += '<h3>' + stub.league.name + '</h3>'
						lh += '<h4>Invite URL</h4>'
						lh += '<p>' + window.location.href + '?code=' + inviteid + '</p>'
						lh += '<h4>Members</h4>'
						lh += '<ul>'
						for(var userKey in stub.members){
							lh += '<li>' + KNOWN_USERS[userKey].name + '</li>'
						}
						lh += '</ul>'
						lh += '<button>Begin League</button>'
					html += lh
				}
				output.innerHTML = html;
			}).catch(console.error);
		}
		else{
			html += '<p>No leagues: start one!</p>'
			output.innerHTML = html;
		}
	}).catch(console.error);
}

function startLeague(stub){
	Database.createLeague({
		name: stub.league.name,
		users: Object.keys(stub.memebers),
		start: new Date('2/5/2017').getTime(),
		end: new Date('2/26/2017').getTime(),
		weeks: 3
	}).then((res) => {
		console.log('Go to league: ' + res.leagueid);
	}).catch(console.error);
}