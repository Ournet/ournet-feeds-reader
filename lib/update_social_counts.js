'use strict';

var utils = require('./utils');
var logger = require('./logger');
var Promise = utils.Promise;
var socialCounts = require('social-counts');
var socialCountsAsync = Promise.promisify(socialCounts);
var Data = require('./data');

function setStorySocialCounts(culture, story) {
	var totalShares = 0;
	var totalLinks = 0;
	return Data.webdata.access.webpages({
			culture: culture,
			where: {
				storyId: story.id
			},
			limit: 10,
			select: '_id host path'
		})
		.map(function(item) {
			var url = ['http://', item.host, item.path].join('');
			return socialCountsAsync(['facebook'], url)
				.then(function(counts) {
					totalLinks++;
					// console.log(url, counts);
					for (var prop in counts) {
						if (counts[prop] > 0) {
							totalShares += counts[prop];
						}
					}
				})
				.delay(1000 * 2)
				.catch(function(error) {
					logger.error(error);
				});
		})
		.then(function() {
			const count = parseInt(totalShares / totalLinks);
			if (count > 0 && (!story.countShares || story.countShares < count)) {
				// console.log('setSocialCounts', story.id, count);
				return Data.webdata.control.updateStory({
					id: story.id,
					country: culture.country,
					lang: culture.lang,
					countShares: count
				});
			}
		});
}

module.exports = function(culture) {

	return Data.webdata.access.stories({
		culture: culture,
		order: '-createdAt',
		select: '_id countShares',
		limit: 20
	}).each(function(story) {
		return setStorySocialCounts(culture, story);
	});

};
