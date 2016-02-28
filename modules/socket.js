var socket = function () {}
var logger = require('./logger.js')
var l = 'SOCKT'

var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/

socket.prototype.init = function(http, shortener) {
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
            console.log('[Shortener] Converted ' + url + ' to ' + status.short)
            callback({
              status: true,
              shortlink: status.short
            })
            io.sockets.emit('increment count')
          } else {
            console.log('We ran into a problem')
          }
        })
      }
    })
    socket.on('data', function (data, callback) {
      console.log(JSON.stringify(data))
      MongoClient.connect('mongodb://localhost/shortener', function (err, db) {
        var userData = db.collection('userData')
        userData.insert(data, function (err, result) {
          shortener.retrieve(data.url, function (retrieval) {
            if (retrieval.status) {
              console.log('[Shortener] Redirecting ' + data.url + ' to ' + retrieval.long)
              // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
              callback(retrieval.long)
            } else {
              console.log('[Shortener] Unknown short URL: ' + data.url)
              callback('http://subjectrefresh.info')
            }
          })
        })
      })
    })
  })
}

module.exports = new socket()
