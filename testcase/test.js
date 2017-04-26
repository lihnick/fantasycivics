//Test the following in the console
 
//L1 : User creates multiple leagues with same name
for (i in USER._userLeagues.leagues) 
	console.log(USER._userLeagues.leagues[i].name)

//L1 :User start date is before the end date
for (i in USER._userLeagues.leagues) 
	console.log((USER._userLeagues.leagues[i].end >USER._userLeagues.leagues[i].start)) 

//L1 : Leagues have an even number of users
for (i in leagues) {
    var users = leagues[i].users
	console.log(((users.length)%2) == 0)
}

//L3 : All player who accepted a league invitation are part of the created league
//Cannot find the league invitation button...
//Assumming this test case fails

//R4 : User starts and player who's already started
// After triggering the player who's started, do the following
for (i in USER._userRoster.players){
    var player = USER._userRoster.players[i];
    var starter = player.starter;
    if(starter == true){
        console.log(player.pending == "Starting");}}


//R4 : User rosters maintains 3 starter and 2 benched
console.log(USER._userRoster.players.length==5)
var _true = 0;
var _false = 0;
for (i in roster){
    var Starter = roster[i].starter;
    if(Starter == true){
        _true++;
    }else{
        _false++;
    }
}  
console.log((_true ==3)&&(_false == 2));
