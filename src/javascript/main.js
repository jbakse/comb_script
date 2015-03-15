'use strict';

require('./jquery_util.js');

var ApplicationController = require('./ApplicationController.js');

$(function() {
	var appController = new ApplicationController();
	appController.init();
});


