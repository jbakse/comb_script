'use strict';

var language = require('./language.js');
var _ = require('underscore');

var settings = require('./settings.js');
var util = require('./util.js');

var regionTypes = require('./region/regionTypes.js');

var Parser = require('./Parser.js');
var Context = require('./Context.js');

var Preview = require('./ui/Preview.js');
var Editor = require('./ui/Editor.js');
var Inspector = require('./ui/Inspector.js');
var Menu = require('./ui/Menu.js');
var log = require('./ui/Log.js').sharedInstance();


module.exports = ApplicationController;


function ApplicationController() {
	this.doc = null;
	this.selectedRegions = [];
	this.keySelection = null;
	this.hoverRegion = null;

	this.preview = new Preview();
	this.editor = new Editor();
	this.inspector = new Inspector();
	this.menu = new Menu();

}

ApplicationController.prototype.init = function(_element) {
	this.preview.init($('#paper-canvas').get(0));
	this.editor.init($('#editor').get(0));
	this.inspector.init($('#inspector').get(0), this);
	this.menu.init($('#menu').get(0));

	this.attachHandlers();

	$('div.split-pane').splitPane();
	$('#right-side-inner > .split-pane-resize-shim').mousemove(function() {
		this.editor.resize();
	});
};



ApplicationController.prototype.attachHandlers = function() {
	var self = this;
	$.Topic("UI/command/rebuild").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/command/exportSVG").subscribe(_.bind(this.exportSVG, this));
	$.Topic("UI/onContentChange").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/onLineChange").subscribe(_.bind(this.onLineChange, this));

	$.Topic("UI/command/loadYAML").subscribe(_.bind(this.loadYAMLfromURL, this));


	$.Topic("region/onMouseEnter").subscribe(
		function(_region) {

			self.hoverRegion = _region;

			if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish([_region]);

			self.redrawPreview();
		}
	);

	$.Topic("region/onClick").subscribe(
		function(_region) {

			self.hoverRegion = null;
			self.keySelection = _region;

			// $.Topic("UI/updateInspector").publish([_region]);

			self.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
			self.editor.gotoLine(_region.editorProperties.firstLine + 1, true);
		}
	);

	$.Topic("region/onMouseLeave").subscribe(
		function(_region) {

			self.hoverRegion = undefined;
			if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish(self.selectedRegions);

			self.redrawPreview();
		}
	);
};

ApplicationController.prototype.redrawPreview = function(_region) {

	this.doc.setStyle("default", true);

	_(this.selectedRegions).each(function(_region) {
		_region.setStyle("selected");
	});

	if (this.keySelection) this.keySelection.setStyle("key");
	if (this.hoverRegion) this.hoverRegion.setStyle("hover");

	this.preview.redraw();
};


ApplicationController.prototype.onLineChange = function(_line) {
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
		console.error("Couldn't find the region for line " + _line);
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
	var self = this;
	$.ajax({
		url: _url,

		success: function(_data) {
			self.editor.setText(_data);
			self.editor.gotoLine(1, true);
		},

		fail: function(_data) {
			log.appendError("Couldn't retrieve YAML");
		},

		cache: false
	});
};

ApplicationController.prototype.rebuild = function() {
	log.clear();
	this._updateYAML(this.editor.getText());
	this.onLineChange(this.editor.editor.selection.getCursor().row);
};

ApplicationController.prototype.exportSVG = function() {
	log.appendMessage("Exporting SVG");

	var unitScale = language.unitScales[this.doc.properties.unit] || 1;
	
	var exportWidth = this.doc.properties.width * unitScale;
	var exportHeight = this.doc.properties.height * unitScale;
	var context = new Context();
	context.matrix.scale(unitScale);

	var currentProject = paper.project;

	var exportProject = new paper.Project($('<canvas width="' + exportWidth + '" height="' + exportHeight + '" />').get(0));
	exportProject.activate();
	this.doc.build(context);
	exportProject.activeLayer.style = settings.exportStyle;
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


ApplicationController.prototype._updateYAML = function(_yaml) {
	// console.log("update yaml");

	try {
		var data = Parser.parse(_yaml);
		if (!data) return;
		this.doc = new regionTypes.Document();
		this.doc.loadData(data);
		this.doc.properties.left = 0;
		this.doc.properties.top = 0;
		this.doc.properties.registration = "center";
		
		// console.log(this.doc);

		var self = this;

		$.whenAll.apply($, this.doc.waitList).always(function() {
			if (self.doc.waitList.length) log.appendSuccess("Subdocuments Loaded");
			self.preview.setDocument(self.doc);
		});

		log.appendSuccess("Success");
	}
	catch (_e) {
		log.appendException(_e, "Unable to parse or render this script.");
		throw(_e);
	}


};
