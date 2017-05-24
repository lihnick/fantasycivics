var Database = InitDatabase();
var DEMO_LEAGUEID = '-KdIiWEUj7_toD3MKMO_';
var DEMO_LEAGUE_OBJ = false;

var MINUTE = 60 * 1000;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;

//var lastMonthEst = new Date(Date.now() - (4 * WEEK));
var lastMonthEst = new Date(Date.now());
var lastMonth = new Date(lastMonthEst.getFullYear(), lastMonthEst.getMonth()).getTime();
var lastMonthStr = moment(lastMonth).format('MMMM');
var demoWeeks = [
	{from: lastMonth, to: lastMonth + WEEK},
	{from: lastMonth + WEEK, to: lastMonth + (2 * WEEK)}
];

window.scrollToId = (id) => {
	var el = document.getElementById(id);
		el.scrollIntoView({
			block: 'start',
			behavior: 'smooth'
		});
}

// To speed up score loading
Database.getLeague({
	leagueid: DEMO_LEAGUEID,
	from: Date.now() - WEEK,
	to: Date.now()
}).then(data => {
	DEMO_LEAGUE_OBJ = data;
}).catch(console.error);

var searchByAddress = document.getElementById('search-by-address');
searchByAddress.addEventListener('keypress', e => {
	if(e.charCode === 13){
		searchForYourAlderman();
	}
});

var searchByButton = document.getElementById('search-by-button');
searchByButton.addEventListener('click', e => {
	searchForYourAlderman();
});

var searchError = document.getElementById('search-error');

function searchForYourAlderman(){
	searchError.style.display = 'none';
	var addr = searchByAddress.value;
	findMyWard(addr).then(res => {
		if(res){
			showYourAlderman(res);
		}
	}).catch(err => {
		searchError.style.display = 'block';
		searchError.innerText = err;
	});
}

function getAldermanByWard(num){
	var pnum = '' + num;
	while(pnum.length < 4){
		pnum = '0' + pnum;
	}
	var pid = 'playerid' + pnum
	var player = PLAYER_MAP[pid];
		player.pid = pid;
	return player;
}

var yourAlderman = document.getElementById('your-alderman');
var aldSub = document.getElementById('your-ward');
var aldScore = document.getElementById('your-alderman-score');
var wardNum = document.getElementById('your-ward-number');
var breakDown = document.getElementById('ward-score-breakdown');
var yourAldHist = document.getElementById('your-alderman-historical');

yourAldHist.dataset.from = demoWeeks[0].to - (4 * WEEK);
yourAldHist.dataset.to = demoWeeks[0].to;

function showYourAlderman(res){
	var alderman = getAldermanByWard(res.WARD);
	yourAlderman.innerText = alderman.name;
	aldSub.innerText = 'Alderman of Ward ' + alderman.ward;
	wardNum.innerText = res.WARD;
	yourAldHist.dataset.pid = alderman.pid;
	yourAldHist.innerText = 'View scores for ' + alderman.name;
	Database.getPlayer({
		leagueid: DEMO_LEAGUEID,
		playerid: alderman.pid,
		from: Date.now() - WEEK,
		to: Date.now()
	}, DEMO_LEAGUE_OBJ).then(data => {
		var sum = 0;
		breakDown.innerHTML = '';
		for(var sid in data.scores){
			var pts = data.scores[sid];
				sum += pts;
			var dataset = Database.Scoring.DATASETS[sid].name;
			var scoreStr = pts + ' points on ' + dataset;
			var li = document.createElement('li');
				li.innerText = scoreStr;
			breakDown.appendChild(li);
		}
		aldScore.innerText = sum;
		var tli = document.createElement('li');
			tli.innerText = 'For a grand total of ' + sum + ' points.';
		breakDown.appendChild(tli);
		window.scrollToId('alderman-result');
	}).catch(console.error);
}

