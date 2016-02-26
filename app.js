  var config = { mongoUrl: 'mongodb://user:pass@host:port/database' };
  config.s3key = '<your S3 key>';
  config.s3secret = '<your S3 secret>';
  config.s3bucket = '<your S3 bucket>';
  config.shortUrlPrefix = 'http://mysite.com.s3-website-us-east-1.amazonaws.com/';
  config.uniqueIdPrefix = 'shortUrls-'; // all short urls will have this suffixed to shortUrlPrefix 

  var shortener = require('url-shorten')(config);

  shortener.shorten('http://www.example.com/some/longurl?ok', function(err, shortUrl) {
      // shortUrl will be something like 
      // http://mysite.com.s3-website-us-east-1.amazonaws.com/shortUrls-a3 
  });

  // you can find out the long URL for a short url via unshorten 
  shortener.unshorten('http://mysite.com.s3-website-us-east-1.amazonaws.com/shortUrls-a3', function(err, url) {
              // you can expect url to be the long url (such as http://www.example.com/some/longurl?ok) 
          }

          // by default shortener.shorten will always generate a *new* URL each time 
          // you can force it to try to do unique URLs via shortenUnique.  
          // Note that S3 is only *mostly* unique (there are race conditions). 
          // But MongoDB and Redis guarantee unique values. 
          shortener.shortenUnique(same parameters as shorten);
