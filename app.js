/* This Project was made by SubjectRefresh.
We follow the standard[1] JS Style 
[1] https://github.com/feross/standard */

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient

var shortener = require('./modules/shortener')

var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/

app.use('/', express.static(__dirname + '/static'))

app.get("/favicon.ico", function(req, res) {
    res.sendStatus(404);
});

app.get('/:short', function(req, res) {
    shortener.retrieve(req.params.short, function(data) {
        if (data.status) {
            console.log('[Shortener] Redirecting ' + req.params.short + ' to ' + data.long)
                // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
            res.sendFile(__dirname + '/redirect.html')
        } else {
            console.log('[Shortener] Unknown short URL: ' + req.params.short)
            res.status(404).redirect('/')
        }
    })
})

app.get('/:short/stats', function(req, res) {
	console.log("sending stats")
    res.sendFile(__dirname + "/static/stats.html");
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(socket) {
    socket.on('url', function(url, callback) {
        if (url.indexOf('http') == -1) { // this also accounts for https
            url = 'http://' + url
        }
        if (url.indexOf('subr.pw') != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
            callback({
                status: false,
                message: 'Invalid URL'
            })
        } else {
            shortener.shorten(url, null, function(status) {
                if (status.status == true) {
                    console.log('[Shortener] Converted ' + url + ' to ' + status.short)
                    callback({
                        status: true,
                        shortlink: status.short
                    })
                    io.sockets.emit('increment count')
                } else {
                    console.log('We ran into a problem')
                }
            })
        }
    })
    socket.on('data', function(data, callback) {
        console.log(JSON.stringify(data))
        data.referer = req.header('Referer')
        MongoClient.connect('mongodb://localhost/shortener', function(err, db) {
            var userData = db.collection('userData')
            userData.insert(data, function(err, result) {
                shortener.retrieve(data.url, function(retrieval) {
                    if (retrieval.status) {
                        console.log('[Shortener] Redirecting ' + data.url + ' to ' + retrieval.long)
                            // res.redirect(302, data.long); // 302 means browsers don't bypass us next time
                        callback(retrieval.long)
                    } else {
                        console.log('[Shortener] Unknown short URL: ' + data.url)
                        callback('http://subjectrefresh.info')
                    }
                })
            })
        })
    })
    socket.on("stats", function(shortURL, callback) {
        shortener.getStats(shortURL, function(stats) {
            if (stats.status) {
                callback({
                    stats: stats.stats,
                    message: 'ok',
                    info: 'More data to come in the future!',
                    status: 200
                })
            } else {
                callback({
                    message: 'Not found',
                    status: 404
                })
            }
        })
    })
})

shortener.init(function(ok) {
    if (ok) {
        http.listen(3004, function() {
            console.log('[Shortener] Listening on *:3004')
        })
    } else {
        console.log('[Shortener] Error initiating shortener module')
    }
})