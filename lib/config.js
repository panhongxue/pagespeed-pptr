const S = 1000 * 1000

module.exports = {
  tracePath: 'pagespeed-trace.json',
  requestsPath: 'pagespeed-requests.json',

  COLORS: {
    green: '#0CCE6A',
    warn: '#FFA100',
    error: '#FF4E43'
  },

  LIMITS: {
    quality: 85,
    jpegSize: 200 * 1000,
    imgSize: 500 * 1000,
    resSize: 1000 * 1000
  },

  TIMELINE: {
    DCL: [2.0 * S, 4.0 * S],
    L: [5.0 * S, 10 * S],
    FP: [1.0 * S, 1.5 * S],
    FCP: [1.0 * S, 2.0 * S],
    LCP: [2.0 * S, 4.0 * S]
  }
}
