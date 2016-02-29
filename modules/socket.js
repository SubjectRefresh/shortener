var socket = function () {}
var logger = require('./logger.js')
var l = 'SOCKT'

var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/

socket.prototype.init = function(http, shortener, db) {
  var io = require('socket.io')(http)

  io.on('connection', function (socket) {
    socket.on('url', function (url, callback) {
      if (url.indexOf('http') == -1) { // this also accounts for https
        url = 'http://' + url
      }
      if (url.indexOf('subr.pw') != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
        callback({
          status: false,
          message: 'Invalid URL'
        })
      } else {
        shortener.shorten(url, null, function (status) {
          if (status.status == true) {
            logger.success(l, 'Converted ' + url + ' to ' + status.short)
            callback({
              status: true,
              shortlink: status.short
            })
            io.sockets.emit('increment count')
          } else {
            logger.error(l, 'We ran into a problem')
          }
        })
      }
    })
    socket.on('data', function (data, callback) {
      logger.debug(l, JSON.stringify(data))
        var userData = db.collection('userData')
        userData.insert(data, function (err, result) {
          shortener.retrieve(data.url, function (retrieval) {
            console.log(retrieval)
            if (retrieval.status) {
              logger.success(l, 'Redirecting ' + data.url + ' to ' + retrieval.stats)
              // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
              callback(retrieval.stats)
            } else {
              logger.warn('Unknown short URL: ' + data.url)
              callback('http://subr.pw/')
            }
          })
        })
    })
    socket.on("stats", function(shortURL, callback){
      shortener.getStats(shortURL, function(information){
        callback(information);
      })
    })
  })
}

module.exports = new socket()
