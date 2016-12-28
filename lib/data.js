'use strict';

var News = require('ournet.data.news');

var news = {
	access: News.getAccessService(),
	control: News.getControlService()
};

exports.websites = news;

exports.webdata = {
	access: news.access,
	control: news.control,
	createImageId: News.createImageId,
	createWebPageId: News.createWebPageId,
	createWebPageUniqueName: News.createWebPageUniqueName,
	search: News.Search
};
