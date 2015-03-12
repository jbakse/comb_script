'use strict';



module.exports = Menu;

////////////////////////////////////////////////////////////////////
// Menu

function Menu() {
	this.element = null;
}

Menu.prototype.init = function(_element) {
	this.element = _element;
	// file
	this.addClickCommand("#button-connect-google-drive", "UI/command/connectGoogleDrive");
	this.addClickCommand("#button-new", "UI/command/new");
	this.addClickCommand("#button-open", "UI/command/open");
	this.addClickCommand("#button-save", "UI/command/save");
	this.addClickCommand("#button-save-as", "UI/command/saveAs");
	this.addClickCommand("#button-svg-export", "UI/command/exportSVG");
	

	// view
	this.addToggleCommand("#button-view-frame", "UI/command/toggleViewPreview");
	this.addToggleCommand("#button-view-build", "UI/command/toggleViewBuild");
	this.addToggleCommand("#button-view-export", "UI/command/toggleViewExport");
	this.addToggleCommand("#button-zoom-in", "UI/command/zoomIn");
	this.addToggleCommand("#button-zoom-out", "UI/command/zoomOut");


	$('[data-example]').click ( function (_e) {
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
	var state = $(_element).hasClass("on");
	// $(_element).append('<img class="strike-through" src="images/menu_icons/icon_off.svg">');
	$(_element).click(
		function() {
			state = !state;
			$(_element).toggleClass("on", state);
			$.Topic(_command).publish(state);
		}
	);

	$.Topic(_command).publish(state);
};
