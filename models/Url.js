const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ShortId = require('mongoose-shortid-nodeps')
const request = require('request')
const utilities = require('../helpers/utilities')

const schemaOptions = {
  strict: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
    }
  },
  toObject: {
    virtuals: true,
  }
}

const urlSchema = new Schema({
  url: { type: String, trim: true, index: true, unique: false },
  short: { type: ShortId, lowercase: true, trim: true, unique: true },
  update_key: { type: String, default: null },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  og_description: { type: String, trim: true },
  og_image: { type: String, trim: true },
  hits: { type: Number, default: 0, required: true }
}, schemaOptions)

urlSchema.pre('update', function (next) {
  this.options.runValidators = true
  next()
})

const titleRegex = new RegExp("<title>(.*?)</title>", "i")
const metaDescriptionRegex = new RegExp("<meta[^>]*name=[\"|\']description[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")
const ogDescriptionRegex = new RegExp("<meta[^>]*property=[\"|\']og:description[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")
const ogImageRegex = new RegExp("<meta[^>]*property=[\"|\']og:image[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")

urlSchema.pre('save', function(next) {
  let urlFormat = utilities.formatUri(this.url)

  if (urlFormat instanceof Error) {
    return next(urlFormat)
  } else {
    this.url = urlFormat
  }

  request(this.url, (err, response, body) => {
    if (err) return next(err)
    if (response.statusCode != 404) { // we only care about 404s

      let title = body.match(titleRegex)
      if (title) title = title[1]
      else title = null
      this.title = title

      let description = body.match(metaDescriptionRegex)
      if (description) description = description[1]
      else description = null
      this.description = description

      let og_description = body.match(ogDescriptionRegex)
      if (og_description) og_description = og_description[1]
      else if (description) og_description = description // use description instead
      else og_description = null
      this.og_description = og_description

      let og_image = body.match(ogImageRegex)
      if (og_image) og_image = og_image[1]
      else og_image = null
      this.og_image = og_image

      next()
    } else {
      let e = new Error(`${this.url} returned a ${response.statusCode}`)
      e.status = 400
      return next(e)
    }
  })
})

urlSchema.post('save', function(doc) {
  console.log(`${doc.url} -> ${doc.short}`)
})

urlSchema.methods.incrementHit = function(cb) {
  this.hits++
  this.save(cb)
}

const Url = mongoose.model('Url', urlSchema)

module.exports = Url
