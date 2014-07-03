'use strict';
/* global ace */

var _ = require('underscore');
var Range = ace.require('ace/range').Range;
// var controller = require('./controller.js');
var settings = require('./settings.js');


module.exports.editor = new Editor();
module.exports.preview = new Preview();
module.exports.menu = new Menu();
module.exports.inspector = new Inspector();
module.exports.log = new Log();

////////////////////////////////////////////////////////////////////
// Editor

function Editor() {
	this.highlightMarker = null;
	this.editor = null;
	this.sendChangeEvents = true;
	this.sendChangeCursorEvents = true;
}

Editor.prototype.init = function(_element) {
	this.editor = ace.edit("editor");
	this.editor.setTheme("ace/theme/monokai");
	this.editor.getSession().setMode("ace/mode/yaml");
	this.editor.setShowInvisibles(false);
	this.editor.setShowPrintMargin(false);
	this.editor.setHighlightActiveLine(false);
	this.editor.getSession().on('change', _(this.onChange).bind(this));
	this.editor.getSession().selection.on('changeCursor', _(this.onChangeCursor).bind(this));


	this.editor.commands.addCommand({
		name: "Rebuild",
		bindKey: {
			win: "Ctrl-B|Ctrl-R",
			mac: "Command-B|Command-R"
		},
		// exec: _.bind(controller.rebuild, controller)
		exec: function(_e) {
			$.Topic("UI/command/rebuild").publish(_e);
		}
	});

};

Editor.prototype.resize = function() {
	this.editor.resize();
};

Editor.prototype.setText = function(_text) {
	this.sendChangeEvents = false;

	this.editor.setValue(_text);
	this.editor.clearSelection();
	this.editor.scrollToLine(0);
	this.sendChangeEvents = true;
	this.onChange();
};

Editor.prototype.getText = function() {
	return this.editor.getValue();
};

Editor.prototype.onChange = function(_e) {
	if (!this.sendChangeEvents) return;
	$.Topic("UI/onContentChange").publish(_e);
};



Editor.prototype.highlightLine = function(_line, _class) {
	this.highlightLines(_line, _line, _class);
};

Editor.prototype.highlightLines = function(_firstLine, _lastLine, _class) {
	_class = "highlight " + _class;

	this.editor.getSession().removeMarker(this.highlightMarker);

	this.highlightMarker = this.editor.session.addMarker(
		new Range(_firstLine, 0, _lastLine, 1), _class, "fullLine"
	);
};

Editor.prototype.gotoLine = function(line, focus)
{

	this.sendChangeCursorEvents = false;
	this.editor.gotoLine(line, 1000, true);
	this.sendChangeCursorEvents = true;

	$.Topic("UI/onLineChange").publish(line);

	if (focus) this.editor.focus();
};


var oldLine = 0;
Editor.prototype.onChangeCursor = function() {
	if (!this.sendChangeCursorEvents) return;
	var line = this.editor.selection.getCursor().row + 1;
	if (oldLine != line) {
		$.Topic("UI/onLineChange").publish(line);
		oldLine = line;
	}
};



////////////////////////////////////////////////////////////////////
// Preview

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;
	this.doc = null;

	

	var self = this;
	$.Topic("UI/command/toggleViewPreview").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.previewLayer.visible;
			}
			self.previewLayer.visible = _state;
			paper.view.update();
		}
	);
	$.Topic("UI/command/toggleViewBuild").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.buildLayer.visible;
			}
			self.buildLayer.visible = _state;
			paper.view.update();
		}
	);
	

}

Preview.prototype.init = function(_element) {
	paper.setup(_element);
	this.buildLayer = new paper.Layer();
	this.previewLayer = new paper.Layer();
};

Preview.prototype.setDocument = function(_doc) {
	this.doc = _doc;
	this._generate();
};

Preview.prototype._generate = function() {

	module.exports.log.appendMessage("generate");

	// set up default position
	var context = settings.getRootContext();
	context.matrix.translate(settings.previewCanvasWidth * 0.5, settings.previewCanvasHeight * 0.5);
	context.matrix.scale(this.doc.properties.scale || 1);
	context.matrix.scale(this.doc.properties.zoom || 1);




	this.buildLayer.remove();
	this.buildLayer = new paper.Layer();

	this.previewLayer.remove();
	this.previewLayer = new paper.Layer();

	paper.project.activeLayer = this.buildLayer;
	this.doc.build(context);
	this.buildLayer.style = {
		strokeScaling: false,
		// strokeColor: "#090",
		// strokeWidth: 1,
		fillColor: new paper.Color(0, 1, 1, 0.5)
	};


	paper.project.activeLayer = this.previewLayer;
	this.doc.preview(context);
 

	paper.view.update();




};

