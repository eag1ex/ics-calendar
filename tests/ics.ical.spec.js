/** 
 * - test creation  of sample event types, from dymmy data
*/


//const assert = require('assert')
const chai = require('chai')
const should = chai.should()
const expect = chai.expect
const StatusHandler = require('../libs/status-handler/status.handler')()
const messageCodes = require('../libs/status-handler/message.codes')
const ICSical = require('../libs/ics/ics.ical')()

const DEBUG = false  // with debug true will get better coverage because will expose notify logging
const ical = new ICSical({}, DEBUG)


describe('Check (.ics) creates valid ical events for [sickness,vacation]', function () {

    const genResults = (absenceList, toFail=null) => {
        const calEvents = ical.createICalEvents(absenceList)
        return ical.populateICalEvents(calEvents).then(z => {

            const resp = z.map(el => {

            if(!toFail) expect(el.created !== undefined).equal(true)
            else expect(el.error !== undefined).equal(true)
                // const productId = Object.keys(el['error'] || el['created'])[0]
                //  // > productId < absence/.id 
                // if (el.created) return { created: productId }
                // if (el.error) return { error: productId }

            })
            return resp
        }).catch(err => {
            should.not.Throw(err)
        })
    }

    it('userId=644 should create .ics event files for type=vacation', function () {
        // ical.availableAbsenceTypes
        const absenceList = absenceWithMemberList().filter(z => z.type === 'vacation')
        return genResults(absenceList)
    })

    it('userId=644 should create .ics event files for type=sickness', function () {
        // ical.availableAbsenceTypes
        const absenceList = absenceWithMemberList().filter(z => z.type === 'sickness')
        return genResults(absenceList)
    })

    it('userId=644 should fail to creaate .ics event files', function () {
        // ical.availableAbsenceTypes
        const absenceList = absenceWithMemberList().map(z=>{
            delete z.createdAt
            delete z.endDate
            return z
        }).filter(z => z.type === 'sickness')

        return genResults(absenceList, true)
    })

})





// NOTE same data{} format passed to CreateEventData 
function absenceWithMemberList() {
    return [
        {
            absence_days: [],
            admitterNote: 'Leider sind Wolfram und Phillip schon im Urlaub. Geh lieber mal im März',
            confirmedAt: null,
            createdAt: '2017-02-14T15:41:26.000+01:00',
            crewId: 352,
            endDate: '2017-02-25',
            id: 3235,
            memberNote: 'Skiurlaub',
            rejectedAt: '2017-02-14T15:43:06.000+01:00',
            startDate: '2017-02-20',
            type: 'sickness',
            userId: 644,
            member: { name: 'Max' }
        },
        {
            admitterId: 709,
            admitterNote: '',
            confirmedAt: '2017-03-09T15:35:17.000+01:00',
            createdAt: '2017-03-09T15:35:17.000+01:00',
            crewId: 352,
            endDate: '2017-03-15',
            id: 3605,
            memberNote: '',
            rejectedAt: null,
            startDate: '2017-03-14',
            type: 'sickness',
            userId: 644,
            member: { name: 'Max' }
        },

        {
            absence_days: [],
            admitterNote: '',
            confirmedAt: '2017-03-09T15:33:35.000+01:00',
            createdAt: '2017-03-09T15:33:35.000+01:00',
            crewId: 352,
            endDate: '2017-03-10',
            id: 3600,
            memberNote: '',
            rejectedAt: null,
            startDate: '2017-03-10',
            type: 'vacation',
            userId: 644,
            member: { name: 'Max' }
        },

        {
            absence_days: [],
            admitterNote: '',
            confirmedAt: '2017-03-09T15:33:57.000+01:00',
            createdAt: '2017-03-09T15:33:57.000+01:00',
            crewId: 352,
            endDate: '2017-03-10',
            id: 3601,
            memberNote: '',
            rejectedAt: null,
            startDate: '2017-03-10',
            type: 'vacation',
            userId: 644,
            member: { name: 'Max' }
        },
        {
            admitterId: 709,
            admitterNote: '',
            confirmedAt: '2017-03-09T15:34:57.000+01:00',
            createdAt: '2017-03-09T15:34:57.000+01:00',
            crewId: 352,
            endDate: '2017-03-13',
            id: 3604,
            memberNote: '',
            rejectedAt: null,
            startDate: '2017-03-13',
            type: 'vacation',
            userId: 644,
            member: { name: 'Max' }
        },
        {
            absence_days: [],
            admitterNote: '',
            confirmedAt: '2017-03-09T15:35:58.000+01:00',
            createdAt: '2017-03-09T15:35:58.000+01:00',
            crewId: 352,
            endDate: '2017-03-18',
            id: 3606,
            memberNote: '',
            rejectedAt: null,
            startDate: '2017-03-16',
            type: 'vacation',
            userId: 644,
            member: { name: 'Max' }
        },
        {
            absence_days: [],
            admitterNote: '',
            confirmedAt: '2017-03-15T16:36:34.000+01:00',
            createdAt: '2017-03-15T16:36:34.000+01:00',
            crewId: 352,
            endDate: '2017-01-02',
            id: 3752,
            memberNote: '',
            rejectedAt: null,
            startDate: '2016-12-31',
            type: 'vacation',
            userId: 644,
            member: { name: 'Max' }
        }
    ]
}
