const express = require('express')
const exphbs = require('express-handlebars')
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
const SSL = (process.env.SSL == 'true' ? true : false)

const port = process.env.PORT || 3000
const base_url = (SSL ? 'https://' : 'http://') + (process.env.URL || 'localhost')
const host = base_url

if (DEVELOPMENT) {
  // mongoose.set('debug', true)
}

mongoose.Promise = global.Promise

const mongoURI = config.db.host + ':' + config.db.port + '/' + config.db.database
mongoose.connect(mongoURI)
mongoose.connection.on('error', function() {
  console.log('MongoDB connection error. Please make sure that MongoDB is running and available at', mongoURI)
  process.exit(1)
})

const models = require('./models')

const hbs = exphbs.create({
  defaultLayout: 'main'
})

app.disable('x-powered-by')
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/static'))
app.use(morgan('dev'))
app.use('/docs', express.static(__dirname + '/docs'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(require('./routers'))

app.get('/', (req, res, next) => {
  models.Url.find().count((err, shortlinks) => {
    if (err) return next(err)
    res.render('home', { host, shortlinks })
  })
})

app.get('/s', (req, res, next) => {
  return res.status(301).redirect('/')
})

app.get('/s/:short', (req, res, next) => {
  models.Url.findOne({ short: req.params.short }, (err, doc) => {
    if (err) return next(err)
    if (!doc) return next()

    res.render('redirect', { layout: false, short: doc })

    doc.incrementHit((err, result) => {
      if (err) console.error(err)
    })
  })
})

app.get('/:short', (req, res, next) => {
  if (['api', 'docs', '/'].indexOf(req.params.short) !== -1) {
    return res.status(301).redirect('/s/' + req.params.short)
  } else {
    return next()
  }
})

app.use(function(req, res, next) {
  let e = new Error('Page not found')
  e.status = 404
  next(e)
})

// api error handler
app.use('/api', function(err, req, res, next) {
  err.status = err.status || 500
  if (err.status == 500) console.error(err)

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

  res.status(err.status).json({
    ok: false,
    code: err.status,
    message: err.message,
    error: err.error
  })
})

// HTML error handler
app.use(function(err, req, res, next) {
  err.status = err.status || 500
  if (err.status == 500) console.error(err.stack)

  res.status(err.status).render('error', {
    showAds: true,
    error: err.status,
    message: err.message
  })
})

console.log(`Mongo: ${mongoURI}`)
console.log(`Revision: ${utilities.revision}`)
console.log(`Version: ${utilities.version}`)
console.log(`Environment: ${process.env.NODE_ENV}`)
console.log()

http.listen(port, () => {
  console.log(`Shortener listening at ${host}`)
})
