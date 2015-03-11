'use strict';

require('./jquery_util.js');

// var ApplicationController = require('./ApplicationController.js');

function menu() {
	//setup event listeners to open the menus
	// alert("oi");
	$(".menu-item").click(
		function() {
			$(this).toggleClass("open");
		}
	);
}


$(function() {
	menu();
});
