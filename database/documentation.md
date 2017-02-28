# Database Documentation

## Getting Started

All of these files must be imported.

```html
<!-- Dependencies -->
<script src="https://www.gstatic.com/firebasejs/3.6.9/firebase.js"></script>
<script type="text/javascript" src="../assets/promise.min.js"></script>
<script type="text/javascript" src="../assets/jquery-3.1.1.min.js"></script>
<script type="text/javascript" src="../lib/util.js"></script>
<!-- Database API -->
<script type="text/javascript" src="./database/player.js"></script>
<script type="text/javascript" src="./database/league.js"></script>
<script type="text/javascript" src="./database/scoring.js"></script>
<script type="text/javascript" src="./database/auth.js"></script>
<script type="text/javascript" src="./database/database.js"></script>
```

The above scripts will expose a public function. Call this function to instantiate the database object.

```javascript
var Database = InitDatabase();
```

The database object currently supports the methods below. Most, if not all, methods return promises and can be handled with `then` and `catch` callbacks.

If not otherwise specified, parameters are required. If there is an ellipsis `...` in a response structure, it means that the format of the above object is repeated for other keys at the same level, if any.

## Globals

**Warning:** If using global values other than the default, remember that the values reset to default on any page load.

### Database.LOCK_ROSTERS_AFTER

Value between `0` and `1` to determine at what point during a match users will no longer be able to modify their rosters. Default: `(5/7)`.

* Ex) `Database.LOCKROSTERS_AFTER = 0.5;` means that rosters will be locked to editing halfway through the match.

### Database.IN_SIMULATED_TIME

Boolean for whether or not matches will be played using historical data and simulated time. Default: `false`.

### Database.Scoring.DATASET_NAMES

A mapping of dataset keys to their user-friendly names. The dataset keys match the keys provided in scoring data responses and every scoring data response includes all of the dataset keys.

```javascript
{
	pot_holes: 'Pot Holes',
	street_lights: 'Light Outages',
	graffiti: 'Graffiti'
}
```

## Authentication

### Database.Auth.signInUser()
Launch Google Authentication popup to sign in user. Pop-ups may be blocked by your window.

**Parameters**
`void`

**Response**
Promise bearing data or error.
```
{
	userid: 'testuser0001',
	name: 'Test User',
	email: 'test@fantasycivics.edu',
	image: 'https://fantasycivics.edu/image.png'
}
```

### Database.Auth.signOutUser()
Sign out user.

**Parameters**
`void`

**Response**
Promise representing success or bearing error.

### Database.Auth.getCurrentUser()
Get data for the user who is currently authenticated, if any.

**Parameters**
`void`

**Response**
Promise bearing data or error.
```
{
	userid: 'testuser0001',
	name: 'Test User',
	email: 'test@fantasycivics.edu',
	image: 'https://fantasycivics.edu/image.png'
}
```

## Users

### Database.updateUser()
Update user information, partially or completely. Call this function when logging in users so that existing users can be updated and new users can be created.

**Parameters**
```
{
	// Required
	userid: 'testuser0001',
	// Optional
	name: 'Test User',
	email: 'test@fantasycivics.edu',
	image: 'https://fantasycivics.edu/image.png'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true,
	newUser: true // Whether or not updated user is a new user
}
```

### Database.getUser()
Get available user information.

**Parameters**
```
{
	userid: 'testuser0001'
}
```

**Response**
Promise bearing data or error.
```
{
	userid: 'testuser0001',
	name: 'Test User',
	email: 'test@fantasycivics.edu',
	image: 'https://fantasycivics.edu/image.png'
}
```

### Database.getUserLeagues()
Get information about the leagues a given user is part of.

**Parameters**
```
{
	userid: 'testuser0001'
}
```

**Response**
Promise bearing data or error.
```
{
	userid: 'testuser0001',
	leagues: {
		leagueid0001: {
			name: 'Test League',
			start: 1483250400000,
			end: 1485928800000,
			users: {
				testuser0001: {
					wins: 0,
					losses: 0,
					team: 'Test Team'
				}
				...
			}
		}
		...
	}
}
```

