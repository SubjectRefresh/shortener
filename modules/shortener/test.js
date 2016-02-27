var shortener = require("./index.js");

shortener.init(function(ok) {
	if (ok){
	    shortener.shorten("google.com", null, function(status) {
	        console.log("Status: " + JSON.stringify(status));
	        shortener.retrieve(status.short, function(status) {
	            console.log("Status: " + JSON.stringify(status));
	        });
	    });
	} else {
		console.log("[Shortener] Error initiating shortener module");
	}
});