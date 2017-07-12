const pkg = require('../package.json')

exports.revision = require('child_process').execSync('git rev-parse HEAD').toString().trim()
exports.version = pkg.version