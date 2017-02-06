'use strict';

var debug = require('debug')('feedsreader:manager');
// var utils = require('./utils');
var logger = require('./logger');
var feedManager = require('./feed_manager');
var Data = require('./data');
const initTrendings = require('./trending');

/**
 * Process feeds by country and lang
 */
exports.process = function(options) {
	debug('start feeds manager');

	var saveTrendingsFn;

	return initTrendings({
			country: options.country,
			lang: options.lang
		})
		.then(function(saveTrendings) {
			saveTrendingsFn = saveTrendings;
			return Data.websites.access.feeds({
					where: {
						country: options.country,
						lang: options.lang,
						status: 'active',
						contentType: 1
					},
					limit: 120
				})
				.map(function(feed) {
					//feed.itemReadedHash = null;
					debug('start feed', feed.url);

					return feedManager.process(feed)
						.timeout(1000 * 60 * 2)
						.catch(function(error) {
							if (error && error.message) {
								logger.error('feed error', error);
							}
						});
				}, {
					concurrency: 1
				});
		})
		.then(function() {
			logger.log('END FEEDS MANAGER');
		})
		.finally(function() {
			return saveTrendingsFn()
				.catch(function(error) {
					logger.error('saving result', error);
				});
		})
		.catch(function(error) {
			logger.error('Feeds error', error);
		});
};
