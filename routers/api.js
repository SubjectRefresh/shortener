const Router = require('express').Router()

const ApiController = require('../controllers/api')

Router.get('/short', ApiController.index)
Router.post('/short', ApiController.post)
Router.get('/short/:short', ApiController.get)
Router.put('/short/:short', ApiController.put)
Router.delete('/short/:short', ApiController.delete)

module.exports = Router