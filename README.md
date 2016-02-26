# Shortener

A URL Shortener.  To generate a shortened URL:

```
short.connect('mongodb://localhost/short');
var shortURLPromise = short.generate({ URL : "URL You Want to Shorten" })
shortURLPromise.then(function(mongodbDoc) {
  console.log("Long URL: " + mongodbDoc.URL)
  console.log("Short URL: " + mongodbDoc.hash)
})
```

To get a shortened URL:

```
short.retrieve(mongodbDoc.hash).then(function(result) {
  console.log("Long URL: " + result.hash)
})
```
