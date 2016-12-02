var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var fs = require("fs");
var request = require("request")
var logger = require('../logger.js')
var nouns = [];
var adjs = [];

function generateFiles() {
    nouns = fs.readFileSync('./modules/shortener/nouns.txt').toString().split("\n")
    adjs = fs.readFileSync('./modules/shortener/adjectives.txt').toString().split("\n")
    for (i=0; i<nouns.length; i++) {
        nouns[i] = nouns[i].replace("\r", "")
    }
    for (i=0; i<adjs.length; i++) {
        adjs[i] = adjs[i].replace("\r", "")
    }
    nouns = shuffle(nouns)
    adjs = shuffle(adjs)
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

var l = "SHORT"
var dbURL = "mongodb://localhost/shortener"
var baseURL = "http://subr.pw/";

var URLCollection;
var UserCollection;

function init(callback) {
    MongoClient.connect(dbURL, function(err, db) {
        if (err) {
            logger.error(l, "Unable to connect to the MongoDB server. Error: " + err);
            throw new Error("Unable to connect to MongoDB");
            callback(false);
        } else {
            logger.log(l, "Connection established to " + dbURL);
            URLCollection = db.collection("url");
            UserCollection = db.collection("userData");

            URLCollection.createIndex({
                short: 1,
            }, {
                unique: true
            });
            callback(true);
        }
    });
}

function randomString(length, chars) {
    var mask = "";
    if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
    if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (chars.indexOf("#") > -1) mask += "0123456789";
    if (chars.indexOf("!") > -1) mask += '~`!@#$%^&*()_+-={}[]:";\"<>?,./|\\';
    var result = "";
    for (var i = length; i > 0; --i) {
        result += mask[Math.floor(Math.random() * mask.length)]
    }
    return result;
}

function mnemonicGenerator(url, callback) {
    if (nouns.length == 0 || adjs.length == 0) {
        generateFiles();
    } else {
        minimnemonic = adjs.pop() + "-" + nouns.pop()
        shorten(url, minimnemonic, function(blarg) {
            callback(blarg)
        })
    }
}

var titleRegex = new RegExp("<title>(.*?)</title>", "i")
var metaDescriptionRegex = new RegExp("<meta[^>]*name=[\"|\']description[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")
var ogDescriptionRegex = new RegExp("<meta[^>]*property=[\"|\']og:description[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")
var ogImageRegex = new RegExp("<meta[^>]*property=[\"|\']og:image[\"|\'][^>]*content=[\"]([^\"]*)[\"][^>]*>", "i")

function shorten(url, customURL, callback) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode != 404) { // we only care about 404s
            
            var title = body.match(titleRegex)
            if (title) title = title[1]
            else title = null

            var description = body.match(metaDescriptionRegex)
            if (description) description = description[1]
            else description = null

            var og_description = body.match(ogDescriptionRegex)
            if (og_description) og_description = og_description[1]
            else og_image = null

            var og_image = body.match(ogImageRegex)
            if (og_image) og_image = og_image[1]
            else og_image = null

            var changed = false;
            if (customURL == null) {
                changed = true;
                customURL = randomString(6, "aA#");
            }
            URLCollection.find({
                long: url
            }).toArray(function(err, result) {
                if (err) {
                    logger.error(l, err);
                } else if (result.length) {
                    logger.warning(l, "URL already exists");
                    URLCollection.update({
                        _id: result[0]._id
                    }, {
                        $set: {
                            title: title,
                            description: description,
                            og_description: og_description,
                            og_image: og_image
                        }
                    });
                    if (!changed) {} else {}
                    callback({
                        status: true,
                        short: baseURL + result[0].short
                    });
                } else {
                    if (customURL != null) {
                        URLCollection.find({
                            short: customURL
                        }).toArray(function(err, result) {
                            if (err) {
                                logger.error(l, err);
                            } else if (result.length) {
                                logger.warning(l, "Custom URL already exists")
                                callback({
                                    status: false,
                                    short: null,
                                    message: "Custom URL already exists"
                                });
                            } else {
                                var data = {
                                    short: customURL,
                                    long: url,
                                    title: title,
                                    description: description,
                                    og_description: description,
                                    og_image: og_image
                                };
                                URLCollection.insert(data, function(err, result) {
                                    if (err) {
                                        logger.error(l, err);
                                    } else {
                                        logger.success(l, "Added custom URL to database")
                                        callback({
                                            status: true,
                                            short: baseURL + customURL
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        logger.error(l, "Shortening URL went wrong...")
                    }
                }
            });
        } else {
            if (error) {
                callback({
                    status: false,
                    short: null,
                    message: "Error fetching " + url + ": " + error
                });
            } else {
                callback({
                    status: false,
                    short: null,
                    message: url + " returned a " + response.statusCode
                });
            }
        }
    })
}

function retrieve(shortURL, callback) {
    logger.log(l, "Retrieving: " + shortURL);
    URLCollection.find({
        short: shortURL
    }).toArray(function(err, result) {
        if (err) {
            logger.error(err);
        } else if (result.length) {
            callback({
                status: true,
                url: result[0].long,
                description: result[0].description,
                og_image: result[0].og_image,
                og_description: result[0].og_description,
                title: result[0].title
            });
        } else {
            // No result!
            callback({
                status: false,
                url: "https://subr.pw/"
            })
        }
    })
}

function getStats(shortURL, callback) {
    logger.log(l, "Getting stats for " + shortURL);
    UserCollection.find({
        url: shortURL
    }).toArray(function(err, result) {
        if (err) {
            logger.error(l, err);
            callback({
                status: false
            })
        } else if (result.length) {
            callback({
                status: true,
                stats: result
            });
        } else {
            callback({
                status: false
            })
        }
    })
}

function countLinks(callback) {
    URLCollection.count(function(error, count){
        if (!error) callback(count)
        else logger.error(l, "Failed to count URLs: " + error)
    })
}

module.exports = {
    init: init,
    retrieve: retrieve,
    shorten: shorten,
    randomString: randomString,
    generateFiles: generateFiles,
    mnemonicGenerator: mnemonicGenerator,
    getStats: getStats,
    countLinks: countLinks
};