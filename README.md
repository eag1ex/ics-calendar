
### ics-calendar-server
#### [ Developed by Eaglex ](http://eaglex.net)

  
##### LICENSE
* LICENCE: CC BY-NC-ND
* SOURCE: https://creativecommons.org/licenses/by-nc-nd/4.0/

  
#### About
**ics-calendar-server** is a Node.js back-end stack application used to produce `ics/iCal` files for Calendars like: `MS-Outlook, or Mail for Mac.` It works by GET request with specific types `[sickness, vacation]` followed by `userId`, example `http://localhost:5000/calendar/vacation/644` (http://localhost:5000/calendar/type/userId)

	- Application provides mocked database: `xdb` with access TWO collections `members.db` and `absences.db` from `.json`
	- It is scructured with 3 independand micro services: `server => ics <= xdb`, and middleware :`StatusHandler`
	- Build in ES6 with good functional programming.
	- Linted code, well scaled with comments, and debug features
	- Bonus implemented istanbul/nyc coverage
	- Inclused tests with Mocha/Chai
	- Included error/response codes


#### Why use it
- Generage (.ics) files in bulk, and use it to import to your Calendar. Supports `ics/version:2`
- Lookup company members by type - will produce list of all members by type
- Search with queries... database/:collection > `database/members?userId=644`, `database/absences?userId=644`, `database/absences?startDate=2016-12-31&endDate=2017-03-10`, `database/members?userId=644&absence=1`


#### Client
- Initialy build for `crewmeister.com` software company


#### Install
- To instal run `npm i`
- To enable eslint, first must run `npm lint:install`, then can use `npm run lint` or `npm run lint:fix`


#### Start
-  `npm start` will start the server and give access to all rest end points


#### Tests & Coverage
All tests are located in `./tests/{*,/*}.spec.js`

- To run full spec coverage: `npm run test`
- To only run mocha spec without nyc/instanbul: `npm run mocha`
- Coverege file available at: `./coverage/index.html`



#### Stack
- Application uses own build external/utilities `x-utils, simple-q`, as well as vendor npm packages.
- Full list `Express.js, ics/ical/v2, lodash, moment.js, uuid, Node.js, Javascript, ES6, Error handling, micro-services: (xdb, ics, server), x-utils, simple-q, Lint, Chai, Mocha, Istanbul/nyc`



#### Micro Services
- List of services that runs this application:

-  **Server** : Independant Express.js server that imports all assets, barebone authentication is implemented but not inforeced.
-  **ICS** : Module that controls logic and operation of the application, it imports `xdb` and implements the middleware: `StateHandler` for status response management.
-  **XDB** : Mock database manager, imports all data, its managed by `ICS`
-  **StatusHandler** : Middleware that handles status codes and message response, available examples in `./tests/**`

#### Config
- app config is located in `./config.js`


  
#### ICS files

- Each .ics file is produced according to `ics/version:2` explained in `https://en.wikipedia.org/wiki/ICalendar` with interpolation suport from `ics` npm package.
- Generated files live in `./ical_event_files` or how you set them in `./config.js`




#### Rest API

- Available end/points explained:

	* Welcome page : `http://localhost:5000/` : You can see list of available routes

	*  `http://localhost:5000/calendar/:event/:userId` : `:event` we have [sickness, vacation] event/types available based on current database/absences. `:userId` targets all absences referencing this userId. Will produce list of calendar files to location specified in `./config.js` (default: ./ical_event_files )
  
	
	*  `http://localhost:5000/download/:fileName` : After creating your ical files with `/calendar/:type/:userId` you can access that file by filename. `:fileName` makes up`{productId}_event.ics` and productId ais the `id` property on `./absences` collection. The files live in `./ical_event_files`  

	*  `http://localhost:5000/database/:collection` : `:collection` select your collection to produce results, defaults to no query parameters, will list all available items.
	
	* queries on `datebase/absences?` {userId, startDate/endDate}

	* queries on `datebase/members?` {userId, absence=1} if `absence=1` will append all absences of member. It is a rich operation so use it wisely!


	*  `other notes`, each database/:collection has available `searchByLimit[]` in ics.members and ics.absences that can be set to allow search by other fields available in database. (disabled by default). We can use config.js to add each configuration accordingly, so its easy to understand.
```

// GET/ examples

// create calendar files by type and userId
`http://localhost:5000/calendar/vacation/644`
`http://localhost:5000/calendar/sickness/644`

// download ical file
`http://localhost:5000/download/:fileName` (once you generate them with calendar api)

// list all absences
`http://localhost:5000/database/absences`

// list absences for 644
`http://localhost:5000/database/absences?userId=644`

// list all absences with-in range
`http://localhost:5000/database/absences?startDate=2016-12-31&endDate=2017-03-10`

// list all absences from startDate
`http://localhost:5000/database/absences?startDate=2016-12-31`


// list all absences to endDate
`http://localhost:5000/database/absences?endDate=2017-03-10`

// list all members
`http://localhost:5000/database/members`

// list member 644
`http://localhost:5000/database/members?userId=644`
```
 

#### Recommended VScode extentions
- `vscode-language-babe, vscode-babel-coloring, comment-anchors, joelday.docthis, vscode-standardjs`


#### TODO

- Stage on Heroku


##### Contact

* Have questions, or would like to submit feedback, `contact me at: https://eaglex.net/app/contact?product=ics-calendar-server`