var Database = InitDatabase();

console.log(Database);

Database.

function createLeagueInvitation(){
	Database.createLeagueInvitation({
		userid: USER.userid,
		name: 'ChiHackNight Demo League'
	}).then((res) => {
		presentInvitation(res.inviteid);
	}).catch(console.error);
}

function presentInvitation(inviteid){

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

function showLeagueMembers(inviteid){
	Database.getLeagueInvitations({
		userid: USER.userid
	}).then((res) => {
		var leagueStub = res[inviteid];
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