var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var shortURLPromise,
  short = require('short')

short.connect('mongodb://localhost/short')

function lookup (long, callback) {
  short.retrieve(long).then(function (result) {
    callback(result.URL)
  })
}

app.get('/:long', function (req, res) {
  lookup(req.params.long, function (redirect) {
    console.log('Short: ' + redirect)
    res.redirect('http://' + redirect)
  })
})

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function (socket) {
  socket.on('url', function (msg) {
    var shortURLPromise = short.generate({ URL: msg })

    shortURLPromise.then(function (mongodbDoc) {
      console.log('Long: ' + mongodbDoc.URL)
      console.log('Short: ' + mongodbDoc.hash)
      io.emit('short', msg)
      short.retrieve(mongodbDoc.hash).then(function (result) {
        io.emit('long', result.hash)
      })
    })
  })
})

http.listen(3004, function () {
  console.log('listening on *:3004')
})