var monthSpans = document.getElementsByClassName('insert-month');
var visitorTable = document.getElementById('visitor-roster');
var robotTable = document.getElementById('robot-roster');

for(var m = 0; m < monthSpans.length; m++){
	var mSpan = monthSpans[m];
	mSpan.innerText = lastMonthStr;
}

var pastWeek = document.getElementById('insert-past-week');
pastWeek.innerText = moment(demoWeeks[0].from).format('M/D');

var nextWeek = document.getElementById('insert-next-week');
nextWeek.innerText = moment(demoWeeks[1].from).format('M/D');

var demoRosters = false;
Database.getAllPlayers({
	leagueid: DEMO_LEAGUEID,
	from: demoWeeks[0].from,
	to: demoWeeks[0].to
}, DEMO_LEAGUE_OBJ).then(playerMap => {
	var rosters = getRandomRosterPair();
	var starters = {
		visitor: 0,
		robot: 0
	}
	var callbackMap = {};
	for(var pid in playerMap){
		var player = playerMap[pid];
		player.starter = false;
		if(pid in rosters.visitor){
			if(starters.visitor < 3){
				player.starter = true;
				starters.visitor++;
			}
			rosters.visitor[pid] = player;
		}
		if(pid in rosters.robot){
			if(starters.robot < 3){
				player.starter = true;
				starters.robot++;
			}
			rosters.robot[pid] = player;
		}
		var action = getPlayerAction(player);
		callbackMap[pid] = action;
	}
	demoRosters = rosters;
	showDemoRosters(callbackMap);
}).catch(console.error);

function getPlayerAction(player){
	var action = {
		fn: e => {
			var event = new CustomEvent('roster-click', {
				detail: demoRosters.visitor[player.playerid]
			});
			window.dispatchEvent(event);
		}
	};
	return action;
}

function getRandomRosterPair(){
	var visitor = {};
	var robot = {};
	for(var r = 1; r < 11; r++){
		var player = getAldermanByWard(r);
		if(r < 6){
			visitor[player.pid] = player;
		}
		else{
			robot[player.pid] = player;
		}
	}
	return {visitor: visitor, robot: robot};
}

var scout = ScoutingReport();
scout.initializeReport('.scout-anchor');

function renderRosterTable(table, roster, callback, opt){
	var options = opt || {};
	table.innerHTML = '';
	var thead = document.createElement('thead');
	var th1 = document.createElement('th');
		th1.innerText = 'Alderman';
	var th2 = document.createElement('th');
		th2.innerText = 'Score';
	var th3 = document.createElement('th');
		th3.innerText = 'Lineup';
		thead.appendChild(th1);
		thead.appendChild(th2);
		thead.appendChild(th3);
		table.appendChild(thead);
	var list = Object.keys(roster).map(pid => {
		return roster[pid];
	}).sort((a, b) => {
		if(a.starter === b.starter){
			//return scout.sumScores(b.scores) - scout.sumScores(a.scores);
			return a.name.localeCompare(b.name);
		}
		else{
			if(a.starter){
				return -1;
			}
			else{
				return 1;
			}
		}
	});
	var lineupSum = 0;
	list.forEach((player, idx) => {
		if(player.starter){
			lineupSum += scout.sumScores(player.scores);
		}
		if(idx === 3){
			var br = document.createElement('tr');
			var b1 = document.createElement('td');
				b1.innerText = '';
			var b2 = document.createElement('td');
				b2.innerText = lineupSum;
			var b3 = document.createElement('td');
				b3.innerText = 'Total';
				br.appendChild(b1);
				br.appendChild(b2);
				br.appendChild(b3);
				table.appendChild(br);
		}
		var pid = player.playerid;
		var tr = document.createElement('tr');
		var td1 = document.createElement('td');
			td1.innerText = player.name;
		//if(!options.locked){
			td1 = scout.attachReport(td1, player.playerid, {
				from: demoWeeks[0].to - (4 * WEEK),
				to: demoWeeks[0].to
			});
		//}
		var td2 = document.createElement('td');
			td2.innerText = scout.sumScores(player.scores);
		var td3 = document.createElement('td');
		if(options.locked){
			td3.innerText = player.starter ? 'Starting' : 'Benched';
		}
		else{
			if(selectedPlayer === player.playerid){
				td3.innerText = player.starter ? 'Benching' : 'Starting';
			}
			else if(!player.hidden){
				var btn = document.createElement('button');
				btn.addEventListener('click', callback[pid].fn);
				btn.innerText = player.starter ? 'Bench' : 'Start';
				td3.appendChild(btn);	
			}	
		}
			tr.appendChild(td1);
			tr.appendChild(td2);
			tr.appendChild(td3);
			table.appendChild(tr);
	});
	return {
		teamScore: lineupSum
	}
}

