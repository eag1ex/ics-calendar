/* eslint-disable indent */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */



// ICS CALENDAR REST END POINTS:
// @Create Calendar events for user 
`http://localhost:5000/calendar/:event/:userId`
`http://localhost:5000/calendar/vacation/644` // create vacation
`http://localhost:5000/calendar/sickness/644` // create sickness
`http://localhost:5000/download/{productId}_event.ics` // download file

// @GET requests 
`http://localhost:5000/database/members?userId=644&absence=1`
`http://localhost:5000/database/absences?userId=644`
`http://localhost:5000/database/absences?startDate=2016-12-31&endDate=2017-03-10`


