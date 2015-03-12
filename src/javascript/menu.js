'use strict';

require('./jquery_util.js');

// var ApplicationController = require('./ApplicationController.js');

function setupMenuItems() {

	$(".menu-label").mousedown(
		function() {
			$(this).parent().toggleClass("open");
		}
	);

	$(document).mousedown(
		function(e) {
			$(".menu-item").each( function(i, item){
				if($(e.target).closest('.menu-item')[0] !== item) {
					$(item).removeClass("open");
				}
			});
		}
	);
}

$(function() {
	setupMenuItems();
});
