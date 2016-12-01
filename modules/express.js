var express = function () {}

var logger = require('./logger.js')
var l = 'EXPRS'

var node_express = require('express')
var path = require('path')

express.prototype.init = function() {
  return node_express()
}

express.prototype.serveStatic = function(app) {
  app.use('/', node_express.static(path.resolve('./static')))

  app.get("/favicon.ico", function(req, res) {
    res.sendStatus(404);
  });

//  app.get("/shortened", function(req, res) {
//    res.sendFile(path.resolve("./static/shortened.html"));
//  });

  app.get('/', function (req, res) {
    res.sendFile(path.resolve('./index.html'))
  })
}

express.prototype.serveShorts = function(app, shortener) {
  app.get('/:short', function(req, res) {
      shortener.retrieve(req.params.short, function(data) {
          if (data.status) {
              console.log('[Shortener] Redirecting ' + req.params.short + ' to ' + data.long)
                  // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
              res.sendFile(path.resolve('./redirect.html'))
          } else {
              console.log('[Shortener] Unknown short URL: ' + req.params.short)
              res.status(404).redirect('/')
          }
      })
  })
}


express.prototype.serveStats = function(app) {
  app.get('/:short/stats', function(req, res) {
    res.status(404).redirect("/");
      // res.sendFile(path.resolve("./static/stats.html"))
  })
}

var urlRegExp = /^(https?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,63}\/?([^\s<>\#"\,\{\}\\|\\\^\[\]`]+)?$/
express.prototype.serveApi = function(app, shortener) {
  app.post("/api/create", function(req, res) {
    var url = req.body.url;
    if (url.indexOf('http') == -1) { // this also accounts for https
      url = 'http://' + url
    }
    if (url.indexOf('subr.pw') != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
      res.status(400).json({
        status: false,
        message: 'Invalid URL'
      })
    } else {
      shortener.shorten(url, null, function (status) {
        if (status.status == true) {
          logger.success(l, 'Converted ' + url + ' to ' + status.short)
          res.json({
            status: true,
            shortlink: status.short
          })
        } else {
          res.status(500).json({
            status: false,
            message: "Unknown error"
          })
          logger.error(l, 'We ran into a problem')
        }
      })
    }
  })

  app.post("/api/lengthen", function(req, res) {
    var url = req.body.url;
    if (url) {
      shortener.retrieve(url, function(retrieval) {
        if (retrieval.status) {
          res.json({
            status: true,
            url: retrieval.stats // why stats?!
          })
        } else {
          res.status(404).json({
            status: false,
            message: "Unknown short URL"
          })
        }
      })
    } else {
      res.status(400).json({
        status: false,
        message: "Missing URL parameter"
      })
    }
  })
}


module.exports = new express()
