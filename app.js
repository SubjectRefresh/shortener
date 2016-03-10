/* This Project was made by SubjectRefresh.
We follow the standard[1] JS Style 
[1] https://github.com/feross/standard */

var config = require('./config.js')
var logger = require('./modules/logger.js')
var express = require('./modules/express.js')
var mongo = require('./modules/mongo.js')
var server = require('./modules/server.js')
var socket = require('./modules/socket.js')
var shortener = require('./modules/shortener')

var l = 'APP'
mongo.connect(config, function(db) {
  var app = express.init()
  shortener.init(function (ok) {
    if (!ok) { logger.error(l, "Error initiating shortener module") }
    else {
      shortener.generateFiles()
      var http = server.serve(config, app)
      socket.init(http, shortener, db)
      express.serveStatic(app)
      express.serveShorts(app, shortener)
      shortener.mnemonicGenerator("www.happygoogle.com", function(blarg) {continue})
      // express.serveStats(app, shortener)
    }
  })
})