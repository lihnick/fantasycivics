# Database Documentation

## Getting Started

All five of these files must be imported.

```html
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
	newUser: true, // Whether or not updated user is a new user
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