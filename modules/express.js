var express = function () {}

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

  app.get("/shortened", function(req, res) {
    res.sendFile(path.resolve("./static/shortened.html"));
  });

  app.get('/', function (req, res) {
    res.sendFile(path.resolve('./index.html'))
  })
}

express.prototype.serveShorts = function(app) {
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
      shortener.getStats(req.params.short, function(){
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
  })
}

module.exports = new express()
