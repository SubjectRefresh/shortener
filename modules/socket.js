var socket = function () {}
var logger = require('./logger.js')
var l = 'SOCKT'

// the regex below was written by Diego Perini and is licensed under the MIT license.
// see https://gist.github.com/dperini/729294

var urlRegExp = require("./url-regex.js");

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
            logger.success(l, 'Shortened ' + url + ' to ' + status.short)
            callback({
              status: true,
              shortlink: status.short
            })
            io.sockets.emit('increment count')
          } else {
            logger.error(l, 'We ran into a problem: ' + status.message)
          }
        })
      }
    })
    socket.on('data', function (data, callback) {
        var userData = db.collection('userData')
        userData.insert(data, function (err, result) {
          shortener.retrieve(data.url, function (retrieval) {
            if (retrieval.status) {
              logger.success(l, 'Redirecting ' + data.url + ' to ' + retrieval.url)
              // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
              callback(retrieval.url)
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
