'use strict';

var utils = require('ournet.utils');
var _ = require('lodash');
var Promise = require('bluebird');
var crypto = require('crypto');

exports.md5 = function(value) {
	return crypto.createHash('md5').update(value).digest('hex');
};

exports.Promise = Promise;
exports._ = _;

module.exports = exports = _.assign({}, utils, exports);
