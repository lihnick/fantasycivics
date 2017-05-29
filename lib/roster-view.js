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

let RosterView = (playerMap, options) => {
	let opt = options || {};
	let table = opt.table || false;
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
		if(opt.clickRow){
			row.addEventListener('click', e => {
				opt.clickRow(player);
			});
		}
		tbody.appendChild(row);
	}
	table.appendChild(thead);
	table.appendChild(tbody);

	return table;

}