'use strict';

var logger = module.exports = require('ournet.logger');

if (process.env.NODE_ENV === 'production') {
	logger.loggly({
		tags: ['feeds-reader', 'app'],
		json: true
	});
	logger.removeConsole();
}
