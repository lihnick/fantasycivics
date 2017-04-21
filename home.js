var Database = InitDatabase();
var DEMO_LEAGUEID = '-KdIiWEUj7_toD3MKMO_';

var MINUTE = 60 * 1000;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;

var yourAlderman = document.getElementById('your-alderman');

var searchByAddress = document.getElementById('search-by-address');
searchByAddress.addEventListener('keypress', e => {
	if(e.charCode === 13){
		var addr = searchByAddress.value;
		findMyWard(addr).then(res => {
			if(res){
				showYourAlderman(res);
			}
		}).catch(err => {
			console.error(err);
		});
	}
});

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

var aldScore = document.getElementById('your-alderman-score');

function showYourAlderman(res){
	var alderman = getAldermanByWard(res.WARD);
	yourAlderman.innerText = alderman.name;
	Database.getPlayer({
		leagueid: DEMO_LEAGUEID,
		playerid: alderman.pid,
		from: Date.now() - WEEK,
		to: Date.now()
	}).then(data => {
		console.log(data);
		var sum = 0;
		for(var sid in data.scores){
			sum += data.scores[sid];
		}
		aldScore.innerText = sum;
	}).catch(console.err);
}