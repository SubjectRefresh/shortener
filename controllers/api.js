const Url = require('../models/Url')
const utilities = require('../helpers/utilities')

/**
 * @apiDefine ShortLinkErrors
 * @apiError {String} LinkNotFound The short link was not found
 * @apiError {String} NoAccessRight You do not have permission to update this short link
 * @apiErrorExample {json} Example error response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "ok": false,
 *       "code": 404,
 *       "message": "Short link not found",
 *       "error": "LinkNotFound"
 *     }
 */

/**
 * @apiDefine LinkFoundResponse
 *
 * @apiSuccess {Boolean} ok Whether the operation succeeded or not
 * @apiSuccess {Object} data The short link document
 * @apiSuccess {String} data.short The short link
 * @apiSuccess {String} data.url URL which the short corresponds to
 * @apiSuccess {String} data.title Title of the site to redirect to
 * @apiSuccess {String} data.description Meta description of the site to redirect to
 * @apiSuccess {String} data.og_description og_description of the site to redirect to
 * @apiSuccess {String} data.og_image og_image of the site to redirect to
 * @apiSuccess {Number} data.hits Number of times this short was visited
 * @apiSuccess {Date} data.updatedAt The last time the short link was updated
 * @apiSuccess {Date} data.createdAt When the short link was created
 * @apiSuccess {String} data.id The ID of the short link document
 * @apiSuccess {String} data.update_key The key to use when updating the short link (not provided when getting a single short link)
 */

/**
 * @apiDefine InvalidParamUpdateKeyError
 * @apiError {String} InvalidParamUpdateKey Missing parameter update_key
 */

/**
 * @api {get} /short Request information about short URLs
 * @apiGroup Short
 * @apiName IndexShort
 * @apiParam update_keys Commma-delimited string of update_key values
 *
 * @apiUse LinkFoundResponse
 * @apiUse InvalidParamUpdateKeyError
 *
 * @apiSuccessExample {json} Example success response:
 *    HTTP/1.1 200 OK
 *    {
 *      "ok": true,
 *      "data": [{
 *        "short": "_q7ctfo",
 *        "og_image": null,
 *        "og_description": null,
 *        "description": null,
 *        "title": "Example Domain",
 *        "updatedAt": "2017-07-12T13:42:45.925Z",
 *        "createdAt": "2017-07-12T13:42:45.925Z",
 *        "url": "http://example.com",
 *        "hits": 0,
 *        "id": "596627557dcab11665a21b5a",
 *        "update_key": "secretkey"
 *      }]
 *    }
 */

module.exports.index = (req, res, next) => {
  if (!req.query.update_keys) return next(utilities.makeError('InvalidParamUpdateKey'))

  let keys = req.query.update_keys.split(',')
  Url
    .find({ update_key: { $in: req.query.update_keys } })
    .where('update_key').ne(null)
    .exec((err, urls) => {
      if (err) return next(err)
      res.json({
        ok: true,
        data: urls
      })
    })  
}

/**
 * @api {get} /short/:id Request information about a short URL
 * @apiGroup Short
 * @apiName GetShort
 *
 * @apiSuccessExample {json} Example success response:
 *    HTTP/1.1 200 OK
 *    {
 *      "ok": true,
 *      "data": {
 *        "short": "_q7ctfo",
 *        "og_image": null,
 *        "og_description": null,
 *        "description": null,
 *        "title": "Example Domain",
 *        "updatedAt": "2017-07-12T13:42:45.925Z",
 *        "createdAt": "2017-07-12T13:42:45.925Z",
 *        "url": "http://example.com",
 *        "hits": 0,
 *        "id": "596627557dcab11665a21b5a"
 *      }
 *    }
 *
 * @apiUse ShortLinkErrors
 * @apiUse LinkFoundResponse
 */

module.exports.get = (req, res, next) => {
  Url.findOne({ short: req.params.short }, (err, url) => {
    if (err) return next(err)
    if (!url) return next(utilities.makeError('LinkNotFound'))

    delete url.update_key

    res.json({
      ok: true,
      data: url
    })
  })  
}


