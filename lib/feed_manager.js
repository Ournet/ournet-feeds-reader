'use strict';

var feedReader = require('ournet-feed-reader');

feedReader.logger.set(require('./logger'));

exports.process = function(feed, result) {
	return feedReader.read(feed, result);
};
