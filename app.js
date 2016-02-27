var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var baseURL = "http://subr.pw/";
var urlRegExp = /^((ht|f)tps?:\/\/|)[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;

var shortURLPromise,
    short = require('short');

short.connect('mongodb://localhost/shortener');

function lookup(long, callback) {
    short.retrieve(long).then(function(result) {
        callback(result.URL);
    });
}

app.use("/", express.static(__dirname + "/static"));

app.get('/:long', function(req, res) {
    lookup(req.params.long, function(redirect) {
        console.log("[Shortener] Redirecting " + baseURL + req.params.long + " to " + redirect);
        res.redirect('http://' + redirect);
    });
});

app.get("/:long/stats", function(req, res) {
    // localhost:3004/69c9dc

    var hitsPromise = short.hits(req.params.long);
    hitsPromise.then(function(hits) {
        if (hits) {
            res.status(200).json({
                hits: hits,
                message: "ok",
                info: "More data to come in the future!",
                status: 200
            });
        } else {
            res.status(404).json({
                message: "Not found",
                status: 404
            })
        }
    });
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    socket.on('url', function(url, callback) {
        if (url.indexOf("subr.pw") != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
            callback({
                status: false,
                message: "Invalid URL"
            });
        } else {
            var shortURLPromise = short.generate({
                URL: url
            });

            shortURLPromise.then(function(mongo_doc) {
                console.log("[Shortener] Converted " + mongo_doc.URL + " to " + baseURL + mongo_doc.hash);
                callback({
                    status: true,
                    shortlink: baseURL + mongo_doc.hash
                });
                io.sockets.emit('increment count');
            });
        }
    });
});

http.listen(3004, function() {
    console.log('[Shortener] Listening on *:3004')
});