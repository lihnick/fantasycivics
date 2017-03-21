# Fantasy Civics #

CS 487 - Software Engineering Project

### CS 487 Project Proposal ###
- [x] Due 2/18/17

:+1:

##### Proposed Functionality #####

> Generate interests in politics by gamifying the process in which users get their news digest.


##### Team Members and Roles #####

User Interface - CSS/HTML
<br>Le

Application/Logic - Javascript or Python
<br>Haosheng

Database - Firebase, MongoDB or SQLITE
<br>Vinesh

Data Streams, e.g. API, news feeds, data scraping - Javascript or Python
<br>Yuan


<br>

**Things we will NOT include**

* No monetary payouts
* Illinois only 
* No fact checking
* Outdated browsers support
* No online stores to sell memorabilia
* No assessment in news bias


**Requirements**

Authentication (A)
- [x] A1 - Users should be able to login and logout

League Management (L)
- [x] L1 - Users should be able to create new leagues
- [ ] L2 - Users should be able to participate in multiple leagues
- [ ] L3 - Users should be able to invite players to join a league

Roster Management (R)
- [x] R1 - Users should be able to view all players
- [ ] R2 - Users should be able to see changes (delta values) in player scores each week
- [x] R3 - Users should be able to sort players
- [ ] R4 - Users should be able to bench and start players
- [ ] R5 - Users should be able to acquire, drop, and trade players
- [ ] R6 - Users should make their moves anytime they want then agree on when to finalize

Matches (M)
- [ ] M1 - Users should be able to see past/current match-ups in a league (lineups & scores)
- [ ] M2 - Users should be able to view leaderboard of league
- [ ] M3 - Users should be able to play games using historical data
- [ ] M4 - Users should be able to play games using current data
- [ ] M5 - Users should enjoy the game


**Nice To Haves**

* City agnostic
* Include police districts 
* Options for: Number of members, scoring systems, 
* Bracket tournament
* News information
* Trade members or wards
* Benching members
* Leaderboard


**APIs and other Infos **

Important Got Ya's

* Users are not the same as players
* Date rages are for score history and not for team history
* When requesting rosters, time range has to be specified because rosters come with scores
* All response and request functions return promises, and the arguments of the callbacks are the response

Chicago APIs

[Graffiti](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Graffiti-Removal/hec5-y4x5)<br>
[Abandoned Vehicles](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Abandoned-Vehicles/3c9v-pnva)<br>
[Pot Holes Reported](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Pot-Holes-Reported/7as2-ds3y)<br>
[Tree Debris](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Tree-Debris/mab8-y9h3)<br>
[Tree Trim](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Tree-Trims/uxic-zsuj)<br>
[Rodent Baiting](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Rodent-Baiting/97t6-zrhs)<br>
[Sanitation Complaint](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Sanitation-Code-Complaints/me59-5fac)<br>
[Street Lights Outage](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Street-Lights-One-Out/3aav-uy2v)<br>
[Alley Lights Outage](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Alley-Lights-Out/t28b-ys7j)<br>
[Garbage Cart](https://data.cityofchicago.org/Service-Requests/311-Service-Requests-Garbage-Carts/9ksk-na4q)<br>

[govtrack API](https://www.govtrack.us/developers)


### Preliminary Design Report ###
- [x] Due 3/11/17
