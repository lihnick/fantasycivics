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
	for(let pid in playerMap){
		let player = playerMap[pid];
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
	}
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
		breakdown: {
			header: 'Breakdown',
			cell: (player) => {
				let button = document.createElement('button');
					button.innerText = 'View';
					button.addEventListener('click', e => {
						system.clickRow(player, module);
					});
				return button;
			}
		},
		drop: {
			header: 'Drop',
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
			header: 'Add',
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