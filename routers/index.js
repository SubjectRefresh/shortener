const router = require('express').Router()
const API_VERSION = 1
const API_ROOT = `/api/v${API_VERSION}`

const ApiRouter = require('./api')

router.use(API_ROOT, ApiRouter)

module.exports = router