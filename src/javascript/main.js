'use strict';

////////////////////////////////////////////////////////////////////
// main.js
//
// entry point for application

require('./jquery_util.js');

var ApplicationController = require('./ApplicationController.js');

$(function() {
	var appController = new ApplicationController();
	appController.init();
});


