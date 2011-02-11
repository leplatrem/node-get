# node-get

`node-get` is a slightly higher-level HTTP client for nodejs.

## Installation

    npm install node-get

node-get has no dependencies.

## Features

* Redirect following.
* Convenience functions for downloading and getting data as string.
* Binary-extension and basic binary detection.

## API

Downloads are objects in `node-get`.

    var dl = new get({ uri: 'http://google.com/' });

The get constructor can also take a plain string if you don't want to give options.

    var dl = new get('http://google.com/');

It can also take other options.

    var dl = new get({
        uri: 'http://google.com/',
        max_redirs: 20,
    });

Then it exposes two big methods

    dl.asString(function(err, str) {
        console.log(str);
    });

and

    dl.toDisk('myfile.txt', function(err) {
        console.log(err);
    });

There's also a lower-level API.

    dl.perform(function(err, response, encoding) {
        // response is just a response object, just like
        // HTTP request, except handling redirects
    });

## Example

    var get = require('node-get');

    var download = new get('http://google.com/');
    download.asString(console.log);

## Binary

node-get includes a binary, `node-get-file.js`, which downloads 
files either to the filesystem or to stdout.

## Changelog

### 0.0.2

* Enhanced URL validation.

### 0.0.3

* Handling of DNS-level exceptions.

## TODO:

* Retries
* Tested HTTPS
* Guessing encoding wth headers
* User-customizable encodings
* Configurable headers

## Authors

* Tom MacWright (tmcw)
