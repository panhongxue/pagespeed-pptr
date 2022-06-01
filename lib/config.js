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
  }
}
