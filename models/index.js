// model loader

const fs = require('fs')
const models_path = __dirname
fs.readdirSync(models_path).forEach(function (file) {
  if (file.includes('.js') && !file.includes('index.js')) module.exports[file.split('.')[0]] = require(models_path + '/' + file)
})