// node.js libraries
var http = require('http'),
    sys = require('sys'),
    fs = require('fs'),
    events = require('events'),
    url = require('url'),
    path = require('path');

// Local node-get libraries
var encodings = require('./encodings'),
    getutil = require('./getutil');

// A wrapper for response that 
// autodetects certain files that are often served
// by nonrepresentative URLs (zip files)
function AutoResponse(response, def) {
    var zipdetect = function(chunk) {
        response.removeListener('data', zipdetect);
        // Detect zip files, by detecting
        // their common four-byte header
        if (chunk.charCodeAt(0) == 80 &&
            chunk.charCodeAt(1) == 75 &&
            chunk.charCodeAt(2) == 3 &&
            chunk.charCodeAt(3) == 4) {
            response.setEncoding('binary');
            if (this.stream) {
                this.stream.encoding = 'binary';
            }
        } else {
            // Otherwise, assume that the value is the 
            // default given as def
            response.setEncoding(def);
            if (this.stream) {
                this.stream.encoding = def;
            }
        }
        this.emit('data', chunk);
    };
    response.on('data', zipdetect);
    return new SkipFirst(response);
}

// An odd object - a wrapper for an event emitter
// that doesn't emit the first `data` event sent.
function SkipFirst(em) {
    var first = true,
        that = this;
    this.encoding = em._decoder.encoding;
    em.on('data', function(chunk) {
        if (!first) {
            that.emit('data', chunk);
        } else {
            first = false;
        }
    });
    em.on('end', function() { that.emit('end') });
}

// Get a Get object. Takes an argument, that is either
// an object with a required 'uri' property, or
// a string that's taken to be a URI
function Get(options) {
    if (typeof options == 'string') {
        this.uri = options;
    } else {
        if (!options.uri) {
            throw Error('uri option required in get constructor');
        }
        this.uri = options.uri;
    }
}

sys.inherits(Get, events.EventEmitter);
sys.inherits(AutoResponse, events.EventEmitter);
sys.inherits(SkipFirst, events.EventEmitter);

// Create or reuse a HTTP client
//
// - @return {http.Client} a proper client.
Get.prototype.client = function() {
    // TODO: handle non http/https protocols
    this.uri_o = url.parse(this.uri);

    // Reuse existing client connections in the
    // case of redirects.
    if (this._client &&
        (this.uri_o.port || 80) == this._client.port &&
        this.uri_o.host == this._client.host) {
        return this._client;
    }

    // TODO: move
    this.file_ext = path.extname(this.uri_o.pathname).toLowerCase();

    if (this.uri_o.protocol == 'https') {
        this._client = http.createClient(443, this.uri_o.hostname);
        client.setSecure('x508_PEM');
    } else {
        this._client = http.createClient(this.uri_o.port || 80,
            this.uri_o.hostname);
    }

    return this._client;
};

// Innermost API function of Get
//
// - @param {Function} callback
// - @param {Number} times number of times re-called.
Get.prototype.perform = function(callback, times) {
    // TODO: make configurable
    if (times > 10) callback({ message: 'Redirect limit reached' });
    times = times || 1;

    var c = this.client(),
        that = this;

    // TODO: fix when/if gzip is supported.
    c.headers = {
        'Accept-Encoding': 'none',
        'Connection': 'close',
        'User-Agent': 'node-get'
    };

    var request = c.request('GET',
         ((this.uri_o.pathname || '')
        + (this.uri_o.search || '')
        + (this.uri_o.hash || '')) || '/', {
            host: this.uri_o.hostname
        }
    );

    request.end();
    request.addListener('response', function(response) {
        if (response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location) {
            // redirection
            if (url.parse(response.headers.location).protocol) {
                // The redirect is a full location
                that.uri = response.headers.location;
            } else {
                // Follow the redirect like a link
                that.uri = url.resolve(that.uri, response.headers.location);
            }
            that.perform(callback, times + 1);
            return;
        } else if (response.statusCode >= 400) {
            // failure
            callback({
                statusCode: response.statusCode
            }, response);
        } else {
            // success
            response.setEncoding('binary');
            callback(null,
                new AutoResponse(response,
                    encodings[that.file_ext] || 'utf-8'));
        }
    });
};

// Stream a file to disk
//
// - @param {String} filename.
// - @param {Function} callback.
Get.prototype.toDisk = function(filename, callback) {
    // TODO: catch all errors
    this.perform(function(err, response) {
        if (err) { callback(err); return; }

        var ws = fs.createWriteStream(filename);
        response.stream = ws;

        getutil.pump(response,
            ws, 
            function(err) {
            if (err) {
                callback(err);
                return;
            }
        });
    });
};

// Get the contents of a URL as a string
//
// - @param {Function} callback.
Get.prototype.asString = function(callback) {
    // TODO: catch all errors
    this.perform(function(err, response) {
        if (err) { callback(err); return; }
        var out = [];
        response.on('data', function(chunk) {
            out.push(chunk);
        });
        response.on('end', function() {
            // TODO warn for encoding non-strings
            callback(null, out.join(''));
        });
    });
};

module.exports = Get;
