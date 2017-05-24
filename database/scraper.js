let config = {
	apiKey: "AIzaSyDusGUpsFfhJmRnmB2cgfetwR3ZR2otqe4",
	authDomain: "fantasycivics.firebaseapp.com",
	databaseURL: "https://fantasycivics.firebaseio.com",
	storageBucket: "fantasycivics.appspot.com",
	messagingSenderId: "245596715039"
};
let DatabaseFirebase = firebase.initializeApp(config, 'Fantasy Civics Scraper');
let db = DatabaseFirebase.database();

const URL = 'https://fantasycivicssinatra-vingkan.c9users.io/ocd';

let getOCD = (queryStr) => {
	return new Promise((resolve, reject) => {
		$.get(URL, {query: queryStr}).done(resolve).fail(reject);
	});
}

let getOCDFull = (queryStr, queryPage, fullReply) => {
	let page = queryPage || 1;
	let list = fullReply || [];
	let fullQuery = queryStr + '&page=' + page;
	return new Promise((resolve, reject) => {
		$.get(URL, {query: fullQuery}).done(reply => {
			let res = reply.res;
			list.push.apply(list, res.results);
			console.log(res.meta.page + '/' + res.meta.max_page)
			if(res.meta.page === res.meta.max_page){
				resolve(list);
			}
			else{
				let nextPage = res.meta.page + 1;
				getOCDFull(queryStr, nextPage, list).then(resolve).catch(reject);
			}
		}).fail(reject);
	});
}

let getVoteDetails = (vote) => {
	let promises = [
		getOCD(vote.id),
		getOCD(vote.bill.id)
	];
	return new Promise((resolve, reject) => {
		Promise.all(promises).then(details => {
			resolve({
				vote: details[0].res,
				bill: details[1].res
			});
		}).catch(reject);
	});
}

let getVoteTimestamp = (vote) => {
	return new Date(vote.start_date + ' CST').getTime();
}

const MAYOR_OCD = 'ocd-person/f649753d-081d-4f22-8dcf-3af71de0e6ca';

let sponsoredByMayor = (bill) => {
	return bill.sponsorships.map(s => s.entity_id).indexOf(MAYOR_OCD) > -1;
}

let voteURL = 'votes?organization__id=ocd-organization/ef168607-9135-4177-ad8e-c1f7a4806c3a'
	voteURL += '&start_date__contains=2017-04'
	voteURL += '&sort=start_date'
	voteURL += '&page=3'

getOCDFull(voteURL, 11).then(res => {

	let output = [];

	console.log(res)

	let vote1 = res[0]
	let voteN = res[res.length-1]
	let d1 = new Date(vote1.start_date + ' CST')
	console.log(d1)
	let dN = new Date(voteN.start_date + ' CST')
	console.log(dN)

	let promises = [];
	res.forEach(voteRecord => {
		let vp = getVoteDetails(voteRecord);
		promises.push(vp);
	});
	Promise.all(promises).then(votes => {

		console.log(votes);

		let aldMap = {};

		votes.forEach(voteData => {
			let vote = voteData.vote;
			let bill = voteData.bill;
			bill.sponsorships.forEach(sponsor => {
				output.push({
					type: 'sponsorship',
					timestamp: getVoteTimestamp(vote),
					ocd_person: sponsor.entity_id,
					ocd_bill: bill.id,
					mayor_sponsored: sponsoredByMayor(bill),
					result: vote.result,
					classification: sponsor.classification
				});
			});
			vote.votes.forEach(voteCast => {
				output.push({
					type: 'vote',
					timestamp: getVoteTimestamp(vote),
					ocd_person: voteCast.voter.id,
					ocd_bill: bill.id,
					mayor_sponsored: sponsoredByMayor(bill),
					result: vote.result,
					option: voteCast.option
				});
				aldMap[voteCast.voter.id] = voteCast.voter_name
			});
		});

		console.log(output);
		window.output = output;

		console.log(aldMap)

	});

});




