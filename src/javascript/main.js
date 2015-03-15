'use strict';

require('./jquery_util.js');

var File = require('./File.js');
File.test();

var ApplicationController = require('./ApplicationController.js');

$(function() {
	var appController = new ApplicationController();
	appController.init();
});


