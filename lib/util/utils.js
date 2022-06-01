module.exports.sleep = async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports.keypress = async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise((resolve) =>
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
    })
  )
}
