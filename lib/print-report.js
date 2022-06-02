const path = require('path')
const chalk = require('chalk')
const cliui = require('cliui')
const TraceParser = require('./parser/trace-parser')
const RequestsParser = require('./parser/reqests-parser')
const config = require('./config')
const prettyBytes = require('./util/pretty-bytes')

const { COLORS, LIMITS } = config
const issues = []

function makeRow(a, b) {
  return `${a}\t    ${b}\t`
}

function getScoreColor(item) {
  let colorIdx = 0
  if (item.mms < 0) colorIdx = 2
  item.score.reverse().some((limit, idx) => {
    if (item.mms > limit) {
      colorIdx = 2 - idx
      return true
    }
  })
  return Object.values(COLORS)[colorIdx]
}

function printTimeline() {
  const traceParser = new TraceParser(config.tracePath)
  // console.log(traceParser.timeLine)

  const ui = cliui({ width: 100 })
  ui.div(
    makeRow(chalk.cyan.bold('时间线'), chalk.cyan.bold('耗时')) +
      '\n' +
      traceParser.timeLine
        .map((item) => {
          if (item.mms > item.score[0]) {
            issues.push({
              issue: `${item.title} 时间过长`,
              suggest: `优化至 ${chalk.hex(COLORS.green)(
                traceParser.prettyMMS(item.score[0])
              )} 以内`,
              color: getScoreColor(item)
            })
          }
          return makeRow(
            chalk.bgHex(item.color)(item.title),
            chalk.hex(getScoreColor(item))(item.time)
          )
        })
        .join('\n')
  )
  console.log(ui.toString())
}

function printRequests(options) {
  const reqParser = new RequestsParser(config.requestsPath)

  console.log(chalk.cyan.bold('网络请求'))
  console.log(reqParser.summary)

  if (options.case) {
    if (reqParser.resourceSize > 1 * 1024 * 1024) {
      issues.push({
        issue: `[case]网络资源超过 1 MB`,
        suggest: `优化至 ${chalk.hex(COLORS.green)('1 MB')} 以内`,
        color: COLORS.error
      })
    }

    const publicImgHost = reqParser.requests.find((item) => {
      const url = new URL(item.url)
      return new RegExp(Buffer.from('cFxkKyhcLnNzbCk/XC5xaGltZ1wuY29t', 'base64')).test(url.host)
    })
    if (publicImgHost) {
      issues.push({
        issue: `[case]${publicImgHost.url}`,
        suggest: `图片使用${chalk.hex(COLORS.green)(
          Buffer.from('YnJvd3NlcjUucWhpbWcuY29t', 'base64')
        )}域名`,
        color: COLORS.error
      })
    }

    const gifAnalytics = reqParser.requests.find((item) => {
      const url = new URL(item.url)
      return url.host === Buffer.from('ZGQuYnJvd3Nlci4zNjAuY24=', 'base64').toString()
    })
    if (!gifAnalytics) {
      issues.push({
        issue: `[case]缺少gif打点`,
        suggest: `增加PV gif打点`,
        color: COLORS.error
      })
    }
  }

  // resourceSize
  reqParser.requests.forEach((item) => {
    switch (path.extname(new URL(item.url).pathname)) {
      case '.jpg':
      case '.jpeg':
        if (item.resourceSize > LIMITS.jpegSize) {
          issues.push({
            issue: item.url,
            suggest: `jpeg图片大小超过${chalk.hex(COLORS.green)(
              prettyBytes(LIMITS.jpegSize)
            )}：${chalk.hex(COLORS.warn)(prettyBytes(item.resourceSize))},quality:${chalk.hex(
              item.jpeg_quality > LIMITS.quality ? COLORS.warn : COLORS.green
            )(item.jpeg_quality)}`,
            color: COLORS.warn
          })
        }
        break
      case '.png':
      case '.webp':
      case '.gif':
        if (item.resourceSize > LIMITS.imgSize) {
          issues.push({
            issue: item.url,
            suggest: `图片超过${chalk.hex(COLORS.green)(prettyBytes(LIMITS.imgSize))}：${chalk.hex(
              COLORS.warn
            )(prettyBytes(item.resourceSize))}`,
            color: COLORS.warn
          })
        }
        break
      default:
        if (item.resourceSize > LIMITS.resSize) {
          issues.push({
            issue: item.url,
            suggest: `大文件超过${chalk.hex(COLORS.green)(
              prettyBytes(LIMITS.resSize)
            )}：${chalk.hex(COLORS.warn)(prettyBytes(item.resourceSize))}`,
            color: COLORS.warn
          })
        }
        break
    }
  })
  // quality
  reqParser.requests.forEach((item) => {
    if (item.jpeg_quality > LIMITS.quality) {
      if (!issues.some((iss) => iss.issue === item.url)) {
        issues.push({
          issue: item.url,
          suggest: `jpeg quality超过${chalk.hex(COLORS.green)(LIMITS.quality)}：${chalk.hex(
            COLORS.warn
          )(item.jpeg_quality)},size:${chalk.hex(COLORS.green)(prettyBytes(item.resourceSize))}`,
          color: COLORS.warn
        })
      }
    }
  })
}

function printPerfIssue() {
  const ui = cliui({ width: 200 })
  ui.div(
    makeRow(chalk.cyan.bold('问题'), chalk.cyan.bold('优化建议')) +
      '\n' +
      issues.map((item) => makeRow(chalk.hex(item.color)(item.issue), item.suggest)).join('\n')
  )
  console.log(ui.toString())
}

function printReport(options) {
  printTimeline()
  console.log()
  printRequests(options)
  console.log()
  printPerfIssue()
}

module.exports = printReport
