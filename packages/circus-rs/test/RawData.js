"use strict";

var rawdata = require('../build/RawData.js');
var RawData = rawdata.default;
var PixelFormat = rawdata.PixelFormat;

var assert = require('chai').assert;

describe('RawData', function () {
	it('must create binary data', function () {
		var raw = new RawData();
		raw.setDimension(8, 8, 8, PixelFormat.Binary);
		var array = new Uint8Array(8); // 64 bits in a slice
		array[0] = 0xAA; // 0b10101010
		raw.insertSingleImage(0, array.buffer);
		assert.equal(raw.getPixelAt(0, 0, 0), 1);
		assert.equal(raw.getPixelAt(1, 0, 0), 0);
		assert.equal(raw.getPixelAt(2, 0, 0), 1);
		assert.equal(raw.getPixelAt(3, 0, 0), 0);
	});

	function readWriteTest(pixelFormat, w, h, d) {
		return function () {
			var raw = new RawData();
			raw.setDimension(w, h, d, pixelFormat);
			var pi = raw.getPixelFormatInfo(pixelFormat);
			var lo = pi.minLevel;
			var hi = pi.maxLevel;
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					for (var z = 0; z < d; z++) {
						var value = (x + y + z) % (hi - lo + 1) + lo;
						raw.writePixelAt(value, x, y, z);
					}
				}
			}
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					for (var z = 0; z < d; z++) {
						var value = (x + y + z) % (hi - lo + 1) + lo;
						var px = raw.getPixelAt(x, y, z);
						assert.equal(px, value);
					}
				}
			}
		}
	}

	it('must read/write values from/to UInt8 volume',
		readWriteTest(rawdata.PixelFormat.UInt8, 32, 32, 10));

	it('must read/write values from/to Int8 volume',
		readWriteTest(rawdata.PixelFormat.Int8, 32, 32, 10));

	it('must read/write values from/to UInt16 volume',
		readWriteTest(rawdata.PixelFormat.UInt16, 32, 32, 10));

	it('must read/write values from/to Int16 volume',
		readWriteTest(rawdata.PixelFormat.Int16, 32, 32, 10));

	it('must read/write values from/to Binary volume',
		readWriteTest(rawdata.PixelFormat.Binary, 32, 32, 10));
});
