/* This Project was made by SubjectRefresh.
We follow the standard[1] JS Style 
[1] https://github.com/feross/standard */

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient

var baseURL = 'http://subr.pw/'
var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/
var dbURL = 'mongodb://localhost/shortener'

MongoClient.connect(dbURL, function(err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err)
  } else {
    console.log('Connection established to', dbURL)
    var collection = db.collection('url')

    collection.createIndex({
      short: 1,
    }, {
      unique: true
    })

    function randomString(length, chars) {
      var mask = ''
      if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz'
      if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (chars.indexOf('#') > -1) mask += '0123456789'
      if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\'
      var result = ''
      for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)]
      return result
    }

    function shorten(url, customURL, callback) {
      var changed = false
      if (customURL == null) {
        changed = true
        customURL = randomString(6, 'aA#')
      }
      collection.find({
        long: url
      }).toArray(function(err, result) {
        if (err) {
          console.log(err)
        } else if (result.length) {
          console.log("Long Already Exists")
          if (!changed) {
            // This is a custom URL....
            // Let's break anyway...
          } else {
            // This isn't a custom URL!
            // The Horror :3
          }
          // In Either Case for Now, Let's just return the existing...
          callback({
            status: true,
            short: result[0].short
          })
        } else {
          if (customURL != null) {
            collection.find({
              short: customURL
            }).toArray(function(err, result) {
              if (err) {
                console.log(err)
              } else if (result.length) {
                console.log('customURL Already Exists')
                callback({
                  status: false,
                  short: null
                })
              } else {
                var data = {
                  short: customURL,
                  long: url
                }
                collection.insert(data, function(err, result) {
                  if (err) {
                    console.log(err)
                  } else {
                    console.log('Added CustomURL to Database')
                    callback({
                      status: true,
                      short: customURL
                    })
                  }
                })
              }
            })
          } else {
            console.log("CustomURL'ing went wrong...")
          }
        }
      })

    }

    function retrieve(shortURL, callback) {
      console.log("Retrieving:", shortURL)
      collection.find({
        short: shortURL
      }).toArray(function(err, result) {
        if (err) {
          console.log(err)
        } else if (result.length) {
          // console.log("Found:", result)
          callback({
            status: true,
            long: result[0].long
          })
        } else {
          callback({
            status: false,
            long: null
          })
        }
      })
    }

    shorten('www.google.com', null, function(status) {
      console.log('Status: ' + JSON.stringify(status))
      retrieve(status.short, function(status) {
        console.log('Status: ' + JSON.stringify(status))
      })
    })

    app.use('/', express.static(__dirname + '/static'))

    app.get('/:long', function(req, res) {
      console.log(req.params.long)
      retrieve(req.params.long, function(data) {
        if (data.status) {
          console.log(redirect)
          console.log('[Shortener] Redirecting ' + baseURL + req.params.long + ' to ' + redirect.shortlink)
          res.redirect('http://' + redirect.shortlink)
        } else {
          console.log("Unknown Short URL")
        }
      })
    })

    /*app.get('/:long/stats', function(req, res) {
      var hitsPromise = short.hits(req.params.long)
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

    app.get('/', function(req, res) {
      res.sendFile(__dirname + '/index.html')
    })

    io.on('connection', function(socket) {
      socket.on('url', function(url, callback) {
        if (url.indexOf('subr.pw') != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
          callback({
            status: false,
            message: 'Invalid URL'
          })
        } else {
          shorten(url, null, function(status) {
            if (status.status == true) {
              console.log('[Shortener] Converted ' + url + ' to ' + baseURL + status.short)
              callback({
                status: true,
                shortlink: baseURL + status.short
              })
              io.sockets.emit('increment count')
            } else {
              console.log('We ran into a problem')
            }
          })
        }
      })
    })

    http.listen(3004, function() {
      console.log('[Shortener] Listening on *:3004')
    })
  }
})