function ScoutingReport(){

	var module = {};


	module.attachReport = (div, player) => {
		div.addEventListener('click', e => {
			console.log(player);
		});
		return div;
	}

	return module;

}