/**
 * @api {post} /short Create a new short link
 * @apiGroup Short
 * @apiName PostShort
 * @apiUse InvalidParamUpdateKeyError
 * 
 * @apiParam {String} url The URL which the short points to
 * @apiParam {String} update_key Random secret key to use when creating the short link
 *
 *
 * @apiSuccessExample {json} Example success response:
 *    HTTP/1.1 202 Created
 *    {
 *      "ok": true,
 *      "message": "Created",
 *      "data": {
 *        "short": "_q7ctfo",
 *        "og_image": null,
 *        "og_description": null,
 *        "description": null,
 *        "title": "Example Domain",
 *        "updatedAt": "2017-07-12T13:42:45.925Z",
 *        "createdAt": "2017-07-12T13:42:45.925Z",
 *        "url": "http://example.com",
 *        "update_key": "my secret key"
 *        "hits": 0,
 *        "id": "596627557dcab11665a21b5a"
 *      }
 *    }
 */

module.exports.post = (req, res, next) => {
  // a null update_key means it cannot be updated
  if (req.body.update_key === undefined || req.body.update_key == '') return next(utilities.makeError('InvalidParamUpdateKey'))
  Url.create(req.body, (err, doc) => {
    if (err) return next(err)
    res.status(201).json({
      ok: true,
      message: 'Created',
      data: doc
    })
  })
}

/**
 * @api {put} /short/:short Update a short link
 * @apiGroup Short
 * @apiName PutShort
 * @apiUse InvalidParamUpdateKeyError
 *
 * @apiParam {String} url The URL which the short points to
 * @apiParam {String} update_key Random secret key to use when updating the short link
 *
 * @apiSuccessExample {json} Example success response:
 *    HTTP/1.1 201 Accepted
 *    {
 *      "ok": true,
 *      "message": "Updated",
 *      "data": {
 *        "short": "_q7ctfo",
 *        "og_image": null,
 *        "og_description": null,
 *        "description": null,
 *        "title": "Example Domain",
 *        "updatedAt": "2017-07-12T13:42:45.925Z",
 *        "createdAt": "2017-07-12T13:42:45.925Z",
 *        "url": "http://example.com",
 *        "update_key": "my secret key"
 *        "hits": 0,
 *        "id": "596627557dcab11665a21b5a"
 *      }
 *    }
 * @apiUse ShortLinkErrors
 */

module.exports.put = (req, res, next) => {
  delete req.params.hits
  Url.findOne({ short: req.params.id, update_key: { $ne: null } }, (err, doc) => {
    if (err) return next(err)
    if (!doc) return next(utilities.makeError('LinkNotFound'))

    if (req.body.update_key != doc.update_key) return next(utilities.makeError('NoAccessRight'))

    Url.findOneAndUpdate(doc._id, req.body, (err, doc) => {
      if (err) return next(err)
      res.status(202).json({
        ok: true,
        message: 'Updated',
        data: doc
      })
    })
  })
}

/**
 * @api {delete} /short/:short Delete a short link
 * @apiGroup Short
 * @apiName DeleteShort
 * @apiUse InvalidParamUpdateKeyError
 *
 * @apiParam {String} update_key Random secret key to use when deleting the short link
 *
 * @apiSuccessExample {json} Example success response:
 *    HTTP/1.1 201 Accepted
 *    {
 *      "ok": true,
 *      "message": "Deleted",
 *      "data": {
 *        "short": "_q7ctfo",
 *        "og_image": null,
 *        "og_description": null,
 *        "description": null,
 *        "title": "Example Domain",
 *        "updatedAt": "2017-07-12T13:42:45.925Z",
 *        "createdAt": "2017-07-12T13:42:45.925Z",
 *        "url": "http://example.com",
 *        "update_key": "my secret key"
 *        "hits": 0,
 *        "id": "596627557dcab11665a21b5a"
 *      }
 *    }
 * @apiUse ShortLinkErrors
 */

module.exports.delete = (req, res, next) => {
  Url.findOne({ short: req.params.id, update_key: { $ne: null } }, (err, doc) => {
    if (err) return next(err)
    if (!doc) return next(utilities.makeError('LinkNotFound'))

    if (req.body.update_key != doc.update_key) return next(utilities.makeError('NoAccessRight'))

    Url.findOneAndRemove({ _id: doc._id }, (err, doc) => {
      if (err) return next(err)
      res.status(202).json({
        ok: true,
        message: 'Deleted',
        data: doc
      })
    })
  })
}