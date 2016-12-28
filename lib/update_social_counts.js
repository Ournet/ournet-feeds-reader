'use strict';

var utils = require('./utils');
var logger = require('./logger');
var Promise = utils.Promise;
var socialCounts = require('social-counts');
var socialCountsAsync = Promise.promisify(socialCounts);
var Data = require('./data');

function setStorySocialCounts(culture, story) {
	var count = 0;
	return Data.webdata.access.webpages({
			culture: culture,
			where: {
				storyId: story.id
			},
			limit: 20,
			select: '_id host path'
		})
		.map(function(item) {
			var url = ['http://', item.host, item.path].join('');
			return socialCountsAsync(['facebook', 'vk', 'odnoklassniki'], url)
				.then(function(counts) {
					// console.log(url, counts);
					for (var prop in counts) {
						if (counts[prop] > 0) {
							count += counts[prop];
						}
					}
				})
				.delay(1000 * 2)
				.catch(function(error) {
					logger.error(error);
				});
		})
		.then(function() {
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
