var Region = require('./Region.js');
var settings = require('./settings.js');
var util = require('./util.js');
var UI = require('./UI.js');


module.exports = new Controller();




function Controller() {
	this.doc = null;

	$.Topic( "region/mouseEnter" ).subscribe( function(){ UI.log.appendDebug("mouseEnter");} );
	$.Topic( "region/mouseLeave" ).subscribe( function(){ UI.log.appendDebug("mouseLeave");} );
}

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
				line: i + 1
			};
			var injection = whitespace + "    " + "editor_properties: " + JSON.stringify(editorProperties);
			lines.splice(i + 1, 0, injection);
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
	if (typeof yamlData !== "object") return UI.appendError("Couldn't parse YAML.");


	UI.log.appendSuccess("Success");

	this.doc = new Region.Document(yamlData);

	UI.preview.setDocument(this.doc);





};
