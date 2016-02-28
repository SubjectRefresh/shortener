var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

var dbURL = "mongodb://localhost/shortener"
var baseURL = "http://subr.pw/";

var collection;

function init(callback) {
    MongoClient.connect(dbURL, function(err, db) {
        if (err) {
            console.log("[Shortener] Unable to connect to the MongoDB server. Error: ", err);
            throw new Error("Unable to connect to MongoDB");
            callback(false);
        } else {
            console.log("[Shortener] Connection established to ", dbURL);
            collection = db.collection("url");

            collection.createIndex({
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

function shorten(url, customURL, callback) {
    var changed = false;
    if (customURL == null) {
        changed = true;
        customURL = randomString(6, "aA#");
    }
    collection.find({
        long: url
    }).toArray(function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.length) {
            console.log("[Shortener] Long Already Exists");
            if (!changed) {
                // This is a custom URL....
                // Let"s break anyway...
            } else {
                // This isn"t a custom URL!
                // The Horror :3
            }
            // In Either Case for Now, Let's just return the existing...
            callback({
                status: true,
                short: result[0].short
            });
        } else {
            if (customURL != null) {
                collection.find({
                    short: customURL
                }).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                    } else if (result.length) {
                        console.log("[Shortener] customURL Already Exists");
                        callback({
                            status: false,
                            short: null
                        });
                    } else {
                        var data = {
                            short: customURL,
                            long: url
                        };
                        collection.insert(data, function(err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("[Shortener] Added CustomURL to Database");
                                callback({
                                    status: true,
                                    short: baseURL + customURL
                                });
                            }
                        });
                    }
                });
            } else {
                console.log("[Shortener] CustomURL'ing went wrong...");
            }
        }
    });
}

function retrieve(shortURL, callback) {
    console.log("[Shortener] Retrieving:", shortURL);
    collection.find({
        short: shortURL
    }).toArray(function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.length) {
            // console.log("Found:", result)
            callback({
                status: true,
                long: result[0].long
            });
        } else {
            callback({
                status: false,
                long: null
            });
        }
    })
}

module.exports = {
    init: init,
    retrieve: retrieve,
    shorten: shorten,
    randomString: randomString
};