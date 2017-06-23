let isDOMElement = (obj) => {
	return obj.nodeName ? true : false;
}

let createRow = (row, options) => {
	let opt = options || {
		header: false
	};
	let tr = document.createElement('tr');
	row.forEach(cell => {
		let td = document.createElement(opt.header ? 'th' : 'td');
		if(isDOMElement(cell)){
			td.appendChild(cell);
		}
		else{
			td.innerText = cell;
		}
		tr.appendChild(td);
	});
	return tr;
}

let getWindowPath = () => {
	let pathList = window.location.pathname.split('/');
		pathList.pop();
	return '/' + pathList.join('/');
}

let RosterView = (playerMap, options) => {
	let opt = options || {};
	let table = opt.table || false;
	if(!table){
		table = document.createElement('table');
		table.classList.add('sortable-theme-bootstrap');
		table.setAttribute('data-sortable', '');
	}

	let thead = document.createElement('thead');
	let header = false;
	if(opt.columns){
		header = createRow(opt.columns.map(col => col.header), {header: true});
	}
	else{
		header = createRow(['Name', 'Ward', 'Score'], {header: true});
	}
	thead.appendChild(header);
	let tbody = document.createElement('tbody');
	let playersToRender = Object.keys(playerMap).map(pid => playerMap[pid]);
	playersToRender.forEach(player => {
		let row = false;
		if(opt.columns){
			row = createRow(opt.columns.map(col => col.cell(player)));
		}
		else{
			row = createRow([player.name, player.ward, player.score]);
		}
		if(opt.clickRow){
			let module = options.module || {};
			row.addEventListener('click', e => {
				opt.clickRow(player, module);
			});
		}
		tbody.appendChild(row);
	});
	table.appendChild(thead);
	table.appendChild(tbody);

	return table;

}

let getStockColumns = (opt, actions) => {
	let module = opt.module;
	let system = opt.system;
	let stock = {
		name: {
			header: 'Name',
			cell: (player) => {
				return player.name;
			}
		},
		ward: {
			header: 'Ward',
			cell: (player) => {
				return player.ward;
			}
		},
		total: {
			header: 'Total',
			cell: (player) => {
				return player.score;
			}
		},
		headshot: {
			header: '',
			cell: (player) => {
				let url = window.location.origin + getWindowPath() + '/assets/headshots/' + player.pid + '.png';
				let div = document.createElement('div');
					div.classList.add('headshot', 'headshot-roster');
					div.style.backgroundImage = 'url("' + url + '")';
				return div;
			}
		},
		breakdown: {
			header: 'Breakdown',
			cell: (player) => {
				let button = document.createElement('button');
					button.innerText = 'View';
					button.addEventListener('click', e => {
						//system.clickRow(player, module);
						actions.emit('view', {
							player: player,
							module: module
						});
					});
				return button;
			}
		},
		drop: {
			header: '',
			cell: (player) => {
				let button = document.createElement('button');
					button.innerText = 'Drop';
					button.addEventListener('click', e => {
						actions.emit('drop', player);
					});
				return button;
			}
		},
		add: {
			header: '',
			cell: (player) => {
				let button = document.createElement('button');
					button.innerText = 'Add';
					button.addEventListener('click', e => {
						actions.emit('add', player);
					});
				return button;
			}
		}
	}
	for(let bid in system.breakdown){
		let cat = system.breakdown[bid];
		stock[bid] = {
			header: cat.header || 'N/A',
			cell: (player) => {
				return player.breakdown[bid].score;
			}
		}
	}
	return stock;
}

let CustomRosterView = (id, opt) => {
	let emitter = {};
	let emit = (eventType, payload) => {
		let callback = emitter[eventType] || false;
		if(callback){
			callback(payload);
		}
		else{
			console.error('Uncaught event emitted: ' + eventType, payload);
		}
	}
	let render = () => {
		let scores = module.scoreByFunction(system);
		let table = RosterView(scores, {
			module: module,
			columns: columns
		});
		let out = document.getElementById(id);
			out.innerHTML = '';
		out.appendChild(table);
		Sortable.initTable(table);
	}
	let module = opt.module;
	let system = opt.system;
	let stockColumnsMap = getStockColumns({
		module: module,
		system: system
	}, {
		render: render,
		emit: emit
	});
	let columns = opt.columns.map(col => stockColumnsMap[col]);
	render();
	let handleEvents = {
		module: module,
		system: system,
		on: (eventType, callback) => {
			emitter[eventType] = callback; 
		},
		render: () => {
			render();
		}
	}
	return handleEvents;
}

let PlayerView = (player, module) => {
	let div = document.createElement('div');
		div.classList.add('scoring-breakdown');

	let h = document.createElement('h1');
		h.innerText = player.name;
		div.appendChild(h);
	let s = document.createElement('h4');
		s.innerText = 'Ward ' + player.ward;
		div.appendChild(s);

	let headshot = document.createElement('div');
	let url = window.location.origin + getWindowPath() + '/assets/headshots/' + player.pid + '.png';
		headshot.classList.add('headshot', 'headshot-profile');
		headshot.style.backgroundImage = 'url("' + url + '")';
		div.appendChild(headshot);

	let r = document.createElement('p');
	let rangeFormatStr = 'M/D/YY';
	let rangeStart = moment(module.range.from).format(rangeFormatStr);
	let rangeEnd = moment(module.range.to).format(rangeFormatStr);
		r.innerText = 'Scores from ' + rangeStart + ' to ' + rangeEnd + ':';
		div.appendChild(r);
	let table = document.createElement('table');
	let trh = document.createElement('tr');
	let th1 = document.createElement('th');
		th1.innerText = 'Category';
		trh.appendChild(th1);
	let th2 = document.createElement('th');
		th2.innerText = 'Score';
		trh.appendChild(th2);
	table.appendChild(trh);
	for(let bid in player.breakdown){
		let category = player.breakdown[bid];
		let tr = document.createElement('tr');
		let td1 = document.createElement('td');
			td1.innerText = category.text;
			tr.appendChild(td1);
		let td2 = document.createElement('td');
			td2.innerText = category.score;
			tr.appendChild(td2);
		table.appendChild(tr);
	}
	let trt = document.createElement('tr');
	let tt1 = document.createElement('th');
		tt1.innerText = 'Total';
		trt.appendChild(tt1);
	let tt2 = document.createElement('th');
		tt2.innerText = player.score;
		trt.appendChild(tt2);
	table.appendChild(trt);
	div.appendChild(table);
	return div;
};