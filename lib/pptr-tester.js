const fs = require('fs')
const puppeteer = require('puppeteer')
const ora = require('ora')
const chalk = require('chalk')
const jpegquality = require('jpegquality')
const prettyMilliseconds = require('pretty-ms-i18n')
const printReport = require('./print-report')
const config = require('./config')
const { sleep } = require('./util/utils')

const spinner = ora()

const _requests = []
function tracingNetwork(page) {
  page.on('request', (request) => {
    _requests.push({
      id: request._requestId,
      url: request.url()
    })
  })
  page.on('response', (response) => {
    response
      .buffer()
      .then((buffer) => {
        const resp = {
          resourceSize: buffer.length,
          cache: response.fromCache(),
          timing: response.timing()
        }
        try {
          resp.jpeg_quality = Math.round(jpegquality(buffer))
        } catch (e) {}

        const req = _requests.find(
          (item) =>
            item.id === response.request()._requestId &&
            item.url === response.url() &&
            item.resourceSize === undefined
        )
        Object.assign(req, resp)
      })
      .catch((ex) => {
        // console.log('⚠️', ex.message)
        const req = _requests.find(
          (item) =>
            item.id === response.request()._requestId &&
            item.url === response.url() &&
            item.resourceSize === undefined
        )
        const resp = {
          resourceSize: 0,
          cache: response.fromCache(),
          timing: response.timing()
        }
        Object.assign(req, resp)
      })
  })
}

async function doTracing(url, options) {
  const startTime = Date.now()

  spinner.start('启动浏览器')
  const browser = await puppeteer.launch({
    headless: !options.showBrowser // 是否隐藏浏览器窗口（无头浏览器）
  })

  spinner.start('新建标签页')
  const pages = await browser.pages()
  const page = pages[0]

  tracingNetwork(page)

  // add external
  page.on('domcontentloaded', () => {
    page.evaluate(
      Buffer.from(
        'ZXh0ZXJuYWwuR2V0U0lEID0gKCkgPT4ge30KICAgICAgZXh0ZXJuYWwuQXBwQ21kID0gKCkgPT4ge30KICAgICAgZXh0ZXJuYWwuR2V0VmVyc2lvbiA9ICgpID0+IHt9',
        'base64'
      ).toString()
    )
  })

  spinner.start('打开URL')
  await page.tracing.start({ path: config.tracePath })
  await page
    .goto(url, {
      waitUntil: 'networkidle2'
    })
    .catch((ex) => {
      spinner.stop()
      console.log('🧭' + chalk.red(ex.message))
    })

  await sleep(1000)
  spinner.start('生成性能分析报告')
  await page.tracing.stop()

  // spinner.start('关闭浏览器')
  await browser.close()

  fs.writeFileSync(config.requestsPath, JSON.stringify(_requests, null, 2))

  spinner.succeed(
    `测试完成，用时 ${chalk.hex(config.COLORS.green)(
      prettyMilliseconds(Date.now() - startTime, { locale: 'zh_CN' })
    )}`
  )
}

async function pagespeedTest(url, options) {
  await doTracing(url, options)
  printReport(options)
}

module.exports = pagespeedTest
