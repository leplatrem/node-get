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
        this.max_redirs = options.max_redirs || 10;
    }

    var p_url = url.parse(this.uri);
    if (!(p_url.protocol &&
        (p_url.protocol == 'http:' || p_url.protocol == 'https:') &&
        p_url.hostname)) {
        throw new Error('Invalid URL given.');
    }
}

sys.inherits(Get, events.EventEmitter);

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

    if (this.uri_o.protocol == 'https') {
        this._client = http.createClient(443, this.uri_o.hostname);
        client.setSecure('x508_PEM');
    } else {
        this._client = http.createClient(this.uri_o.port || 80,
            this.uri_o.hostname);
    }

    return this._client;
};

Get.prototype.guessEncoding = function(location, response) {
    // The 'most reliable' measure is probably the end of files, so
    // start off with extname.
    var ext = path.extname(location).toLowerCase();
    if (encodings.ext[ext]) return encodings.ext[ext];
};

// Innermost API function of Get
//
// - @param {Function} callback
// - @param {Number} times number of times re-called.
Get.prototype.perform = function(callback, times) {
    // TODO: make configurable
    if (times > this.max_redirs) {
        callback({
            message: 'Redirect limit of '
                 + this.max_redirs
                 + ' reached'
        });
        return;
    }

    times = times || 1;

    var c = this.client();

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
            // Redirection
            // -----------
            // Servers can send a full redirect location
            // or a short form, like a hyperlink. Handle both.
            if (url.parse(response.headers.location).protocol) {
                this.uri = response.headers.location;
            } else {
                this.uri = url.resolve(this.uri, response.headers.location);
            }
            this.perform(callback, times + 1);
            return;
        } else if (response.statusCode >= 400) {
            // failure
            callback({
                message: 'Server returned HTTP ' + response.statusCode,
                statusCode: response.statusCode
            }, response);
        } else {
            // success
            response.setEncoding(this.guessEncoding(this.uri, response));
            callback(null, response);
        }
    }.bind(this));
};

// Stream a file to disk
// ---------------------
// - @param {String} filename.
// - @param {Function} callback.
Get.prototype.toDisk = function(filename, callback) {
    // TODO: catch all errors
    this.perform(function(err, response, encoding) {
        if (err) { callback(err); return; }

        // Pump contents from the response stream
        // into a new writestream.
        getutil.pump(
            response,
            fs.createWriteStream(filename),
            function(err) {
                callback(err, filename);
            }
        );
    });
};

// Get the contents of a URL as a string
//
// - @param {Function} callback.
Get.prototype.asString = function(callback) {
    // TODO: catch all errors
    this.perform(function(err, response, encoding) {
        if (err) { callback(err); return; }
        var out = [];
        response.on('data', function(chunk) {
            out.push(chunk);
        });
        response.on('error', function(err) {
            callback(err);
        });
        response.on('end', function() {
            callback(null, out.join(''));
        });
    });
};

module.exports = Get;
