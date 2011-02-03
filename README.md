# node-get

`node-get` is a slightly higher-level HTTP client for nodejs.

## Installation

    npm install node-get

node-get has no dependencies.

### Features

* Redirect following.
* Convenience functions for downloading and getting data as string.
* Configurable binary-extension and basic binary detection.
* Configurable headers

### Example

    var get = require('node-get');

    var download = new get('http://google.com/');
    download.asString(console.log);

### Binary

node-get includes a binary, `node-get-file.js`, which downloads 
files either to the filesystem or to stdout.

### Authors

* Tom MacWright (tmcw)
