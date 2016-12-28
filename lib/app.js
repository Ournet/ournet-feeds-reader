'use strict';

require('dotenv').load();

var logger = require('./logger');
var utils = require('./utils');
var Promise = utils.Promise;
var feedsManager = require('./feeds_manager');
var updateSocialCounts = require('./update_social_counts');
var cultures = process.env.CULTURES.split(';');
var date = new Date();

logger.warn('CULTURES', cultures);

function endApp(error) {
	logger.warn('RUN TIME: ' + (Date.now() - date.getTime()) / 1000 / 60);
	if (error) {
		logger.error('Caught exception', error);
	}
	logger.warn('END!!!');
	setTimeout(function() {
		/*eslint no-process-exit: 0*/
		process.exit(0);
	}, 5 * 1000);
}

logger.warn('START');

Promise.resolve(cultures).map(function(culture) {
		logger.log('processing culture', culture);
		culture = culture.split(' ');
		var options = {
			country: culture[0],
			lang: culture[1]
		};

		return feedsManager.process(options)
			.then(function() {
				return updateSocialCounts(options);
			});
	}, {
		concurrency: parseInt(process.env.CONCURRENCY) || 1
	})
	.timeout(1000 * 60 * 55)
	.finally(endApp);

process.on('uncaughtException', endApp);
