
### ics-calendar-server
#### [ Developed by Eaglex ](http://eaglex.net)

  
##### LICENSE
* LICENCE: CC BY-NC-ND
* SOURCE: _(https://creativecommons.org/licenses/by-nc-nd/4.0/)_

  
#### About
**ics-calendar-server** is a Node.js application that supports creation of `ics/iCal` Calendar events and invites, for `MS-Outlook, or Mail for Mac.` It works by Rest request for specific types `[sickness, vacation]` followed by `userId`, example (http://localhost:5000/calendar/vacation/644) `http://localhost:5000/calendar/:type/:userId`

* Application provides mocked database: `xdb` with access to collections: `members.db` and `absences.db` from `.json`
* Structured with 3 micro services: `server => ics <= xdb`, and middleware :`StatusHandler`
* Build in ES6 with good functional programming.
* Linted code, well scaled with comments, and debug features
* Includes tests with Mocha/Chai
* Includes error/response codes
* Bonus/implemented Istanbul/nyc coverage


#### Why use it
- Generate (.ics) events in bulk, use it to import to your Calendar Supports `ics/version:2`
- Look-up company employees by absence type - and produce list of events
- Search with queries... database/:collection > _`database/members?userId=644`, `database/absences?userId=644`, `database/absences?startDate=2016-12-31&endDate=2017-03-10`, `database/members?userId=644&absence=1`_


#### Motivations
**Build better then the other guy!**

#### Deadline
4 days.


#### Install
- To instal run `npm i`
- To enable eslint, first must run `npm lint:install`, then can use `npm run lint` or `npm run lint:fix`
- Any Issues with node.js version, try `nvm install 11.0.0`

#### Start
`npm start` will start the server and give access to all rest end points

* Then navigate to welcome page : (http://localhost:5000/)

#### Tests & Coverage
All tests located in `./tests/{*,/*}.spec.js`

* To run full spec coverage: `npm run test`
* To only run mocha spec without nyc/instanbul: `npm run mocha`
*  available at: `./coverage/index.html`


#### Stack
Application uses own-build external/utilities `x-utils, simple-q`, can be found at (https://bitbucket.org/eag1ex), as well as vendor npm packages.

* Full list `Express.js, ics/ical/v2, lodash, moment.js, uuid, Node.js, Javascript, ES6, Error handling, micro-services: (xdb, ics, server), x-utils, simple-q, Lint, Chai, Mocha, Istanbul/nyc`



#### Micro Services
List of services that run under the hood:

*  **Server** : Independent Express.js server that imports all assets, barebone authentication is implemented but not enforced.
*  **ICS** : Module that controls logic and operation of the app, imports `xdb` and implements the middleware: `StateHandler` for status response management.
*  **XDB** : Mock database manager, imports all data managed by `ICS`
*  **StatusHandler** : Middleware handles status codes and message response, available examples in `./tests/**`
* _App Service hierarchy: `server => ( ics :StatusHandler) <= xdb`_

#### Config
App config: `./config.js`

  
#### ICS files

- Each .ics file is produced according to `ics/version:2` explained in `https://en.wikipedia.org/wiki/ICalendar` with interpolation support from `ics` npm package.
- Generated files live in `./ical_event_files`, you can change it: `./config.js`
- Generated test file for download, available at: (http://localhost:5000/download/test_2351_event.ics) 


#### Rest API

End/points explained:

* Welcome page : `http://localhost:5000/` : You can see list of available routes

*  `http://localhost:5000/calendar/:event/:userId` : `:event` [sickness, vacation] available based on current database/absences. `:userId` targets absences by reference, produce list of calendar static files to location specified in `./config.js`
  
	
*  `http://localhost:5000/download/:fileName` : After creating ical files  `/calendar/:type/:userId` you can access them with: `:fileName` ({productId}_event.ics), refers to `id` prop on `./absences` collection.

*  `http://localhost:5000/database/:collection` : `:collection` selects your collection, defaults to no query parameters, and lists all available items.
	
* queries on `database/absences?` {userId, startDate/endDate}

* queries on `database/members?` {userId, absence=1} if `absence=1` will append available absences. It is a rich operation, it wisely!


*  `other notes`, each database/:collection has available `searchByLimit[]` in ics.members and ics.absences that can be set to allow search by other fields available in database. (disabled by default).
```

// GET/ examples

// create calendar files by type and userId
http://localhost:5000/calendar/vacation/644
http://localhost:5000/calendar/sickness/644

// download ical file
http://localhost:5000/download/:fileName //(once you generate them with calendar api)

// ical download test file
http://localhost:5000/download/test_2351_event.ics


// list all absences
http://localhost:5000/database/absences

// list absences for 644
http://localhost:5000/database/absences?userId=644

// list all absences with-in range
http://localhost:5000/database/absences?startDate=2016-12-31&endDate=2017-03-10

// list all absences from startDate
http://localhost:5000/database/absences?startDate=2016-12-31


// list all absences to endDate
http://localhost:5000/database/absences?endDate=2017-03-10

// list all members
http://localhost:5000/database/members

// list member 644
http://localhost:5000/database/members?userId=644

```
 
#### Developer comments
- Issues with node.js version? Try `nvm install 11.0.0`


#### Recommended VScode extensions
- `vscode-language-babe, vscode-babel-coloring, comment-anchors, joelday.docthis, vscode-standardjs`


#### TODO

- Stage on Heroku
- Build client interface in `ejs` markup. 


##### Contact

Have questions, or would like to submit feedback, **contact me at:** (https://eaglex.net/app/contact?product=ics-calendar-server)