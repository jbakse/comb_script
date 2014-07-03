var _ = require('underscore');
var regionTypes = require('./region/regionTypes.js');
var settings = require('./settings.js');
var util = require('./util.js');
var UI = require('./UI.js');
var Parser = require('./Parser.js');

module.exports = new Controller();


function Controller() {
	this.doc = null;
	this.selectedRegions = [];
	this.hoverRegion = null;
}

Controller.prototype.redrawPreview = function(_region) {
	this.doc.setStyle("default", true);

	_(this.selectedRegions).each( function(_region) {
		_region.setStyle("highlight");
	});
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


			UI.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
			UI.editor.editor.focus();
			UI.editor.editor.gotoLine(_region.editorProperties.firstLine, 1000, true);

			self.hoverRegion = undefined;
			self.selectedRegions = [_region];
			
			self.redrawPreview();

			$.Topic("UI/updateInspector").publish([_region]);
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

	var ancestors = _(regions).map(function(r) { return r.getAncestors(); });
	ancestors = _(ancestors).flatten();

	regions = _(regions).difference(ancestors);


	// if (this.selectedRegions.length === 1 && _(regions).contains(this.selectedRegions[0])) {
	// 	// user clicked item then moved cursor within items defintion, don't expand selection
	// 	return;
	// }


	if (!regions || regions.length === 0){
		console.error("couldn't find the region");
		return;
	}

	var r = regions[regions.length - 1];
	UI.editor.highlightLines( r.editorProperties.firstLine,  r.editorProperties.lastLine,  r.type.toLowerCase());


	this.selectedRegions = regions;

	$.Topic("UI/updateInspector").publish(regions);
	this.redrawPreview();

};

Controller.prototype.loadYAMLfromURL = function() {
	var self = this;
	$.ajax({
		url: settings.fileURL,

		success: function(_data) {
			UI.editor.setText(_data);
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

	var context = settings.getRootContext();
	context.matrix.translate(settings.exportWidth * 0.5, settings.exportHeight * 0.5);
	context.matrix.scale(this.doc.properties.scale || 1);

	var currentProject = paper.project;

	var exportProject = new paper.Project($('<canvas width="' + settings.exportWidth + '" height="' + settings.exportHeight + '" />').get(0));
	exportProject.activate();


	this.doc.build(context);
	exportProject.activeLayer.style = {
		strokeColor: "blue",
		strokeWidth: 1,
		fillColor: null
	};
	var svg = exportProject.exportSVG({
		asString: true
	});

	currentProject.activate();

	util.downloadDataUri('export.svg', 'data:image/svg+xml;base64,' + btoa(svg));
};


Controller.prototype._updateYAML = function(_yaml) {
	console.log("update yaml");
	
	data = Parser.parse(_yaml);
	if (!data) return;


	this.doc = new regionTypes.Document();
	this.doc.loadData(data);

	self = this;

	$.whenAll.apply($, this.doc.waitList).always( function () { 
		if (self.doc.waitList.length) UI.log.appendSuccess("Subdocuments Loaded");
		UI.preview.setDocument(self.doc);
	} );

	UI.log.appendSuccess("Success");



};
