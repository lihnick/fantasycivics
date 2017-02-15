getUser({
	userid: 'userid0001'
})

{
	userid: 'userid0001',
	name: 'Derek Eder',
	image: '//url//'
}

getUserLeagues({
	userid: 'userid0001'
})

{
	userid: 'userid0001',
	leagues: {
		leagueid0008: {
			name: 'ChiHackNight',
			start: 1487138400000,
			end: 1489554000000,
			users: {
				userid0001: {
					name: 'Derek Eder',
					image: '//url//'
				},
				userid0013: {
					name: 'Nina Sandlin',
					image: '//url//'
				}
			}
		},
		leagueid0014: {
			name: 'DataMade',
			start: 1487138400000,
			end: 1489554000000,
			users: {
				userid0001: {
					name: 'Derek Eder',
					image: '//url//'
				},
				userid0056: {
					name: 'Eric Sherman',
					image: '//url//'
				}
			}
		}
	}
}

getLeague({
	leagueid: 'leagueid0008',
	from: timestamp, // Defaults to start of week
	to: timestamp // Defaults to end of week
})

{
	id: 'leagueid0008',
	name: 'ChiHackNight',
	start: 1487138400000,
	end: 1489554000000,
	from: timestamp,
	to: timestamp,
	users: {
		userid0001: {
			name: 'Derek Eder',
			image: '//url//'
		},
		userid0013: {
			name: 'Nina Sandlin',
			image: '//url//'
		}
	},
	rosters: {
		userid0001: {
			playerid0012: {
				name: 'George Cardenas',
				image: '//url//',
				starter: true,
				scores: {
					graffiti: 12,
					potholes: 3,
					streetlights: -4
				}
			},
			playerid0014: {
				name: 'Ed Burke',
				image: '//url//',
				starter: true,
				scores: {
					graffiti: 6,
					potholes: 8,
					streetlights: 9
				}
			},
			playerid0015: {
				name: 'Raymond Lopez',
				image: '//url//',
				starter: true,
				scores: {
					graffiti: -2,
					potholes: 15,
					streetlights: 3
				}
			},
			playerid0010: {
				name: 'Susan Garza',
				image: '//url//',
				starter: false,
				scores: {
					graffiti: 2,
					potholes: 5,
					streetlights: 1
				}
			},
			playerid0025: {
				name: 'Daniel Solis',
				image: '//url//',
				starter: false,
				scores: {
					graffiti: 1,
					potholes: 0,
					streetlights: 1
				}
			}
		}
	}
}

getRoster({
	userid: 'userid0001',
	leagueid: 'leagueid0008',
	from: timestamp, // Defaults to start of week
	to: timestamp // Defaults to end of week
})

{
	userid: 'userid0001',
	leagueid: 'leagueid0008',
	from: timestamp,
	to: timestamp,
	players: {
		playerid0012: {
			name: 'George Cardenas',
			image: '//url//',
			starter: true,
			scores: {
				graffiti: 12,
				potholes: 3,
				streetlights: -4
			}
		},
		playerid0014: {
			name: 'Ed Burke',
			image: '//url//',
			starter: true,
			scores: {
				graffiti: 6,
				potholes: 8,
				streetlights: 9
			}
		},
		playerid0015: {
			name: 'Raymond Lopez',
			image: '//url//',
			starter: true,
			scores: {
				graffiti: -2,
				potholes: 15,
				streetlights: 3
			}
		},
		playerid0010: {
			name: 'Susan Garza',
			image: '//url//',
			starter: false,
			scores: {
				graffiti: 2,
				potholes: 5,
				streetlights: 1
			}
		},
		playerid0025: {
			name: 'Daniel Solis',
			image: '//url//',
			starter: false,
			scores: {
				graffiti: 1,
				potholes: 0,
				streetlights: 1
			}
		}
	}
}