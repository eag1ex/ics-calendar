`use strict`;
/**
 * @ICS
 * -  NOTE independent tests in `./tests/ics.module.spec.js`
 * - calendar file handler class, used to generate `.ics, .ical` files for MS and Apple
 * - import `ics.api` database records: `{absences,members}` both correlate with `crewId, userId` props.
 * - `new ICS({},debug)`
 * - ical ref: `https://en.wikipedia.org/wiki/ICalendar`
 * - ics ref: `https://www.npmjs.com/package/ics`
 */
module.exports = () => {
  //   const XDB = require("../xdb/xdb.api.module")();
  const {
    log,
    objectSize,
    isFalsy,
    head,
    isString,
  } = require("x-utils-es/umd");
  const StatusHandler = require("../status-handler/status.handler")();
  class ICSmodule {
    constructor(opts = {}, debug) {
      this.debug = debug || null;
      this.d = null; // temporary data hold
      this.statusHandler = new StatusHandler({}, this.debug); // middleware, handles messages and code for REST

      if (!opts.XDB) throw `XDB must be initialized`;
      else this.XDB = opts.XDB; // instance
    }

    /**
     * - generate new ics file by cross reference of 2 databases. Find member by `userId` and match them with  by `type`
     * @param {string} type references record prop on `absences` database
     * @param {number} uId required, get user by id
     * @param {string} collection defaults to `members`
     * @borrows `members, absences`
     */
    async generateICS(type = "vacation", uId = null, collection = "members") {
      if (!collection) {
        if (this.debug) log("[generateICS] no collection selected");
        return [];
      }

      if (Number(uId) < 0) {
        if (this.debug) log("[generateICS] wrong userId");
        return [];
      }

      if (this.availableAbsenceTypes.indexOf(type || "") === -1) {
        if (this.debug) log("[generateICS] wrong type selected");
        return [];
      }

      let userOutput = [];
      switch (collection) {
        case "members": {
          try {
            const memberData = await this.members({ userId: uId });
            if (!memberData.length) throw `no member with userId:${uId} found`;
            if (memberData.length > 1) {
              if (this.debug)
                log(
                  `[generateICS] found more then one userId:${uId} on members database, selecting first`
                );
            }

            const user = head(memberData);
            if (!user) {
              break;
            }

            const { userId } = user; // {crewId,name,id,userId}
            const userAbsencesList = await this.absences(
              { userId, type },
              true,
              ["userId", type]
            );

            // 1. create event list for ics files
            const calEvents = this.createICalEventList(userAbsencesList);
            // 2. populate ics files
            userOutput = await this.populateICalEvents(calEvents).then((z) => {
              if (!(z || []).length) throw `no file batch available`;
              return z.map((el) => {
                const productId = Object.keys(el["error"] || el["created"])[0]; // > productId < absence/.id
                if (el.created) return { created: productId };
                if (el.error) return { error: productId };
              });
            });
          } catch (error) {
            if (this.debug) log({ error });
            this.statusHandler.$set({ code: 602 });
          }

          break;
        }

        default:
          if (this.debug)
            log(
              `[generateICS] wrong collection: ${collection} selected no ics generated`
            );
      }

      if (!(userOutput || []).length) {
        this.statusHandler.$set({ code: 107 });
        return userOutput;
      } else {
        // based on results set the right status
        let created = 0;
        const d = userOutput.map((z) => {
          if (z.created) created++;
          return z;
        });
        this.statusHandler.$setWith(created > 0, { code: 204 }, { code: 106 });
        return d;
      }
    }

    /**
     *
     * @param {boolean} includeMember when true, property: `member:{}` will be added
     * @param {array} searchByLimit when selected will override `queryFilter`
     * @borrows `queryFilter,assignMember`
     * @returns [{},..] list of items
     */
    async absences(query = null, includeMember = null, searchByLimit = []) {
      this.d = null;
      let data = [];

      if (isString(query)) return [];

      try {
        data = await this.XDB.absencesDB();
      } catch (err) {
        if (this.debug) log("[absences] database empty");
        // in case we forgot to load the actual class the error would be defferent
        if (err.toString().indexOf("XDB.absences.db") == -1)
          err = "XDB.absences.db not found";
        return Promise.reject(err);
      }

      // when query is set and `includeMember` enabled (by default) on controller.absences(...)
      // it will again perform another query against `members({userId})` to be added on each item
      if (objectSize(query)) {
        try {
          let filter = ["userId", "startDate", "endDate"]; // queryFilter
          if ((searchByLimit || []).length) filter = searchByLimit;
          //
          const arrAsync = this.queryFilter(
            data,
            query,
            filter,
            "absences"
          ).assignMember(includeMember).d;

          return Promise.all(arrAsync).then((z) => {
            this.statusHandler.$setWith(z.length, { code: 200 }, { code: 100 });
            return z;
          });
        } catch (error) {
          if (this.debug) log({ error });
          console.log("absences z 2", error);
          this.statusHandler.$set({ code: 101 });
          return [];
        }
      } else {
        this.d = data;
        //
        return Promise.all(this.assignMember(includeMember).d).then((z) => {
          this.statusHandler.$setWith(z.length, { code: 201 }, { code: 102 });
          return z;
        });
      }
    }

    /**
     * @param {object} query optional
     * @param {array} searchByLimit when selected will override `queryFilter`
     * @borrows `queryFilter`
     * @returns [{},..] list of items
     */
    async members(query = null, searchByLimit = [], showAbsence = null) {
      this.d = null;
      let data = [];
      if (isString(query)) return [];
      try {
        data = await this.XDB.membersDB();
      } catch (err) {
        if (this.debug) log("[members] database empty");
        // in case we forgot to load the actual class the error would be defferent
        if (err.toString().indexOf("XDB.members.db") == -1)
          err = "XDB.members.db not found";
        return Promise.reject(err);
      }
      if (objectSize(query)) {
        try {
          let filter = ["userId"]; // queryFilter
          if ((searchByLimit || []).length) filter = searchByLimit;
          //
          const arrAsync = this.queryFilter(
            data,
            query,
            filter,
            "members"
          ).assignAbsences(showAbsence).d;

          return Promise.all(arrAsync).then((z) => {
            this.statusHandler.$setWith(z.length, { code: 202 }, { code: 103 });
            return z;
          });
        } catch (error) {
          log({ error });
          this.statusHandler.$set({ code: 104 });
          return [];
        }
      } else {
        this.d = data;
        return Promise.all(this.assignAbsences(showAbsence).d).then((z) => {
          this.statusHandler.$setWith(z.length, { code: 203 }, { code: 105 });
          return z;
        });
      }
    }
  }

  const ICSExt = require("./ics.libs")(ICSmodule);
  return ICSExt;
};
