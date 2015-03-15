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
// - sycronizing editor and file
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

	$.Topic("UI/command/loadYAML").subscribe(_.bind(this.loadYAMLfromURL, this));
	$.Topic("UI/command/exportSVG").subscribe(_.bind(this.exportSVG, this));


	$.Topic("Region/mouseEntered").subscribe(function(_region) {
		self.selection.hover = _region;
		$.Topic("App/selectionChanged").publish(self.selection);
	});

	$.Topic("Region/clicked").subscribe(function(_region) {
		self.selection.hover = null;
		self.selection.key = _region;
		self.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
		self.editor.gotoLine(_region.editorProperties.firstLine + 1, true);
		self.selectRegionsForLine(_region.editorProperties.firstLine + 1);
	});

	$.Topic("Region/mouseLeft").subscribe(function(_region) {
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






////////////////////////////////////////////////////////////////////
// event handlers

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





////////////////////////////////////////////////////////////////////
// managing selection

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





////////////////////////////////////////////////////////////////////
// import / export

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
// Document Building

ApplicationController.prototype.rebuild = function() {
	try {
		log.clear();
		this.doc = buildDocument(this.file.content);
		this._renderDocument();
		this.selectRegionsForLine(this.editor.editor.selection.getCursor().row);
	} catch (e) {
		console.error("Error rebuilding YAML", e.message);
		console.error(e.stack);
	}
};

ApplicationController.prototype._renderDocument = function() {
	try {
		this.preview.setDocument(this.doc);
	} catch (e) {
		log.appendException(e, "Exception drawing document. <br/>" + e.message);
		console.error("Exception drawing document.", e.message);
		console.error(e.stack);
		return false;
	}
	return true;
};

function buildDocument(_yaml) {

	// parse yaml -> javascript object
	var data = null;
	try {
		data = Parser.parse(_yaml);
	} catch (e) {
		log.appendException(e, "Exception parsing document. <br/>" + e.message);
		console.error("Exception parsing document.", e.message);
		console.error(e.stack);
	}


	// load javascript object into new document
	var doc = new regionTypes.Document();
	doc.loadData(data || {});

	if (doc.waitList.length) {
		log.appendError("Subdocuments are not currently supported.");
	}

	return doc;
}



