'use strict';

const utils = require('./utils');
const Promise = utils.Promise;
const debug = require('debug')('feedsreader:trending');
const Data = require('./data');

function saveTrendingTopics(culture, startDate) {
	debug('startDate', startDate);

	return Data.webdata.access.webpages({
			culture: culture,
			where: {
				createdAt: {
					$gt: startDate
				}
			},
			select: 'topics',
			limit: 500
		})
		.then(function(webpages) {
			// debug('got webpages', webpages);

			const topics = {};
			webpages.forEach(function(page) {
				if (page.topics && page.topics.length) {
					page.topics.forEach(topic => {
						if (!topics[topic.id]) {
							topics[topic.id] = topic;
						}
					});
				}
			});
			webpages = [];

			debug('topics', topics);

			const now = Date.now();
			const time24h = 1000 * 60 * 60 * 24;
			const ids = Object.keys(topics);
			return Promise.each(ids, function(id) {
				const topic = topics[id];
				return Promise.props({
					count24h: Data.webdata.access.countWebpages({
						culture: culture,
						where: {
							'topics._id': topic.id,
							createdAt: {
								$gt: now - time24h
							}
						}
					}),
					countPrev24h: Data.webdata.access.countWebpages({
						culture: culture,
						where: {
							'topics._id': topic.id,
							createdAt: {
								$gt: now - time24h * 2,
								$lt: now - time24h
							}
						}
					})
				}).then(function(counts) {
					debug('Saving topic trends', culture, counts);
					return Data.webdata.control.setTopicTrend(culture, topic, counts);
				});
			});

		});
}

module.exports = function(culture) {
	return Data.webdata.access.webpages({
			culture: culture,
			order: '-createdAt',
			select: 'createdAt',
			limit: 1
		})
		.then(function(startDate) {
			return function() {
				return saveTrendingTopics(culture, new Date(startDate[0].createdAt).getTime());
			};
		});
};
