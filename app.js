/* This Project was made by SubjectRefresh.
We follow the standard[1] JS Style 
[1] https://github.com/feross/standard */

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient

var shortener = require('./modules/shortener')

var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/

app.use('/', express.static(__dirname + '/static'))

app.get('/:short', function (req, res) {
  shortener.retrieve(req.params.short, function (data) {
    if (data.status) {
      console.log('[Shortener] Redirecting ' + req.params.short + ' to ' + data.long)
      // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
      res.sendFile(__dirname + '/redirect.html')
    } else {
      console.log('[Shortener] Unknown short URL: ' + req.params.short)
      res.status(404).redirect('/')
    }
  })
})

/*app.get('/:short/stats', function(req, res) {
  var hitsPromise = short.hits(req.params.short)
  hitsPromise.then(function(hits) {
  if (hits) {
    res.status(200).json({
    hits: hits,
    message: 'ok',
    info: 'More data to come in the future!',
    status: 200
    })
  } else {
    res.status(404).json({
    message: 'Not found',
    status: 404
    })
  }
  })
})*/

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

var clients = []

io.on('connection', function (socket) {
  clients.push(socket)
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
  socket.on('data', function (data) {
    console.log(JSON.stringify(data))
    MongoClient.connect('mongodb://localhost/shortener', function (err, db) {
      var userData = db.collection('userData')
      userData.insert(data, function (err, result) {
        shortener.retrieve(data.url, function (retrieval) {
          var index = clients.indexOf(socket)
          if (index != -1) {
            if (retrieval.status) {
              console.log('[Shortener] Redirecting ' + data.url + ' to ' + retrieval.long)
              // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
              clients[index].emit('redirect', retrieval.long)
            } else {
              console.log('[Shortener] Unknown short URL: ' + data.url)
              clients[index].emit('redirect', 'http://subjectrefresh.info')
            }
          }
        })
      })
    })
  })
  socket.on('disconnect', function () {
    var index = clients.indexOf(socket)
    if (index != -1) {
      clients.splice(index, 1)
      console.log('Client gone (id=' + socket.id + ').')
    }
  })
})

shortener.init(function (ok) {
  if (ok) {
    http.listen(3004, function () {
      console.log('[Shortener] Listening on *:3004')
    })
  } else {
    console.log('[Shortener] Error initiating shortener module')
  }
})
