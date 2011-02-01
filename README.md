# node-get

`node-get` is a slightly higher-level HTTP client for nodejs.

### Features

* Redirect following.
* Convenience functions for downloading and getting data as string.
* Configurable binary-extension and basic binary detection.
* Configurable headers

### Usage

    var get = require('node-get');
    (new get('http://google.com/'))
    .asString(function(err, str) {
        console.log(str);
    });
