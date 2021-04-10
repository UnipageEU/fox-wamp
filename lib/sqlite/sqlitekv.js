'use strict'

const { KeyValueStorageAbstract } = require('../realm')

class SqliteKv extends KeyValueStorageAbstract {
  constructor (db) {
    super()
    this.db = db
  }
    
  async createTables () {
    await this.db.run(
      'CREATE TABLE IF NOT EXISTS kv (' +
        'key TEXT not null,' +
        // 'kv_realm TEXT not null,' +
        'value TEXT not null,' +
        'will_sid TEXT not null,' +
        'opt TEXT not null,' +
        'PRIMARY KEY (key));'
    )
    await this.db.run(
      'CREATE INDEX IF NOT EXISTS kv_sid on kv (will_sid);'
    )
    await this.db.run(
      'CREATE TABLE IF NOT EXISTS set_value (' +
        'key TEXT not null,' +
        'msg_id TEXT not null,' +
        'will_sid TEXT not null,' +
        'set_when TEXT not null,' +
        'PRIMARY KEY (key, msg_id));'
    )
    await this.db.run(
      'CREATE INDEX IF NOT EXISTS set_value_sid on set_value (will_sid);'
    )
  }

  async removeSession (sessionId) {
    const toRemove = []
    await this.db.each(
      'SELECT key, opt FROM kv WHERE will_sid = ?',
      [sessionId],
      (err, row) => {
        toRemove.push([row.key, row.opt])
      }
    )
    // for (let i = 0; i < toRemove.length; i++) {
    // }
    await this.db.run(
      'DELETE FROM kv WHERE will_sid = ?',
      [sessionId]
    )
  }

  setKeyActor (actor) {
    const suri = this.getStrUri(actor)

    const opt = actor.getOpt()
    const willSid = ('will' in opt) ? actor.getSid() : 0
    this.db.run(
      'insert into kv (key, value, will_sid, opt) values (?, ?, ?, ?)',
      [suri, JSON.stringify(actor.getData()), willSid, JSON.stringify(opt)]
    ).then(() => {

    }, (reason) => {
      console.log(reason)
    })
  }

  getKey (uri, cbRow) {
    return this.db.each(
      'SELECT key, value, opt FROM kv WHERE key = ?',
      [uri],
      (err, row) => {
        cbRow(row.key, JSON.parse(row.value))
      }
    )

  }
}

exports.SqliteKv = SqliteKv