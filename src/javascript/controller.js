var _ = require('underscore');
var Region = require('./Region.js');
var settings = require('./settings.js');
var util = require('./util.js');
var UI = require('./UI.js');

module.exports = new Controller();


function Controller() {
	this.doc = null;
	this.selectedRegion = null;
	this.hoverRegion = null;
}

Controller.prototype.redrawPreview = function(_region) {
	this.doc.setStyle("default", true);

	if (this.selectedRegion) this.selectedRegion.setStyle("highlight");
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
			if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish(_region);

			self.redrawPreview();

		}
	);

	$.Topic("region/onClick").subscribe(
		function(_region) {
			self.hoverRegion = undefined;
			self.selectedRegion = _region;
			$.Topic("UI/updateInspector").publish(_region);

			self.redrawPreview();

			UI.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
			UI.editor.editor.gotoLine(_region.editorProperties.firstLine, 1000, true);
			UI.editor.editor.focus();
		}
	);

	$.Topic("region/onMouseLeave").subscribe(
		function(_region) {

			self.hoverRegion = undefined;
			if (settings.inspectOnHover) $.Topic("UI/updateInspector").publish(self.selectedRegion);

			self.redrawPreview();
		}
	);
};

Controller.prototype.onLineChange = function(_line) {
	if (!this.doc) return;

	_region = _(this.doc.regions).find(function(_region) {
		return _region.editorProperties.firstLine <= _line && _region.editorProperties.lastLine >= _line;
	});

	if (!_region) {
		UI.editor.highlightLines(1, 1);
		this.selectedRegion = undefined;
	}
	else {
		UI.editor.highlightLines(_region.editorProperties.firstLine, _region.editorProperties.lastLine, _region.type.toLowerCase());
		this.selectedRegion = _region;
	}

	$.Topic("UI/updateInspector").publish(_region);
	this.redrawPreview();

};

Controller.prototype.loadYAMLfromURL = function() {
	var self = this;
	$.ajax({
		url: settings.fileURL,

		success: function(_data) {
			UI.editor.setText(_data);
			self._updateYAML(_data);
		},

		fail: function(_data) {
			UI.appendError("Couldn't retrieve YAML");
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

	util.downloadDataUri({
		data: 'data:image/svg+xml;base64,' + btoa(svg),
		filename: 'export.svg'
	});
};


Controller.prototype._injectYAML = function(_yaml) {

	var lines = _yaml.split("\n");
	var lastLine = lines.length;
	// todo language file
	var targets = ["region:", "rectangle:", "ellipse:", "region_grid:"];

	for (var i = lines.length - 1; i >= 0; i--) {
		var isTarget = false;
		for (var t = 0; t < targets.length; t++) {
			if (lines[i].indexOf(targets[t]) >= 0) {
				isTarget = true;
				break;
			}
		}

		if (isTarget) {
			var whitespace = /^(\s*)/.exec(lines[i])[1];
			var editorProperties = {
				firstLine: i + 1,
				lastLine: lastLine + 1
			};
			var injection = whitespace + "    " + "editor_properties: " + JSON.stringify(editorProperties);
			lines.splice(i + 1, 0, injection);
			lastLine = i - 1;
		}
	}


	return lines.join("\n");


};

Controller.prototype._updateYAML = function(_yaml) {

	UI.log.appendMessage("Parsing YAML");

	_yaml = this._injectYAML(_yaml);
	var yamlData;

	try {
		yamlData = jsyaml.safeLoad(_yaml);
	}
	catch (e) {
		return UI.log.appendParseError(e);
	}
	if (typeof yamlData !== "object") return UI.log.appendError("Couldn't parse YAML.");

	UI.log.appendSuccess("Success");

	if (!yamlData.properties) yamlData.properties = {};

	this.doc = new Region.Document(yamlData);

	UI.preview.setDocument(this.doc);



};
