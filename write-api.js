// Create League

createLeague({
	name: 'ChiHackNight',
	start: timestamp,
	end: timestamp,
	users: ['userid0001', 'userid0021']
})

{
	success: true,
	leagueid: 'leagueid0008'
}

// Offer Trade

offerTrade({
	leagueid: 'leagueid0008',
	send: {
		userid: 'userid0001',
		playerid: 'playerid0032'
	},
	swap: {
		userid: 'userid0021',
		playerid: 'playerid0007'
	}
})

{
	success: true,
	tradeid: 'tradeid0005'
}

// Cancel Trade

cancelTrade({
	leagueid: 'leagueid0008',
	tradeid: 'tradeid0005'
})

{
	success: true
}

// Accept Trade

acceptTrade({
	leagueid: 'leagueid0008',
	tradeid: 'tradeid0005'
})

{
	success: true
}

// Move Player (Sit/Start)

movePlayer({
	leagueid: 'leagueid0008',
	userid: 'userid0021',
	sit: 'playerid0032',
	start: 'playerid0070'
});

{
	success: true
}

// Acquire Player (Add/Drop)

acquirePlayer({
	leagueid: 'leagueid0008',
	userid: 'userid0021',
	add: 'playerid1700',
	drop: 'playerid0032'
});

{
	success: true
}
