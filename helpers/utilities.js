const pkg = require('../package.json')

exports.revision = require('child_process').execSync('git rev-parse HEAD').toString().trim()
exports.version = pkg.version

const urlRegExp = require('../helpers/url-regex.js')

exports.formatUri = (uri) => {
  if (uri.indexOf('http') == -1) { // this also accounts for https
    uri = 'http://' + uri
  }
  if (uri.indexOf('subr.pw') != -1 || !uri || !urlRegExp.test(uri)) { // if us, doesn't exist or isn't valid url
    let e = new Error(`Invalid URI ${uri}`)
    e.status = 400
    return e
  }
  return uri
}

exports.makeError = function(error) {
  let message
  let code
  
  switch (error) {
    case 'LinkNotFound':
      message = 'Short link not found'
      code = 404
      break;

    case 'NoAccessRight':
      message = 'Permission denied'
      code = 401
      break;
    case 'InvalidParamUpdateKeys':
      message = 'Missing parameter update_keys'
      code = 400
      break;
    case 'InvalidParamUpdateKey':
      message = 'Missing parameter update_key'
      code = 400
      break;

    default:
      message = 'Sorry, an unknown error occured'
      code = 500
  }

  let e = new Error(message)
  e.status = code
  e.error = error
  
  return e
}