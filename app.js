var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var shortURLPromise
  , short = require('short');
 
// connect to mongodb 
short.connect('mongodb://localhost/short');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function (socket) {
  console.log("Someone connected")
  socket.on('url', function (msg) {
    var shortURLPromise = short.generate({ URL : msg })
    
    shortURLPromise.then(function(mongodbDoc) {
      console.log("Long: " + mongodbDoc.URL)
      console.log("Short: " + mongodbDoc.hash)
      io.emit('short', msg)
      short.retrieve(mongodbDoc.hash).then(function(result) {
        io.emit('long', result.hash)
      })
    })
  })
})

http.listen(3000, function () {
  console.log('listening on *:3000')
})
