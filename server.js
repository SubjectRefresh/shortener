const express = require('express')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const morgan = require('morgan')
const utilities = require('./helpers/utilities')
const app = express()
const http = require('http').Server(app)

dotenv.load()

const PRODUCTION = (process.env.NODE_ENV == 'production' ? true : false)
const DEVELOPMENT = (process.env.NODE_ENV == 'development' ? true : false)
const STAGING = (process.env.NODE_ENV == 'staging' ? true : false)
const config = require('./config')[process.env.NODE_ENV.toLowerCase()]

if (DEVELOPMENT) {
  mongoose.set('debug', true)
}

mongoose.Promise = global.Promise

const mongoURI = config.db.host + ':' + config.db.port + '/' + config.db.database
mongoose.connect(mongoURI)
mongoose.connection.on('error', function() {
  console.log('MongoDB connection error. Please make sure that MongoDB is running and available at', mongoURI)
  process.exit(1)
})

app.disable('x-powered-by')

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan('dev'))

app.use(function(req, res, next){
  let e = new Error('Page not found')
  e.status = 404
  next(e)
})

// api error handler
app.use('/api', function(err, req, res, next){
  if (err.status === 500) console.error(err.stack)
  console.error(err)

  switch (err.name) {
    case 'CastError':
      err.message = `Unable to convert ${err.value} at ${err.path} to ${err.kind}`
      err.status = 400
      break
    case 'ValidationError':

      // hack or what
      var info = err.errors[Object.keys(err.errors)[0]]
      var userDefined = (info.properties.type == 'user defined' ? true : false)
      if (userDefined) {
        var newError = new Error(info.message)
        newError.status = err.status
        err = newError
      }

      err.status = err.status || 400
      break
  }

  err.status = err.status || 500

  res.status(err.status).json({
    code: err.status,
    message: err.message,
    context: err.context || {}
  })
})

// HTML error handler
app.use(function(err, req, res, next){
  if (err.status != 404) console.error(err.stack)

  res.status(err.status || 500)
  res.render('error', {
    error: err.status,
    message: err.message
  })
})

const port = process.env.PORT || 3000

const io = require('socket.io')(http)

console.log(`Mongo: ${mongoURI}`)
console.log(`Revision: ${utilities.revision}`)
console.log(`Version: ${utilities.version}`)
console.log()

http.listen(port, () => {
  console.log('FleetReach platform listening on port', port)
})