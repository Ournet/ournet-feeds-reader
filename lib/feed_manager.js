'use strict';

var feedReader = require('ournet-feed-reader');

feedReader.logger.set(require('./logger'));

exports.process = function(feed) {
	return feedReader.read(feed);
};
