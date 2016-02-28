var logger = function () {}
var colour = require('colour')
var config = require('../config.js')
var levels = ['error', 'warn', 'info', 'debug', 'trace']
if (levels.indexOf(config.loggingLevel) > -1) {
  var level = levels.indexOf(config.loggingLevel)
} else {
  if (!isNaN(config.loggingLevel)) {
    var level = parseInt(config.loggingLevel)
  } else {
    console.log(('Invalid Config Logger Level: ' + config.loggingLevel).yellow)
    var level = 1
  }
}

logger.prototype.date = function () {
  var date = new Date()
  return ('[' + String('00' + date.getHours()).slice(-2) + ':' + String('00' + date.getMinutes()).slice(-2) + ':' + String('00' + date.getSeconds()).slice(-2) + ']').cyan
}

logger.prototype.s = function (msg) {
  // return String(JSON.stringify(msg))
  return String(msg)
}

logger.prototype.success = function (name, msg) {
  name = ' [' + name + '] '
  while (name.length < 9) {
    name += ' '
  }
  console.log(this.date() + name + this.s(msg).green)
}

logger.prototype.log = function (name, msg) {
  name = ' [' + name + '] '
  while (name.length < 9) {
    name += ' '
  }
  console.log(this.date() + name + this.s(msg).grey)
}

logger.prototype.debug = function (name, msg) {
  name = ' [' + name + '] '
  while (name.length < 9) {
    name += ' '
  }
  console.log(this.date() + name + this.s(msg).grey)
}

logger.prototype.warning = function (name, msg) {
  name = ' [' + name + '] '
  while (name.length < 9) {
    name += ' '
  }
  console.log(this.date() + name + this.s(msg).yellow)
}

logger.prototype.error = function (name, msg) {
  name = ' [' + name + '] '
  while (name.length < 9) {
    name += ' '
  }
  console.log(this.date() + name + this.s(msg).red)
}

module.exports = new logger()
