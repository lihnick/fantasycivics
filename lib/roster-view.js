let RosterView = (playerMap, inTable) => {

	let createRow = (row, options) => {
		let opt = options || {
			header: false
		};
		let tr = document.createElement('tr');
		row.forEach(cell => {
			let td = document.createElement(opt.header ? 'th' : 'td');
			td.innerText = cell;
			tr.appendChild(td);
		});
		return tr;
	}

	let table = inTable || false;
	if(!table){
		table = document.createElement('table');
		table.classList.add('sortable-theme-bootstrap');
		table.setAttribute('data-sortable', '');
	}

	let thead = document.createElement('thead');
	let header = createRow(['Name', 'Ward', 'Score'], {header: true});
	thead.appendChild(header);
	let tbody = document.createElement('tbody');
	for(let pid in playerMap){
		let player = playerMap[pid];
		let row = createRow([player.name, player.ward, player.score]);
		tbody.appendChild(row);
	}
	table.appendChild(thead);
	table.appendChild(tbody);

	return table;

}