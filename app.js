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
		console.log('Short: ' + redirect);
		res.redirect('http://' + redirect);
	});
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	socket.on('url', function(url) {
		url = url.replace("http://", "").replace("https://", "");

		if (url.indexOf("subr.pw") != -1 || !url || !urlRegExp.test(url)) { // if us, doesn't exist or isn't valid url
			socket.emit("e", {message: "Invalid URL"});
		} else {
			var shortURLPromise = short.generate({
				URL: url
			});

			shortURLPromise.then(function(mongo_doc) {
				console.log("[Shortener] Converted " + mongo_doc.URL + " to " + baseURL + mongo_doc.hash);
				socket.emit('short', baseURL + mongo_doc.hash);
			});
		}
	});
});

http.listen(3004, function() {
	console.log('[Shortener] listening on *:3004')
});