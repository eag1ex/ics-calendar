### ics-calendar-server

#### [ Developed by Eaglex ](http://eaglex.net)

##### LICENSE

- LICENSE: CC BY-NC-ND
- SOURCE: _(https://creativecommons.org/licenses/by-nc-nd/4.0/)_

#### About

**ics-calendar-server** is a Node.js application that supports creation of `ics/iCal` Calendar events and invites, for `MS-Outlook, or Mail for Mac.` It works by Rest request for specific types `[sickness, vacation]` followed by `userId`, example (http://localhost:5000/calendar/vacation/644) `http://localhost:5000/calendar/:type/:userId`

- Application provides mocked database: `xdb` with access to collections: `members.db` and `absences.db` from `.json`
- Structured with 3 micro services: `server => ics <= xdb`, and middleware :`StatusHandler`
- Build in ES6 with good functional programming.
- Linted code, well scaled with comments, and debug features
- Includes TDD. Tests with Mocha/Chai
- Includes error/response codes
- Implemented Istanbul/nyc coverage
- Demo deployed on Heroku

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

- Then navigate to welcome page : (http://localhost:5000/)

#### Tests & Coverage

All tests located in `./tests/{*,/*}.spec.js`

- To run full spec coverage: `npm run test`
- To only run mocha spec without nyc/instanbul: `npm run mocha`
- available at: `./coverage/index.html`

#### Stack

Application uses own-build external/utilities `x-utils, simple-q`, can be found at (hhttps://github.com/eag1ex), as well as vendor npm packages.

- Full list `Express.js, ics/ical/v2, lodash, moment.js, uuid, Node.js, Javascript, ES6, Error handling, micro-services: (xdb, ics, server), x-utils, simple-q, Lint, Chai, Mocha, Istanbul/nyc, TDD`

#### Micro Services

List of services that run under the hood:

- **Server** : Independent Express.js server that imports all assets, barebone authentication is implemented but not enforced.
- **ICS** : Module that controls logic and operation of the app, imports `xdb` and implements the middleware: `StateHandler` for status response management.
- **XDB** : Mock database manager, imports all data managed by `ICS`
- **StatusHandler** : Middleware handles status codes and message response, available examples in `./tests/**`
- _App Service hierarchy: `server => ( ics :StatusHandler) <= xdb`_

#### Config

App config: `./config.js`

```
{
    debug: false, // debug for all application code
    ics: { filePath:'./ical_event_files' },
    deleteOlderThen: '1m', // delete `ical_event_files` older then 1 minute
    port: 5000
}
```

#### ICS files

- Each .ics file is produced according to `ics/version:2` explained in `https://en.wikipedia.org/wiki/ICalendar` with interpolation support from `ics` npm package.
- Generated files live in `./ical_event_files`, you can change it: `./config.js`
- Generated test file for download, available at: (http://localhost:5000/download/test_2351_event.ics)
- **A reminder**, there is an expiry time enabled to delete all generated files after `config.deleteOlderThen`, you can change, or disable it at: `server>auth>deleteICSfilesIfOlderThen(false)`

#### Heroku demo

- you can view ICS Calendar App in action at: _(https://boxing-parliament-26094.herokuapp.com)_ following same rest api end points

#### Rest API

End/points explained:

- Just replace `localhost:5000` with `boxing-parliament-26094.herokuapp.com` to do live tests on Heroku

- Welcome page : `http://localhost:5000/` : You can see list of available routes

- `http://localhost:5000/calendar/:event/:userId` : `:event` [sickness, vacation] available based on current database/absences. `:userId` targets absences by reference, produce list of calendar static files to location specified in `./config.js`
- `http://localhost:5000/download/:fileName` : After creating ical files `/calendar/:type/:userId` you can access them with: `:fileName` ({productId}\_event.ics), refers to `id` prop on `./absences` collection.

- `http://localhost:5000/database/:collection` : `:collection` selects your collection, defaults to no query parameters, and lists all available items.
- queries on `database/absences?` {userId, startDate/endDate}

- queries on `database/members?` {userId, absence=1} if `absence=1` will append available absences. It is a rich operation, it wisely!

- `other notes`, each database/:collection has available `searchByLimit[]` in ics.members and ics.absences that can be set to allow search by other fields available in database. (disabled by default).

```sh

# GET/ examples

# create calendar files by type and userId
curl http://localhost:5000/calendar/vacation/644
curl http://localhost:5000/calendar/sickness/644

#download ical file
curl http://localhost:5000/download/:fileName //(once you generate them with calendar api)

# ical download test file
curl http://localhost:5000/download/test_2351_event.ics


# list all absences
curl http://localhost:5000/database/absences

# list absences for 644
curl http://localhost:5000/database/absences?userId=644

# list all absences with-in range
curl http://localhost:5000/database/absences?startDate=2016-12-31&endDate=2017-03-10

# list all absences from startDate
curl http://localhost:5000/database/absences?startDate=2016-12-31


# list all absences to endDate
curl http://localhost:5000/database/absences?endDate=2017-03-10

# list all members
curl http://localhost:5000/database/members

# list member 644
curl http://localhost:5000/database/members?userId=644

```

#### Developer comments

- Issues with node.js version? Try `nvm install 11.0.0`

#### Recommended VScode extensions

- `vscode-language-babe, vscode-babel-coloring, comment-anchors, joelday.docthis, vscode-standardjs`

#### Premium version

- _(includes)_ Client UX/UI to generate .ics events
- _(includes)_ Node Mailer to send invites
- _(includes)_ More support and documentation.

##### Contact

Have questions, or would like to submit feedback, **contact me at:** (https://eaglex.net/app/contact?product=ics-calendar-server)
