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
	this.addClickCommand("#button-zoom-in", "UI/command/zoomIn");
	this.addClickCommand("#button-zoom-out", "UI/command/zoomOut");
	this.addClickCommand("#zoom-level", "UI/command/zoomActualFit");

	Mousetrap.bindGlobal('command+=', function() {
		$.Topic("UI/command/zoomIn").publish();
		return false;
	});

	Mousetrap.bindGlobal('command+-', function() {
		$.Topic("UI/command/zoomOut").publish();
		return false;
	});

	Mousetrap.bindGlobal('command+0', function() {
		$.Topic("UI/command/zoomActualFit").publish();
		return false;
	});

	Mousetrap.bindGlobal('command+u', function() {
		$.Topic("UI/command/changeInspectorUnit").publish();
		return false;
	});

	$('[data-example]').click ( function (_e) {
		// console.log("_e", _e, this, $(this).data('example'));
		$.Topic("UI/command/loadYAML").publish($(this).data('example'));
	});

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


	$(".menu-dropdown").click (  function(e) {
		if (e.target.tagName !== "SELECT") {
			$(this).closest('.menu-item').removeClass("open");
		}
	});

	$(".menu-dropdown").change ( function(e) {
		$(this).closest('.menu-item').removeClass("open");
	});


	//options drop downs
	$("#unit-select").change(
		function() {
			console.log("unit select change");
			$.Topic("UI/command/changeInspectorUnit").publish($(this).val());
		}
	);

	$("#on-selection").change(
		function() {
			//DISPATCH MESSAGE HERE
			//$.Topic("UI/command/changeInspectorUnit").publish($(this).val());
		}
	);
	

};



Menu.prototype.addClickCommand = function(_element, _command) {
	$(_element).click(
		function() {
			$.Topic(_command).publish();
		}
	);
};

Menu.prototype.addToggleCommand = function(_element, _command) {
	var isOn = $(_element).hasClass("on");
	// $(_element).append('<img class="strike-through" src="images/menu_icons/icon_off.svg">');
	$(_element).click(
		function() {
			isOn = !isOn;
			$(_element).toggleClass("on", isOn);
			$(_element).toggleClass("off", !isOn);
			$.Topic(_command).publish(isOn);
		}
	);

	$.Topic(_command).publish(isOn);
};
