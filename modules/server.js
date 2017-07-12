var server = function () {}
var logger = require('./logger.js')
var l = 'SERVR'

server.prototype.serve = function(config, app) {
  var http = require('http').Server(app)

  http.listen(config.port, function () {
    logger.log(l, 'Listening on *:' + config.port)
  })

  return http
}

module.exports = new server()
