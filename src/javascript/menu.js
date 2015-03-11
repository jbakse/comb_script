'use strict';

require('./jquery_util.js');

// var ApplicationController = require('./ApplicationController.js');

function setupMenuItems() {
	//setup event listeners to open the menus
	$(".menu-label").mousedown(
		function() {
			var isOpen = $(this).parent().hasClass("open");
			$(".menu-item").removeClass("open");
			$(this).parent().toggleClass("open", !isOpen);
		}
	);

	$(".menu-item").mousedown(
		function(e) {
			e.stopPropagation();
		}
	);

	$(document).mousedown(
		function(e) {
			$(".menu-item").removeClass("open");
		}
	);
}


$(function() {
	setupMenuItems();
});
