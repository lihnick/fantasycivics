var Database = InitDatabase();
var USER = false;
var KNOWN_USERS = {};
var WATCH_LEAGUES = {};
var YOUR_LEAGUES = {};
var STUB = false;

Database.Auth.getCurrentUser().then((user) => {
	Database.getUser({
		userid: user.userid
	}).then((userData) => {
		login(userData);
	}).catch(displayError);
}).catch((err) => {
	if(err === 'No user currently authenticated.'){
		displayMessage('Log in in to play Fantasy Civics!');
	}
	else{
		console.error(err);
	}
});

function login(user){
	USER = user;
	KNOWN_USERS[USER.userid] = USER;
	Database.updateUser(user).then((done) => {
		main();
	}).catch(displayError);
}

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

function displayMessage(message){
	var box = document.getElementById('message-container');
	var output = document.getElementById('message');
	var close = document.getElementById('close-message');
	box.style.display = 'block';
	output.innerText = message;
	close.addEventListener('click', (e) => {
		box.style.display = 'none';
	});
}

function displayError(err){
	console.error(err);
	displayMessage('Error: ' + err.toString());
}

var loginBtn = document.getElementById('login-button')
loginBtn.addEventListener('click', (e) => {
	Database.Auth.signInUser().then((user) => {
		login(user);
	}).catch(displayError);
});

function main(){

	var page = document.getElementById('page');
		page.style.display = 'block';
	var login = document.getElementById('login');
		login.style.display = 'none';

	var params = getQueryParams(document.location.search);

	

}
