/** 
 * Test ICS module for all error exceptions and method properties
*/

//const assert = require('assert')
const chai = require('chai')
const should = chai.should()
const expect = chai.expect
// with debug true will get better coverage because will expose notify logging
const DEBUG = require('../config').debug
// const sq = require('simple-q')
const ICS = require('../libs/ics/ics.module')()

describe('Check ICS exceptions and method/properties', function () {


    it('Check all ics.generateICS(type, uId, dbName)() properties and returns', async function () {
        const ics = new ICS({}, DEBUG)
        const list = genSettingsList()
        for (let inx = 0; inx < list.length; inx++) {
            const { userId, collection, type } = list[inx]

            if (collection === 'anonymous') {
                const d = await ics.generateICS(type, userId, collection).catch(error => {
                    should.not.Throw(error)
                })
                expect(d.length).equal(0)
                continue
            }

            if (!collection || !type) {
                const d = await ics.generateICS(type, userId, collection).catch(error => {
                    should.not.Throw(error)
                })
                expect(d.length).equal(0)
                continue
            } else {
                const dd = await ics.generateICS(type, userId, collection).catch(error => {
                    should.not.Throw(error)
                })
                expect(dd.length > 0).equal(true)
            }
        }
        return Promise.resolve(true)
    })

    it('Check all ics.absences(query, includeMember, searchByLimit)() properties and returns', async function () {
        const ics = new ICS({}, DEBUG)
        const list = absencesSettingsList()
        for (let inx = 0; inx < list.length; inx++) {
            const { query, member, searchByLimit } = list[inx] || {}

            if (query === 'invalid') {
                const d = await ics.absences(query, member, searchByLimit)
                expect(d.length).below(1)
                continue
            }

            if ((query || {}).userId === -1) {
                const d = await ics.absences(query, member, searchByLimit)
                expect(d.length).below(1)
                continue
            }
            const d = await ics.absences(query, member, searchByLimit)
            expect(d.length).above(0)
            if (member === 1) d.map(z => expect(z['member'] !== undefined).equal(true))
        }
        return Promise.resolve(true)
    })

    it('Check all ics.members(query, searchByLimit, showAbsence)() properties and returns', async function () {
        const ics = new ICS({}, DEBUG)
        const list = membersSettingsList()
        for (let inx = 0; inx < list.length; inx++) {
            const { query, searchByLimit, showAbsence } = list[inx] || {}

            if (query === 'invalid') {
                const d = await ics.members(query, searchByLimit, showAbsence)
                expect(d.length).below(1)
                continue
            }


            if ((query || {}).userId === -1) {
                const d = await ics.members(query, searchByLimit, showAbsence)
                expect(d.length).below(1)
                continue
            }

            const d = await ics.members(query, searchByLimit, showAbsence)
            expect(d.length).above(0)
            if (showAbsence === 1) d.map(z => expect(z['absences'] !== undefined).equal(true))
        }
        return Promise.resolve(true)
    })

    it('handle rejections on invalid xdb database', async function () {
        // invalid database path
        const opts = {
            members: `./members.db.xxx`,
            absences: `./absences.db.xxx`,
        }

        const ics = new ICS({ dataPath: opts }, DEBUG)

        try {
            await ics.absences({ userId: 644 }, 1, [])
        } catch (err) {
            expect(err).equal('dataPath for XDB.absences.db not found')
        }

        try {
            await await ics.members({ userId: 644 }, [], 1)
        } catch (err) {
            expect(err).equal('dataPath for XDB.members.db not found')
        }

        try {
            await ics.generateICS('sickness', 644, 'members')
        } catch (err) {
            expect(err).equal('dataPath for XDB.members.db not found')
        }

        return Promise.resolve(true)
    })

})

function membersSettingsList() {
    return [
        {},
        {
            query: 'invalid',
            searchByLimit: [],
            showAbsence: 1
        },
        {
            query: { userId: 644 },
            searchByLimit: [],
            showAbsence: 1
        },
        {
            query: { userId: 644 },
            searchByLimit: [],
            showAbsence: 0
        },
        {
            query: { userId: -1 },
            searchByLimit: ['userId'],
            showAbsence: 1
        },
        {
            query: { userId: -1 },
            searchByLimit: ['userId'],
            // showAbsence: 1
        },
        {
            //query: { userId: -1 },
            searchByLimit: ['userId', 'id'],
            // showAbsence: 1
        },
    ]
}

function genSettingsList() {
    return [
        {},
        {
            userId: 644,
            collection: 'members',
            type: 'sickness'
        },
        {
            userId: 644,
            collection: 'members',
            type: 'vacation'
        },
        {
            userId: 644,
            collection: 'anonymous',
            type: 'vacation'
        },
        {
            userId: 644,
            collection: '', // empty
            type: '' // empty
        }]
}

function absencesSettingsList() {
    return [
        {},
        {
            query: 'invalid',
        },
        {
            query: { userId: 644 },
            member: 1,
            searchByLimit: []
        },
        {
            // query: { userId: 644 },
            member: 1,
            searchByLimit: ['userId', 'startDate', 'id']
        },
        {
            // query: { userId: 644 },
            //member:1,  
            searchByLimit: ['userId', 'startDate', 'id']
        },
        {
            query: { userId: -1 },
            //member:1,  
            searchByLimit: ['userId', 'startDate', 'id']
        }
    ]
}

