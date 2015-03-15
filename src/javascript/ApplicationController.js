'use strict';

Error.stackTraceLimit = 100;

var _ = require('underscore/underscore.js');

var language = require('./language.js');
var settings = require('./Settings.js');
var util = require('./util.js');
var regionTypes = require('./region/regionTypes.js');
var log = require('./ui/Log.js').sharedInstance();
var googleDrive = require('./GoogleDrive.js');

var File = require('./File.js');

var Preview = require('./ui/Preview.js');
var Editor = require('./ui/Editor.js');
var Inspector = require('./ui/Inspector.js');
var Menu = require('./ui/Menu.js');
require('./ui/FileInfo.js');

var Parser = require('./Parser.js');


////////////////////////////////////////////////////////////////////
// AppliationController
//
// Responsible for:
// - app set up
// - responding to UI commands and events
// - coordinating the change->parse->render flow
// - managing the region selection
//
// Published Topics:
// App/selectionChanged


module.exports = ApplicationController;

function ApplicationController() {
	console.log("Hello, Application!");
	this.doc = null;
	this.file = new File();

	this.selection = {
		regions: [],
		key: null,
		hover: null
	};

	this.preview = new Preview();
	this.editor = new Editor();
	this.inspector = new Inspector();
	this.menu = new Menu();
}

ApplicationController.prototype.init = function(_element) {

	$('div.split-pane').splitPane();

	this.preview.init($('#paper-canvas').get(0));
	this.editor.init($('#editor-content').get(0));
	this.inspector.init($('#inspector').get(0), this);
	this.menu.init($('#menu').get(0));

	this.attachHandlers();
	this.buildPicker();

	googleDrive.init();

	// open the default yaml file, unless a file request in query 
	if (!util.getParameterByName('state')) {
		this.loadYAMLfromURL(settings.fileURL);
	}
};

ApplicationController.prototype.attachHandlers = function() {
	var self = this;

	$.Topic("File/opened").subscribe(_.bind(this.fileOpened, this));
	$.Topic("File/closed").subscribe(_.bind(this.fileClosed, this));
	$.Topic("Editor/edited").subscribe(_.bind(this.editorEdited, this));
	$.Topic("Editor/lineChanged").subscribe(_.bind(this.editorLineChanged, this));

	$.Topic("UI/command/exportSVG").subscribe(_.bind(this.exportSVG, this));
	$.Topic("UI/command/loadYAML").subscribe(_.bind(this.loadYAMLfromURL, this));


	$.Topic("App/selectionChanged").subscribe(_.bind(this.selectionChanged, this));


	$.Topic("region/onMouseEnter").subscribe(function(_region) {
		self.selection.hover = _region;
		$.Topic("App/selectionChanged").publish(self.selection);
	});

	$.Topic("region/onClick").subscribe(function(_region) {
		self.selection.hover = null;
		self.selection.key = _region;
		self.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
		self.editor.gotoLine(_region.editorProperties.firstLine + 1, true);
		self.selectRegionsForLine(_region.editorProperties.firstLine + 1);
		// $.Topic("App/selectionChanged").publish(self.selection);
	});

	$.Topic("region/onMouseLeave").subscribe(function(_region) {
		self.selection.hover = undefined;
		$.Topic("App/selectionChanged").publish(self.selection);
	});

	$('#right-side-inner > .split-pane-resize-shim').mousemove(function() {
		self.editor.resize();
	});

	$(document).bind('keydown', function(event) {
		// keyCode 8 is delete / backspace, blocking browser default of navigating back
		if (event.keyCode === 8) {
			event.preventDefault();
		}
	});


	window.addEventListener("beforeunload", function(e) {
		if (!self.file.isDirty) return;
		var message = "The current file has unsaved changes. These changes will be discarded if you leave this page.";

		// For IE6-8 and Firefox prior to version 4
		(e || window.event).returnValue = message;
		// For Chrome, Safari, IE8+ and Opera 12+
		return message;
	});


};



//	selectionChanged - called when selection changes to update the preview with new styles
ApplicationController.prototype.selectionChanged = function(_region) {
	if (!this.doc) {
		console.error("selectRegionsForLine called without this.doc set");
		return;
	}

	this.doc.setStyle("default", true);

	_(this.selection.regions).each(function(_region) {
		_region.setStyle("selected");
	});

	if (this.selection.key) this.selection.key.setStyle("key");
	if (this.selection.hover) this.selection.hover.setStyle("hover");

	this.preview.redraw();
};

// selectRegionsForLine - finds the region specified around the current editor line, updates region selection
ApplicationController.prototype.selectRegionsForLine = function(_line) {
	if (!this.doc) {
		console.error("selectRegionsForLine called without this.doc set");
		return;
	}

	// find regions containing _line
	var regions = _(this.doc.getDecendants()).filter(function(_region) {
		return _region.editorProperties.firstLine <= (_line - 1) && _region.editorProperties.lastLine >= (_line - 1);
	});

	// collect ancestors of all those regions, flatten into single array
	var ancestors = _(regions).map(function(r) {
		return r.getAncestors();
	});
	ancestors = _(ancestors).flatten();

	// remove ancestors from list, leaving only bottom nodes
	regions = _(regions).difference(ancestors);

	// if we don't have any regions, just return
	if (!regions || regions.length === 0) {
		return;
	}

	// update our selection
	this.selection.regions = regions;
	if (!_(regions).contains(this.selection.key)) {
		this.selection.key = null;
	}
	if (this.selection.regions.length === 1) {
		this.selection.key = this.selection.regions[0];
	}

	// draw highlight in editor
	var r = regions[0];
	this.editor.highlightLines(r.editorProperties.firstLine, r.editorProperties.lastLine, r.type.toLowerCase());

	$.Topic("App/selectionChanged").publish(this.selection);
	

	

};

