var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    fs = require('fs');

var get = require('node-get');

exports['test constructor'] = function(beforeExit) {
    [
        {
            url: 'http://tilemill-data.s3.amazonaws.com/merc_box.geojson',
            bin: false,
            type: 'txt'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/couchsurf.kml',
            bin: false,
            type: 'txt'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/images/paperfolds_256.png',
            bin: true,
            md5: 'a99502016d4e2124cf2dc4775aafc256',
            type: 'png'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/ipsum.json',
            bin: false,
            type: 'txt'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/README.txt',
            bin: false,
            type: 'txt'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/shape_demo.zip',
            bin: true,
            type: 'zip'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/nasa_raster/lasvegas_tm5_12jan09_crop_geo_merc_small.tif',
            bin: true,
            type: 'tif'
        },
        {
            url: 'http://dcatlas.dcgis.dc.gov/catalog/download.asp?downloadID=2315&downloadTYPE=ESRI',
            bin: true,
            type: 'zip'
        },
        {
            url: 'http://www.gdal.org/ogr/drv_sqlite.html',
            bin: false,
            type: 'txt'
        }
    ].forEach(function(u, i) {
        var req = new get({
            uri: u.url,
            headers: {
                'User-Agent': 'tombot'
            }
        });
        var first = true;
        var body = [];
        var p = req.perform(function(err, result) {
            if (u.error) {
                assert.eql(err, u.error, 'This should have had an error');
            } else {
                result.on('data', function(chunk) {
                    body.push(chunk);
                });
                result.on('end', function() {
                    assert.isDefined(body.length);
                });
            }
        });
        var p = req.toDisk('test_data/file_' + i + '.' + u.type, function(err, result) {
            // err && console.log(err);
            if (u.error) {
                assert.eql(err, u.error);
            }
        });
        var p = req.asString(function(err, result) {
            if (u.error) {
                assert.eql(err, u.error);
            } else {
                if (u.bin) {
                    assert.isNotNull(err, "Binary should not be stringed.");
                }
            }
        });
    })

    beforeExit(function() {
        // pass
    });
}

