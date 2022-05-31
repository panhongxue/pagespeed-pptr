const fs = require('fs')
const puppeteer = require('puppeteer')
const ora = require('ora')
const chalk = require('chalk')
const jpegquality = require('jpegquality')
const printReport = require('./test-report')
const config = require('./config')

const spinner = ora()

const _requests = []
function tracingNetwork(page) {
  page.on('response', (response) => {
    response
      .buffer()
      .then((buffer) => {
        const req = {
          url: response.url(),
          resourceSize: buffer.length,
          timing: response.timing()
        }
        try {
          req.jpeg_quality = Math.round(jpegquality(buffer))
        } catch (e) {}
        _requests.push(req)
      })
      .catch((ex) => {
        // console.log('⚠️', ex.message)
      })
  })
}

async function doTracing(url, options) {
  spinner.start('启动浏览器')
  const browser = await puppeteer.launch({
    headless: !options.showBrowser // 是否隐藏浏览器窗口（无头浏览器）
  })

  spinner.start('新建标签页')
  const pages = await browser.pages()
  const page = pages[0]

  tracingNetwork(page)

  spinner.start('打开URL')
  await page.tracing.start({ path: config.tracePath })
  await page.goto(url).catch((ex) => {
    spinner.stop()
    console.log('🧭', chalk.red(ex.message))
  })

  spinner.start('生成性能分析报告')
  await page.tracing.stop()

  // spinner.start('关闭浏览器')
  await browser.close()

  fs.writeFileSync(config.requestsPath, JSON.stringify(_requests, null, 2))

  spinner.succeed('测试完成')
}

async function pagespeedTest(url, options) {
  await doTracing(url, options)
  printReport()
}

module.exports = pagespeedTest
