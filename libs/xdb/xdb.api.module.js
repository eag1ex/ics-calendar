`use strict`;
/**
 * @XDB database mock
 * -  NOTE independent tests available thru `./tests/ics.module.spec.js`
 * - available databases: [members,absences]
 * -
 */
module.exports = () => {
  const { log } = require("x-utils-es/umd");
  const { dataAsync } = require("../utils")();
  return class XDB {
    //
    constructor(opts = {}, debug) {
      this.debug = debug;
      this.dataPath = {
        members: opts.members || `./members.db.json`,
        absences: opts.absences || `./absences.db.json`,
      };

      if (this.debug) log({ XDB: { dataPath: this.dataPath } });
    }

    membersDB() {
      try {
        return dataAsync(require(this.dataPath.members)).then(
          (data) => data.payload
        );
      } catch (err) {
        return Promise.reject("dataPath for XDB.members.db not found");
      }
    }

    absencesDB() {
      try {
        return dataAsync(require(this.dataPath.absences)).then(
          (data) => data.payload
        );
      } catch (err) {
        return Promise.reject("dataPath for XDB.absences.db not found");
      }
    }
  };
};