### Database.setTeamName()
Set the team name for a given user in a given league.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	team: 'My New Team Name'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true
}
```

## Invitations

### Database.createLeagueInvitation()
Create a queue for a new league and get the code for others to join.

**Parameters**
```
{
	// Required
	userid: 'testuser0001',
	// Optional
	name: 'Test League'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true,
	inviteid: 'joinleague0001'
}
```

### Database.acceptLeagueInvitation()
Join an existing league queue.

**Parameters**
```
{
	userid: 'testuser0001',
	inviteid: 'joinleague0001'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true,
	inviteid: 'joinleague0001'
}
```

### Database.getLeagueInvitations()
Get all join queues for leagues being started by the given user.

**Parameters**
```
{
	userid: 'testuser0001'
}
```

**Response**
Promise bearing data or error.
```
{
	joinleague0001: {
		league: {
			name: 'Test League',
			creator: 'testuser0001'
		},
		members: {
			testuser0001: {
				userid: 'testuser0001'
				accepted: 1487490870773
			}
			...
		}
	}
	...
}
```

## Leagues

### Database.createLeague()
Create a new league.

**Parameters**
```
{
	// Required
	name: 'Test League',	
	start: 1483250400000,
	end: 1485928800000,
	users: ['testuser0001', 'testuser0002', 'testuser0003'],
	// Optional
	weeks: 6
}
```

* Parameter `weeks` indicates the number of matches for each user to play in a season. If ommitted, default value is 3.
* If the number of users is odd, a random bot user from the database will be selected to even out the schedules.

**Response**
Promise bearing data or error.
```
{
	success: true,
	leagueid: 'leagueid0001'
}
```

### Database.getLeague()
Get an existing league.

**Parameters**
```
{
	leagueid: 'leagueid0001',	
	from: 1483250400000,
	to: 1485928800000
}
```

* Parameters `from` and `to` are the range to consider when reporting player scores.

**Response**
Promise bearing data or error.
```
{
	leagueid: 'leagueid0001',
	name: 'Test League',
	start: 1483250400000,
	end: 1485928800000,
	from: 1483250400000,
	to: 1485928800000,
	users: {
		testuser0001: {
			wins: 0,
			losses: 0,
			team: 'Test Team',
			name: 'Fake Player'
		}
		...
	},
	rosters: {
		testuser0001: {
			playerid0001: {
				name: 'Test Player',
				playerid: 'playerid0001',
				ward: 51,
				starter: true,
				owner: 'testuser0001',
				scores: {
					'potholes': 23,
					'graffiti': -2
					...
				}
			}
			...
		}
		...
	},
	schedule: [
		[
			{
				home: 'testuser0001',
				away: 'testuser0002',
				start: 1483250400000,
				end: 1485928800000
			}
			...
		]
		...
	]
}
```

### Database.getLeagueData()
Get the meta data of an existing league, no player scores.

**Parameters**
```
{
	leagueid: 'leagueid0001'
}
```

**Response**
Promise bearing data or error.
```
{
	leagueid: 'leagueid0001',
	name: 'Test League',
	start: 1483250400000,
	end: 1485928800000,
	users: {
		testuser0001: {
			wins: 0,
			losses: 0,
			team: 'Test Team',
			name: 'Fake Player'
		}
		...
	},
	rosters: {
		testuser0001: {
			playerid0001: {
				name: 'Test Player',
				playerid: 'playerid0001',
				ward: 51,
				starter: true,
				owner: 'testuser0001'
			}
			...
		}
		...
	},
	schedule: [
		[
			{
				home: 'testuser0001',
				away: 'testuser0002',
				start: 1483250400000,
				end: 1485928800000
			}
			...
		]
		...
	]
}
```

* Each "week" (set of matches) is contained in a list. The `schedule` property of the response is a list of these lists.

## Players

**Note:** _In the future, a process to restrict when users can modify their rosters should be implemented, possibly relative to time in the current match._

### Database.getRoster()
Get all players and their scoring data from a roster in a given league for a given user.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	from: 1483250400000,
	to: 1485928800000
}
```

**Response**
Promise bearing data or error.
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	from: 1483250400000,
	to: 1485928800000,
	players: {
		playerid0001: {
			name: 'Test Player',
			playerid: 'playerid0001',
			ward: 51,
			starter: true,
			scores: {
				'potholes': 23,
				'graffiti': -2
				...
			}
		}
		...
	}
}
```

### Database.getPlayer()
Get a player and their scoring data for a given league.

**Parameters**
```
{
	playerid: 'playerid0001',
	leagueid: 'leagueid0001',
	from: 1483250400000,
	to: 1485928800000
}
```

* If you already have the `league` object for the given league, you can accelerate this query like so: `Database.getPlayer({...}, league)`.

**Response**
Promise bearing data or error.
```
{
	playerid: 'playerid0001',
	leagueid: 'leagueid0001',
	from: 1483250400000,
	to: 1485928800000,
	owner: 'testuser0001', // or false if not on rosters in the league
	name: 'Test Player',
	ward: 51,
	starter: true,
	scores: {
		'potholes': 23,
		'graffiti': -2
		...
	}
}
```

### Database.getAllPlayers()
Get a player and their scoring data for a given league.

**Parameters**
```
{
	leagueid: 'leagueid0001',
	from: 1483250400000,
	to: 1485928800000
}
```

* If you already have the `league` object for the given league, you can accelerate this query like so: `Database.getAllPlayers({...}, league)`. This is meant for internal optimization, application should either not use this or highlight it as a risk to be monitored.

**Response**
Promise bearing data or error.
```
{
	playerid0001: {
		playerid: 'playerid0001',
		leagueid: 'leagueid0001',
		from: 1483250400000,
		to: 1485928800000,
		owner: 'testuser0001', // or false if not on rosters in the league
		name: 'Test Player',
		ward: 51,
		starter: true,
		scores: {
			'potholes': 23,
			'graffiti': -2
			...
		}
	}
	...
}
```

### Database.isLocked()
Determine whether or not the given user in the given league can edit their roster. This function is used internally with all methods that affect user rosters and will reject the transaction if the roster is locked.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	on: Date.now()
}
```

