# Application Testing

### Sample Test
Visit login, app, and roster pages and execute this in the console
```javascript
if (USER.userid)
  console.log("userid found")
if (USER.email)
  console.log("email found")
if (USER.image)
  console.log("image found")
if (USER.name)
  console.log("name found")
```
This is just a sample test for test case A1 it doesn't have to be structure exactly this way, as long as it checks the condition in the test case

# Global Variable
### Global Variable to access the application data
```javascript
// Open console and type
USER
```

### All Pages
Text information about the user
``` javascript
// userid info
USER.userid
// email info
USER.email
// image url
USER.image
// username info
USER.name
```

### app page
```javascript
// information on all the league of the user, return list of objects
USER._userLeagues.leagues
// Sample object structure
var leagues = {
  end: 1488175200000,
  leagueid: "-Ke_xC4qwkqQiCBZhw-N",
  name: "Test League",
  start: 1486360800000,
  users: [{userid:"TuQ9fy55KOTCN0MDkfbYmIFKI3n1", team:"Untitled Team", losses:0, wins:0
          {userid:"jUQfb4Cwwwg6hjPjp1URKq6oX0O2", team:"Untitled Team", losses:0, wins:0},
          {userid:"testuser0001", team:"Untitled Team", losses:0, wins:0},
          {userid:"testuser0005", team:"Untitled Team", losses:0, wins:0}]
}
```

### roster page
```javascript
// list of the 5 players on the user's roster
USER._userRoster.players
// sample player in a roster
var one_roster = {
playerid: "playerid0007",
name: "Gregory Mitchell",
owner: "TuQ9fy55KOTCN0MDkfbYmIFKI3n1",
starter: true,
ward: 7,
scores: {"pot_holes":10,"street_lights":5,"abandoned_vehicles":0},
pending: "Benching"
}
```
* Roster list size should not change when the users are modifying the list
* The content of the roster list can change when the user modify their list

```javascript
// object of the 50 players/alderman, returns a object of objects
USER._allPlayers.players
// sample object structure
var player1 = {
name: "Joe Moreno",
owner: false,
playerid: "playerid0001",
starter: false,
ward: 1,
show: true,
pending: "",
scores: {pot_holes:8, street_lights:2, abandoned_vehicles: 0}
}
```
* pending is modified when a user clicks on the action buttons in the roster
  * pending states: ``` {"Acquiring", "Dropping"} ```
* show is modified when a user make their first selection
  * two selection is needed for a acquire/drop to complete, when one is clicked, the player list will be filtered to make the next selection easier
  * show states: ``` {true, false} ```
* owner is modified when a user makes two valid acquire/drop actions, or an update from another user that made those two valid actions
  * owner states will either be false or a string of an owner's id
  * owner states: ``` {false, "jUQfb4Cwwwg6hjPjp1URKq6oX0O2"} ```
* scores is a object of the scores for each alderman
  * the size of scores will be 3 (for now, should not change)
  * scores' key states: ```{"pot_holes", "street_lights", "graffiti", "rodent_baiting", "tree_trims", "garbage_carts", "pot_holes", "street_lights", "abandoned_vehicles"}```
 
If the current user clicks on a player, it will be added to a variable that saves the current click, then when they click again it will use the current click and the previous click to make two action.
The first click is saved in a variable
```javascript
USER.workingPlayers
// same type as a player
```
* USER.workingPlayers states: {null, {...}}


