'use strict';

module.exports = Menu;

////////////////////////////////////////////////////////////////////
// Menu

function Menu() {
	this.element = null;
}

Menu.prototype.init = function(_element) {
	this.element = _element;
	this.addClickCommand("#button-svg-export", "UI/command/exportSVG");
	this.addToggleCommand("#button-view-frame", "UI/command/toggleViewPreview");
	this.addToggleCommand("#button-view-build", "UI/command/toggleViewBuild");
	this.addToggleCommand("#button-view-export", "UI/command/toggleViewExport");
	this.addClickCommand("#button-yaml-open", "UI/command/openYAML");
	this.addClickCommand("#button-yaml-new", "UI/command/newYAML");
	this.addClickCommand("#button-yaml-save", "UI/command/saveYAML");

	$('.example-link').click ( function (_e) {
		// console.log("_e", _e, this, $(this).data('example'));
		$.Topic("UI/command/loadYAML").publish($(this).data('example'));
	});

};

Menu.prototype.addClickCommand = function(_element, _command) {
	$(_element).click(
		function() {
			$.Topic(_command).publish();
		}
	);
};

Menu.prototype.addToggleCommand = function(_element, _command) {
	var state = !$(_element).hasClass("off");
	$(_element).append('<img class="strike-through" src="images/menu_icons/icon_off.svg">');
	$(_element).click(
		function() {
			state = !state;
			$(_element).toggleClass("off", !state);
			$.Topic(_command).publish(state);
		}
	);

	$.Topic(_command).publish(state);
};
