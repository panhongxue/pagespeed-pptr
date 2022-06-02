const fs = require('fs')
const prettyMilliseconds = require('pretty-ms-i18n')
const config = require('../config')

class TraceParser {
  constructor(file) {
    this.traceEvents = this.readJSON(file)['traceEvents']
    this.baseEvent = this.getEvents('TracingStartedInBrowser')[0]
    this.mainFrameId = this.getMainFrame()

    this.DCLEvent = this.getEvents('MarkDOMContent', this.mainFrameId)[0]
    this.LoadEvent = this.getEvents('MarkLoad', this.mainFrameId)[0]
    this.FPEvent = this.getEvents('firstPaint', this.mainFrameId)[0]
    this.FCPEvent = this.getEvents('firstContentfulPaint', this.mainFrameId)[0]
    this.LCPEvent = this.getLCPEvent()
  }

  readJSON(file) {
    const text = fs.readFileSync(file, 'utf-8')
    const json = JSON.parse(text)
    return json
  }

  getEvents(name, frameId, navigationId) {
    if (!this.traceEvents) {
      return []
    }

    const arr = this.traceEvents.filter((item) => {
      let cond = item.name === name
      if (item.args.data?.isMainFrame !== undefined) {
        cond = cond && item.args.data.isMainFrame
      }
      if (frameId) {
        cond = cond && (item.args.frame === frameId || item.args.data?.frame === frameId)
      }
      if (navigationId) {
        cond = cond && item.args.data?.navigationId === navigationId
      }
      return cond
    })

    return arr
  }

  getMainFrame() {
    const data = this.baseEvent?.args['data']
    return data?.frames[0].frame
  }

  getLCPEvent() {
    let LCPEvent
    const lcpEvents = this.getEvents('largestContentfulPaint::Candidate', this.mainFrameId)
    if (lcpEvents.length > 0) {
      const lcpEventsByNavigationId = new Map()
      for (const e of lcpEvents) {
        const key = e.args['data']['navigationId']
        const previousLastEvent = lcpEventsByNavigationId.get(key)

        if (
          !previousLastEvent ||
          previousLastEvent.args['data']['candidateIndex'] < e.args['data']['candidateIndex']
        ) {
          lcpEventsByNavigationId.set(key, e)
        }
      }

      LCPEvent = Array.from(lcpEventsByNavigationId.values())[0]
    }

    return LCPEvent
  }

  duration(event) {
    if (!event) {
      return -1
    }

    let eventTime = event.ts - this.baseEvent.ts
    const { navigationId } = event.args.data
    if (navigationId) {
      const navStart = this.getEvents('navigationStart', this.mainFrameId, navigationId)[0]
      if (navStart) {
        eventTime = event.ts - navStart.ts
      }
    }
    return eventTime
  }

  prettyMMS(mms) {
    return mms < 0
      ? mms
      : prettyMilliseconds(mms / 1000, { locale: 'zh_CN', millisecondsDecimalDigits: 1 })
  }

  getEventTime(eventName) {
    const mms = this.duration(this[`${eventName}Event`])
    return {
      time: this.prettyMMS(mms),
      mms
    }
  }

  get DCL() {
    return this.getEventTime('DCL')
  }
  get Load() {
    return this.getEventTime('Load')
  }
  get FP() {
    return this.getEventTime('FP')
  }
  get FCP() {
    return this.getEventTime('FCP')
  }
  get LCP() {
    return this.getEventTime('LCP')
  }

  get timeLine() {
    const timeline = [
      {
        name: 'DCL',
        title: 'DCL (DOMContentLoaded)',
        time: this.DCL.time,
        mms: this.DCL.mms,
        color: '#0867CB'
      },
      {
        name: 'L',
        title: 'L   (Onload)',
        time: this.Load.time,
        mms: this.Load.mms,
        color: '#B31412'
      },
      {
        name: 'FP',
        title: 'FP  (首次绘制)',
        time: this.FP.time,
        mms: this.FP.mms,
        color: '#228847'
      },
      {
        name: 'FCP',
        title: 'FCP (首次内容绘制)',
        time: this.FCP.time,
        mms: this.FCP.mms,
        color: '#1A6937'
      },
      {
        name: 'LCP',
        title: 'LCP (最大内容绘制)',
        time: this.LCP.time,
        mms: this.LCP.mms,
        color: '#1A3422'
      }
    ]

    timeline.map((item) => (item.score = config.TIMELINE[item.name]))

    timeline.sort((x, y) => {
      return x.mms - y.mms
    })

    return timeline
  }
}

module.exports = TraceParser
