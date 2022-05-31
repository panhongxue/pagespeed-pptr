const chalk = require('chalk')
const cliui = require('cliui')
const TraceParser = require('./parser/trace-parser')
const config = require('./config')

function makeRow(a, b) {
  return `${a}\t    ${b}\t`
}

function printTimeline() {
  const traceParser = new TraceParser(config.tracePath)

  const ui = cliui({ width: 80 })
  ui.div(
    makeRow(chalk.cyan.bold('时间线'), chalk.cyan.bold('耗时')) +
      '\n' +
      traceParser.timeLine
        .map((item) => makeRow(chalk.bgHex(item.color)(item.name), item.time))
        .join('\n')
  )
  console.log(ui.toString())
}
function printReport() {
  printTimeline()

  // console.log(ui.div(`
  // 时间线
  // `).toString())
  // console.table({a:{a:1},b:2}, ['a','b'])
}

module.exports = printReport
