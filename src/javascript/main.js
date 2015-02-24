'use strict';

require('./jquery_util.js');

var ApplicationController = require('./ApplicationController.js');

function main() {
	var appController = new ApplicationController();
	appController.init();
}


$(function() {
	main();
});