ApplicationController.prototype.loadYAMLfromURL = function(_url) {
	if (!this.file.close()) return false;

	$.ajax({
		url: _url,

		success: function(_data) {
			var file = new File(_url, _data);
			file.open();
		},

		fail: function(_data) {
			log.appendError("Couldn't retrieve YAML");
		},

		cache: false
	});
};

ApplicationController.prototype.fileOpened = function(_f) {
	this.file = _f;
	this.editor.setText(_f.content);
	this.rebuild();
};

ApplicationController.prototype.fileClosed = function(_f) {
	this.editor.setText("");
	new File().open();
};

ApplicationController.prototype.editorEdited = function(_content) {
	this.file.setContent(_content);
	this.rebuild();
};

ApplicationController.prototype.editorLineChanged = function(_line) {
	this.selectRegionsForLine(_line);
};

ApplicationController.prototype.rebuild = function() {
	try {
		log.clear();
		this._parseYAML(this.file.content);
		this._renderDocument();
		this.selectRegionsForLine(this.editor.editor.selection.getCursor().row);
	} catch (e) {
		console.error("Error rebuilding YAML", e.message);
		console.error(e.stack);
	}
};


/// todo end of Application controller class

ApplicationController.prototype._parseYAML = function(_yaml) {

	try {
		var data = Parser.parse(_yaml);

		this.doc = new regionTypes.Document();
		if (data) {
			this.doc.loadData(data);
		} else {
			this.doc.loadData({});
		}
	} catch (e) {
		log.appendException(e, "Exception loading document.");
		console.error("Exception loading document.", e.message);
		console.error(e.stack);
		this.doc = null;
		return false;
	}

	if (this.doc.waitList.length) {
		log.appendError("Subdocuments are not currently supported.");
	}

	return true;
};

ApplicationController.prototype._renderDocument = function() {

	try {
		this.preview.setDocument(this.doc);
	} catch (e) {
		log.appendException(e, "Exception drawing document.");
		console.error("Exception drawing document.", e.message);
		console.error(e.stack);
		return false;
	}
	return true;
};



ApplicationController.prototype.exportSVG = function() {
	log.appendMessage("Exporting SVG");

	var unitScale = language.unitScales[this.doc.properties.unit] || 1;

	var exportWidth = this.doc.properties.width * unitScale;
	var exportHeight = this.doc.properties.height * unitScale;


	var currentProject = paper.project;

	var exportProject = new paper.Project($('<canvas width="' + exportWidth + '" height="' + exportHeight + '" />').get(0));
	exportProject.activate();
	this.doc.build();


	var style = settings.exportStyle;

	if (this.doc.properties.cut_color) {
		style.strokeColor = new paper.Color(this.doc.properties.cut_color.red, this.doc.properties.cut_color.green, this.doc.properties.cut_color.blue);
	}
	if (this.doc.properties.cut_width) {
		style.strokeWidth = this.doc.properties.cut_width;
	}

	exportProject.activeLayer.style = style;
	// exportProject.activeLayer.translate(exportWidth * 0.5, exportHeight * 0.5);
	var svg = exportProject.exportSVG({
		asString: true
	});

	var blob = new Blob([svg], {
		type: 'image/svg+xml'
	});
	var svgURL = URL.createObjectURL(blob);
	util.downloadDataUri(this.doc.properties.name + '.svg', svgURL);

	currentProject.activate();
};



////////////////////////////////////////////////////////////////////
// TODO: Put somewhere else!

ApplicationController.prototype.buildPicker = function() {
	this.picker = new paper.Tool();
	var hoveredRegion = null;
	var mouseDownRegion = null;

	this.picker.onMouseDown = function(e) {
		mouseDownRegion = hoveredRegion;
	};

	this.picker.onMouseUp = function(e) {
		if (hoveredRegion && mouseDownRegion === hoveredRegion) {
			hoveredRegion.onClick();
		}
	};

	this.picker.onMouseMove = function(e) {
		// check just strokes first
		var hit = paper.project.hitTest(e.point, {
			tolerance: 5,
			stroke: true
		});

		// if the cursor isn't over a stroke, check for a fill
		if (hit === null) {
			hit = paper.project.hitTest(e.point, {
				tolerance: 5,
				fill: true
			});
		}

		var oldHoveredRegion = hoveredRegion;

		if (hit === null) {
			hoveredRegion = null;
		} else {
			hoveredRegion = hit.item.region;
		}

		if (oldHoveredRegion && oldHoveredRegion !== hoveredRegion) {
			oldHoveredRegion.onMouseLeave();
		}

		if (hoveredRegion && oldHoveredRegion !== hoveredRegion) {
			hit.item.region.onMouseEnter();
		}

	};
};