var selectedPlayer = false;

function showDemoRosters(callbackMap){
	window.addEventListener('roster-click', e => {
		var player = e.detail;
		if(selectedPlayer){
			var selPlayer = demoRosters.visitor[selectedPlayer];
			var thisPlayer = demoRosters.visitor[player.playerid];
				selPlayer.starter = !selPlayer.starter;
				thisPlayer.starter = !thisPlayer.starter;
			selectedPlayer = false;
			for(var pid in demoRosters.visitor){
				demoRosters.visitor[pid].hidden = false;
			}
		}
		else{
			selectedPlayer = player.playerid;
			for(var pid in demoRosters.visitor){
				var otherPlayer = demoRosters.visitor[pid];
				if(otherPlayer.starter === player.starter){
					demoRosters.visitor[pid].hidden = true;
				}
			}
		}
		renderRosterTable(visitorTable, demoRosters.visitor, callbackMap);
	});
	renderRosterTable(visitorTable, demoRosters.visitor, callbackMap);
	renderRosterTable(robotTable, demoRosters.robot, {}, {
		locked: true
	});
}

var visitorResult = document.getElementById('visitor-result');
var robotResult = document.getElementById('robot-result');
var submitRoster = document.getElementById('submit-roster');

var gameOver = false;
submitRoster.addEventListener('click', e => {
	if(!gameOver){
		renderRosterTable(visitorTable, demoRosters.visitor, {}, {
			locked: true
		});
		gameOver = true;
	}
	Database.getAllPlayers({
		leagueid: DEMO_LEAGUEID,
		from: demoWeeks[1].from,
		to: demoWeeks[1].to
	}, DEMO_LEAGUE_OBJ).then(playerMap => {
		var rosters = {
			visitor: {},
			robot: {}
		};
		for(var vid in demoRosters.visitor){
			demoRosters.visitor[vid].scores = playerMap[vid].scores;
		}
		for(var rid in demoRosters.robot){
			demoRosters.robot[rid].scores = playerMap[rid].scores;
		}
		var visitorRes = renderRosterTable(visitorResult, demoRosters.visitor, {}, {
			locked: true
		});
		var robotRes = renderRosterTable(robotResult, demoRosters.robot, {}, {
			locked: true
		});
		var p = document.getElementById('demo-outcome');
		if(visitorRes.teamScore > robotRes.teamScore){
			p.innerText = 'Way to go! Your team won ' + visitorRes.teamScore + ' to ' + robotRes.teamScore + '!';
		}
		if(visitorRes.teamScore < robotRes.teamScore){
			p.innerText = 'Too bad. Your team lost ' + visitorRes.teamScore + ' to ' + robotRes.teamScore + '!';
		}
		window.scrollToId('game-result');
	}).catch(console.error);
});

var playGameBtns = document.getElementsByClassName('play-game');
for(var p = 0; p < playGameBtns.length; p++){
	var btn = playGameBtns[p];
	btn.addEventListener('click', e => {
		window.open('https://bit.ly/fantasycivicsform');
	});
}
