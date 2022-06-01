#!/usr/bin/env node

const program = require('commander')
const package = require('../package')

program.name('pagespeed').version(`${package.name} ${package.version}`).usage('<url> [options]')

program
  .arguments('<url>')
  .description(
    `网页性能分析工具`
  )
  .option('-s, --show-browser', '显示浏览器窗口')
  .option('-c, --case', '检测营销案例')
  .action((url, options) => {
    require('../lib/pptr-tester')(url, options)
  })

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(0)
}

program.parse(process.argv)
