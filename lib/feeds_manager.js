'use strict';

var debug = require('debug')('feedsreader:manager');
var utils = require('./utils');
var logger = require('./logger');
var Promise = utils.Promise;
var feedManager = require('./feed_manager');
var Data = require('./data');

function createResult(options) {
	var result = {
		options: options,
		topics: {},
		itemSaved: function(item) {
			if (!item || !item.topics || item.topics.length === 0) {
				return;
			}
			var topics = item.topics;
			var self = this;
			topics.forEach(function(topic) {
				if (self.topics[topic.id]) {
					self.topics[topic.id].count++;
				} else {
					self.topics[topic.id] = {
						topic: topic,
						count: 1
					};
				}
			});
		},
		save: function() {
			//console.log('TOPICS: ', this.topics);
			var self = this;
			var now = Date.now();
			var time24h = 1000 * 60 * 60 * 24;
			var keys = Object.keys(this.topics);
			return Promise.resolve(keys).each(function(key) {
				var topic = self.topics[key].topic;
				return Promise.props({
					count24h: Data.webdata.access.countWebpages({
						culture: self.options,
						where: {
							'topics._id': topic.id,
							createdAt: {
								$gt: now - time24h
							}
						}
					}),
					countPrev24h: Data.webdata.access.countWebpages({
						culture: self.options,
						where: {
							'topics._id': topic.id,
							createdAt: {
								$gt: now - time24h * 2,
								$lt: now - time24h
							}
						}
					})
				}).then(function(counts) {
					// console.log('Saving topic trends', self.options, counts);
					return Data.webdata.control.setTopicTrend(self.options, topic, counts);
				});
			});
		}
	};

	return result;
}

/**
 * Process feeds by country and lang
 */
exports.process = function(options) {
	var result = createResult(options);
	debug('start feeds manager');
	return Data.websites.access.feeds({
			where: {
				country: options.country,
				lang: options.lang,
				status: 'active',
				contentType: 1
			},
			limit: 120
		}).map(function(feed) {
			//feed.itemReadedHash = null;
			debug('start feed', feed.url);

			return feedManager.process(feed, result)
				.timeout(1000 * 60 * 2)
				.then(function(feedResult) {
					if (feedResult) {
						return Data.websites.control.updateFeed({
							id: feed.id,
							itemReadedAt: Date.now(),
							itemReadedHash: feedResult.lastLinkHash
						});
					}
				})
				.then(() => {
					debug('end feed ' + feed.url);
				})
				.catch(function(error) {
					//console.error(error.trace);
					if (error && error.message) {
						logger.error('feed error', error);
					}
					return Data.websites.control.updateFeed({
						id: feed.id,
						readErrorAt: Date.now(),
						readError: error && error.message || ('Feed error: ' + feed.url)
					});
				});
		}, {
			concurrency: 1
		})
		.then(function() {
			logger.log('END FEEDS MANAGER');
		})
		.finally(function() {
			return result.save().catch(function(error) {
				logger.error('saving result', error, true);
			});
		})
		.catch(function(error) {
			logger.error('Feeds error', error);
		});
};
