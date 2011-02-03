#!/usr/bin/env node

var path = require('path'),
    url = require('url'),
    sys = require('sys'),
    get = require('node-get');

var usage = 'usage:';
usage += '\n  node-get.js <file>';

var obj = process.ARGV[2];
if (!obj) {
   console.log(usage);
   process.exit(1);
}

// Initialize the download.
var download = new get({
    uri: obj
});

// Download to disk.
download.toDisk(path.basename(obj), function(err, filename) {
    if (err) {
        sys.err(err);
    } else {
        sys.debug('Downloaded to ' + filename);
    }
});