Preview.prototype.redraw = function() {
	paper.view.update();
};



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
};

Menu.prototype.addClickCommand = function(_element, _command){
	$(_element).click(
		function() {
			$.Topic(_command).publish();
		}
	);
};

Menu.prototype.addToggleCommand = function(_element, _command){
	var state = true;
	$(_element).append('<img class="strike-through" src="images/menu_icons/icon_off.svg">');
	$(_element).click(
		function() {
			state = !state;
			$(_element).toggleClass("off", state === false);
			$.Topic(_command).publish(state);
		}
	);
};



////////////////////////////////////////////////////////////////////
// Inspector

function Inspector() {
	this.element = null;
}

Inspector.prototype.init = function(_element) {
	this.element = _element;
	this.clear();
	$.Topic("UI/updateInspector").subscribe(_.bind(this.update, this));
};

Inspector.prototype.update = function(_regions) {
	// _region = this.controller && this.controller.hoverRegion || this.controller && this.controller.selectedRegion;

	$(this.element).empty();

	if (_regions.length === 0) return;
	if (_regions[0] === null) return;

	if (_regions.length > 1) {
		$(this.element).append("Multiple Selections");
		return;
	}

	var t = function(_term, _data) {
		return "<dt>" + _term + "</dt><dd>" + _data + "</dd>";
	};

	var _region = _regions[0];

	var _r = _region;
	var breadCrumbs = $('<ul class="breadcrumbs">');
	var item;
	while (_r) {
		item = $("<li>").text(_r.properties.name || _r.type);
		item.click(this.buildSelectRegionHandler(_r));
		breadCrumbs.prepend(item);
		_r = _r.parent;
	}

	$(this.element).append(breadCrumbs);
	$(this.element).append(t("Type", _region.type));
	$(this.element).append(t("Name", _region.properties.name || "unnamed"));
	$(this.element).append(t("Line", _region.editorProperties.firstLine || "-"));
	$(this.element).append(t("Bounds", _region.previewBoundsGroup.bounds || "{}"));
	$(this.element).append(t("Center", _region.previewBoundsGroup.bounds.center || "{}"));

};

Inspector.prototype.buildSelectRegionHandler = function(_region) {
	return function() {
		$.Topic("region/onClick").publish(_region);
	};
};

Inspector.prototype.clear = function(_element) {
	$(this.element).empty();
};


////////////////////////////////////////////////////////////////////
// Log

function Log() {
	this.parseErrorTemplate =
		_.template('<li class = "error"><span class="line">Line <%= mark.line %></span> <span class="message"><%= reason %></span></li>');

	this.debugTemplate =
		_.template('<li class = "debug"><span class="message"><%= message %></span></li>');

	this.successTemplate =
		_.template('<li class = "success"><span class="message"><%= message %></span></li>');

	this.messageTemplate =
		_.template('<li class = "message"><span class="message"><%= message %></span></li>');

	this.warningTemplate =
		_.template('<li class = "warning"><span class="message"><%= message %></span></li>');

	this.errorTemplate =
		_.template('<li class = "error"><span class="message"><%= message %></span></li>');
}

Log.prototype.clear = function(_message) {
	$("#log").empty();
};

function stringArguments(_arguments) {
	var args = Array.prototype.slice.call(_arguments);
	return args.join(" ");
}

Log.prototype.appendDebug = function() {
	$("#log").append(this.debugTemplate({
		message: stringArguments(arguments)
	}));
	var d = $('#log');
	d.scrollTop(d.prop("scrollHeight"));

};

Log.prototype.appendSuccess = function() {
	$("#log").append(this.successTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendMessage = function() {
	$("#log").append(this.messageTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendWarning = function() {
	$("#log").append(this.warningTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendError = function() {
	$("#log").append(this.errorTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendParseError = function(_YAMLException) {
	// console.log(_YAMLException);
	$("#log").append(this.parseErrorTemplate(_YAMLException));
	//todo add click to this
};
