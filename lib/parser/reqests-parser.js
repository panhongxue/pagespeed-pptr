const fs = require('fs')
const prettyBytes = require('../util/pretty-bytes')

class RequestsParser {
  constructor(file) {
    this.requests = this.readJSON(file)
    // console.log(this.requests)
  }

  readJSON(file) {
    const text = fs.readFileSync(file, 'utf-8')
    const json = JSON.parse(text)
    return json
  }

  get resourceSize() {
    if (!this._resourceSize) {
      this._resourceSize =
        this.requests.length > 1
          ? this.requests.reduce(
              (prev, cur) => (!isNaN(prev) ? prev : prev.resourceSize) + cur.resourceSize
            )
          : this.requests.length > 0
          ? this.requests[0].resourceSize
          : 0
    }
    return this._resourceSize
  }

  get summary() {
    return `${this.requests.length} 个请求\t${prettyBytes(this.resourceSize)} 项资源`
  }
}

module.exports = RequestsParser