**Response**
Promise bearing data or error.
```
	{
		locked: true,
		lockTime: 1483220400000,
		match: {
			userid: 'testuser0001',
			leagueid: 'leagueid0001',
			on: 1483250400000,
			home: 'testuser0001',
			away: 'testuser0002',
			start: 1483250400000,
			end: 1485928800000,
			week: 2
		}
	}
```

* Property `lockTime` in the response is the timestamp at which the roster locks for the current match. It is returned regardless of whether or not the roster is locked. Example use case: if the application wants to let the user know when their roster will lock, or how much time they have left to make changes.

### Database.movePlayer()
Switch a starting player with a benched player on the roster of the given user.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	sit: 'playerid0001',
	start: 'playerid0002'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true
}
```

Transaction will fail with descriptive errors if any of the following are true:

* Given user is not in the given league
* Either player is not on the roster
* Player to sit is already benched
* Player to start is already starting

### Database.acquirePlayer()
Switch a player on the roster of the given user with a free agent who is not on any rosters. Added player will take the status (Starting vs Benched) of the dropped player.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	add: 'playerid0021',
	drop: 'playerid0002'
}
```

**Response**
Promise bearing data or error.
```
{
	success: true
}
```

Transaction will fail with descriptive errors if any of the following are true:

* Given user is not in the given league
* Player to drop is not on the roster of the given user
* Player to add is on the roster of another user in the league

### Database.getTrades()

Coming soon...

### Database.offerTrade()

Coming soon...

### Database.cancelTrade()

Coming soon...

### Database.acceptTrade()

Coming soon...

## Matches

### Database.getMatch()
Get the match a given player is competing in or will compete in on a given date.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	on: 1483250400000
}
```

**Response**
Promise bearing data or error.
```
	{
		userid: 'testuser0001',
		leagueid: 'leagueid0001',
		on: 1483250400000,
		home: 'testuser0001',
		away: 'testuser0002',
		winner: 'testuser0002', // Field will not exist if match is not over
		start: 1483250400000,
		end: 1485928800000,
		week: 2
	}
```

* Properties `start` and `end` represent the start and ending times of the match.
* Property `week` indicates the week in the season the match is part of (does not correspond to week index in schedule).

**Note:** _The process to determine who wins a past match and save that result are still under development._

### Database.getMatchScore()
Get the score and current leader or final winner of a match a given user is competing in or has competed in on a given date.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	on: 1483250400000
}
```

**Response**
Promise bearing data or error.
```
	{
		leagueid: 'leagueid0001',
		winner: 'testuser0002', // Field will show current leader of match, even if match is not over
		match: {
			userid: 'testuser0001',
			leagueid: 'leagueid0001',
			on: 1483250400000,
			home: 'testuser0001',
			away: 'testuser0002',
			winner: 'testuser0002', // Field will not exist if match is not over
			start: 1483250400000,
			end: 1485928800000,
			week: 2
		}
		rosters: {
			testuser0001: {
				playerid0001: {
					name: 'Test Player',
					owner: 'testuser0001',
					playerid: 'playerid0001',
					ward: 51,
					starter: true,
					scores: {
						'potholes': 23,
						'graffiti': -2
						...
					}
				}
				...
			}
			... // Shows same roster for the second player in the match
		}
	}
```

### Database.setMatchOutcome()
Decide the outcome of a match a given user is competing in on a given date.

**Parameters**
```
{
	userid: 'testuser0001',
	leagueid: 'leagueid0001',
	on: 1483250400000
}
```

**Response**
Promise bearing data or error.
```
	{
		success: true
	}
```

## Events

Listen for events like so:

```javascript
Database.when('rosters_change', {
	leagueid: 'leagueid0001'
}, function(res){
	console.log('Rosters Changed: ', res);
});
```

The following events are currently supported:

* `rosters_change`
	* Parameters: `leagueid`
	* Response: `{changed: true}`
