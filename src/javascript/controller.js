'use strict';

var _ = require('underscore');
var regionTypes = require('./region/regionTypes.js');
var settings = require('./settings.js');
var util = require('./util.js');
var UI = require('./UI.js');
var Parser = require('./Parser.js');
var Context = require('./Context.js');

module.exports = new Controller();


function Controller() {
	this.doc = null;
	this.selectedRegions = [];
	this.keySelection = null;
	this.hoverRegion = null;
}

Controller.prototype.redrawPreview = function(_region) {

	this.doc.setStyle("default", true);

	_(this.selectedRegions).each(function(_region) {
		_region.setStyle("selected");
	});

	if (this.keySelection) this.keySelection.setStyle("key");
	if (this.hoverRegion) this.hoverRegion.setStyle("hover");

	UI.preview.redraw();
};


Controller.prototype.attachHandlers = function() {
	var self = this;
	$.Topic("UI/command/rebuild").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/command/exportSVG").subscribe(_.bind(this.exportSVG, this));
	$.Topic("UI/onContentChange").subscribe(_.bind(this.rebuild, this));
	$.Topic("UI/onLineChange").subscribe(_.bind(this.onLineChange, this));


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

			UI.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
			UI.editor.gotoLine(_region.editorProperties.firstLine + 1, true);
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

Controller.prototype.onLineChange = function(_line) {
	if (!this.doc) return;

	var regions = _(this.doc.getDecendants()).filter(function(_region) {
		return _region.editorProperties.firstLine <= _line && _region.editorProperties.lastLine >= _line;
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
	UI.editor.highlightLines(r.editorProperties.firstLine, r.editorProperties.lastLine, r.type.toLowerCase());

	$.Topic("UI/updateInspector").publish([this.keySelection]);

	this.redrawPreview();

};

Controller.prototype.loadYAMLfromURL = function() {
	var self = this;
	$.ajax({
		url: settings.fileURL,

		success: function(_data) {
			UI.editor.setText(_data);
			UI.editor.gotoLine(1, true);
		},

		fail: function(_data) {
			UI.log.appendError("Couldn't retrieve YAML");
		},

		cache: false
	});
};

Controller.prototype.rebuild = function() {
	UI.log.clear();
	this._updateYAML(UI.editor.getText());
	this.onLineChange(UI.editor.editor.selection.getCursor().row);
};

Controller.prototype.exportSVG = function() {
	UI.log.appendMessage("Exporting SVG");

	var exportWidth = this.doc.properties.width;
	var exportHeight = this.doc.properties.height;
	var context = new Context();
	var currentProject = paper.project;

	var exportProject = new paper.Project($('<canvas width="' + exportWidth + '" height="' + exportHeight + '" />').get(0));
	exportProject.activate();
	this.doc.build(context);
	exportProject.activeLayer.style = settings.exportStyle;
	exportProject.activeLayer.translate(exportWidth * 0.5, exportHeight * 0.5);
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


Controller.prototype._updateYAML = function(_yaml) {
	console.log("update yaml");

	try {
		var data = Parser.parse(_yaml);
		if (!data) return;

		this.doc = new regionTypes.Document();
		this.doc.loadData(data);
		this.doc.properties.left = 0;
		this.doc.properties.top = 0;
		this.doc.properties.registration = "center";
		
		console.log(this.doc);

		var self = this;

		$.whenAll.apply($, this.doc.waitList).always(function() {
			if (self.doc.waitList.length) UI.log.appendSuccess("Subdocuments Loaded");
			UI.preview.setDocument(self.doc);
		});

		UI.log.appendSuccess("Success");
	}
	catch (_e) {
		UI.log.appendException(_e, "Unable to parse or render this script.");
		throw(_e);
	}


};
