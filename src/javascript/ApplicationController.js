'use strict';

Error.stackTraceLimit = 100;

var language = require('./language.js');
var _ = require('underscore/underscore.js');


var settings = require('./Settings.js');
var util = require('./util.js');

var regionTypes = require('./region/regionTypes.js');

var Parser = require('./Parser.js');
var Context = require('./Context.js');

var Preview = require('./ui/Preview.js');
var Editor = require('./ui/Editor.js');
var Inspector = require('./ui/Inspector.js');
var Menu = require('./ui/Menu.js');
var log = require('./ui/Log.js').sharedInstance();

var googleDrive = require('./GoogleDrive.js');

module.exports = ApplicationController;





function ApplicationController() {
	console.log("hello, appcontroll");
	this.doc = null;
	this.selectedRegions = [];
	this.keySelection = null;
	this.hoverRegion = null;

	this.preview = new Preview();
	this.editor = new Editor();
	this.inspector = new Inspector();
	this.menu = new Menu();

	this.fileInfo = {};
}

ApplicationController.prototype.init = function(_element) {

	googleDrive.init();


	this.preview.init($('#paper-canvas').get(0));
	this.editor.init($('#editor-content').get(0));
	this.inspector.init($('#inspector').get(0), this);
	this.menu.init($('#menu').get(0));

	this.attachHandlers();

	$('div.split-pane').splitPane();
	var self = this;
	$('#right-side-inner > .split-pane-resize-shim').mousemove(function() {
		self.editor.resize();
	});

	this.loadYAMLfromURL(settings.fileURL);

};

ApplicationController.prototype.attachHandlers = function() {
	var self = this;
	$.Topic("File/onLoad").subscribe(_.bind(this.setYAML, this));

	$.Topic("UI/command/rebuild").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/command/exportSVG").subscribe(_.bind(this.exportSVG, this));
	$.Topic("UI/command/loadYAML").subscribe(_.bind(this.loadYAMLfromURL, this));

	$.Topic("UI/editor/onContentChange").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/editor/onLineChange").subscribe(_.bind(this.highlightRegionsForLine, this));


	$.Topic("region/onMouseEnter").subscribe(function(_region) {
		self.hoverRegion = _region;
		if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish([_region]);
		self.redrawPreview();
	});

	$.Topic("region/onClick").subscribe(function(_region) {
		self.hoverRegion = null;
		self.keySelection = _region;
		// $.Topic("UI/updateInspector").publish([_region]);
		self.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
		self.editor.gotoLine(_region.editorProperties.firstLine + 1, true);
	});

	$.Topic("region/onMouseLeave").subscribe(function(_region) {
		self.hoverRegion = undefined;
		if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish(self.selectedRegions);
		self.redrawPreview();
	});


	$(document).bind('keydown', function (event) {
		// keyCode 8 is delete / backspace
		if (event.keyCode === 8) { event.preventDefault(); }
	});
    

};

ApplicationController.prototype.redrawPreview = function(_region) {
	if (!this.doc) return;

	this.doc.setStyle("default", true);

	_(this.selectedRegions).each(function(_region) {
		_region.setStyle("selected");
	});

	if (this.keySelection) this.keySelection.setStyle("key");
	if (this.hoverRegion) this.hoverRegion.setStyle("hover");

	this.preview.redraw();
};


ApplicationController.prototype.highlightRegionsForLine = function(_line) {
	if (!this.doc) return;

	var regions = _(this.doc.getDecendants()).filter(function(_region) {
		return _region.editorProperties.firstLine <= (_line - 1) && _region.editorProperties.lastLine >= (_line - 1);
	});

	var ancestors = _(regions).map(function(r) {
		return r.getAncestors();
	});
	ancestors = _(ancestors).flatten();
	regions = _(regions).difference(ancestors);

	if (!regions || regions.length === 0) {
		// console.error("Couldn't find the region for line " + _line);
		return;
	}

	// if (this.selectedRegions.length === 1 && _(regions).contains(this.selectedRegions[0])) {
	// 	// user clicked item then moved cursor within items defintion, don't expand selection
	// 	return;
	// }

	this.selectedRegions = regions;
	if (!_(regions).contains(this.keySelection)) {
		this.keySelection = null;
	}
	if (this.selectedRegions.length === 1) {
		this.keySelection = this.selectedRegions[0];
	}

	var r = regions[0];
	this.editor.highlightLines(r.editorProperties.firstLine, r.editorProperties.lastLine, r.type.toLowerCase());

	$.Topic("UI/updateInspector").publish([this.keySelection]);

	this.redrawPreview();

};

ApplicationController.prototype.loadYAMLfromURL = function(_url) {
	if (!googleDrive.closeFile()) return false;

	var self = this;
	$.ajax({
		url: _url,

		success: function(_data) {
			self.setYAML(_data);
			googleDrive.setClean();
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


ApplicationController.prototype.setYAML = function(_yaml) {

	this.editor.setText(_yaml);

	//this.editor.gotoLine(1, true);
	//this.rebuild();
};


ApplicationController.prototype.rebuild = function() {
	try {
		log.clear();
		this._parseYAML(this.editor.getText());
		this.highlightRegionsForLine(this.editor.editor.selection.getCursor().row);
	}
	catch (e) {
		console.error("Error rebuilding YAML");
		console.error(e.stack);
	}
};


ApplicationController.prototype._parseYAML = function(_yaml) {
	// console.log("update yaml");

	try {
		var data = Parser.parse(_yaml);
		if (!data) return;

		this.doc = new regionTypes.Document();
		this.doc.loadData(data);

		console.log(this.doc);
		
	}
	catch (e) {
		log.appendException(e, "Exception loading document.");
		console.error("Exception loading document.");
		console.log(e.stack);
		// console.log("data", data);
		this.doc = null;
		return false;
	}

	if (this.doc.waitList.length) {
		log.appendError("Subdocuments are not currently supported.");
	}

	try {
		this.preview.setDocument(this.doc);
	}
	catch (e) {
		log.appendException(e, "Exception drawing document.");
		console.error("Exception drawing document.");
		console.log(e.stack);
	}


	log.appendSuccess("Success");
	return true;
};
