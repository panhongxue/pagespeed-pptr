const fs = require('fs')
const prettyMilliseconds = require('pretty-ms-i18n')
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
      const responses = this.requests.filter((item) => item.resourceSize)

      this._resourceSize =
        responses.length > 1
          ? responses.reduce(
              (prev, cur) => (!isNaN(prev) ? prev : prev.resourceSize) + cur.resourceSize
            )
          : responses.length > 0
          ? responses[0].resourceSize
          : 0
    }
    return this._resourceSize
  }

  get requestTime() {
    const timings = this.requests.filter((item) => item.timing)

    if (timings.length === 0) return 0

    const lastTiming = timings[timings.length - 1].timing
    return prettyMilliseconds(
      (lastTiming.requestTime +
        lastTiming.receiveHeadersEnd / 1000 -
        timings[0].timing.requestTime) *
        1000,
      { locale: 'zh_CN' }
    )
  }

  get summary() {
    return `${this.requests.length} 个请求    ${prettyBytes(
      this.resourceSize
    )} 项资源    完成用时：${this.requestTime}`
  }
}

module.exports = RequestsParser
