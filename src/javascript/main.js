'use strict';

require('./jquery_util.js');

// var settings = require('./settings.js');
var ApplicationController = require('./ApplicationController.js');

function main() {
	var appController = new ApplicationController();
	appController.init();


	


	// UI.log.appendMessage("Loading " + settings.fileURL);
	// appController.loadYAMLfromURL(settings.fileURL);

	// UI.log.appendDebug("Initialized");
}


$(function() {
	main();
});


