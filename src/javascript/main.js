'use strict';

var _ = require('underscore');
var Region = require('./Region.js');
var Context = require('./Context.js');

var file_url = "../yaml/drawbot.yaml";

// kick
$(function() {
	main();
});

function main() {
	console.log("Hello, Main!");
	paper.setup($('#paper-canvas').get(0));


	$.ajax({
		url: file_url,
		success: function(data) {
			parseYAML(data);
		},
		cache: false
	});
}


function parseYAML(_yaml) {
	console.log("YAML Retrieved");


	// Load Document
	var yamlData = jsyaml.load(_yaml);
	console.log(yamlData);
	var doc = new Region.Document(yamlData);
	console.log("Tree");
	console.log(doc.tree());


	// Preview
	var context = new Context(
		new paper.Rectangle(
			new paper.Point(-200, -200), new paper.Point(200, 200)), 
			(new paper.Matrix()).translate(200, 200).scale(doc.properties.scale || 1)
	);
	

	
	

	// Build Vector
	var outputLayer = new paper.Layer();
	var output = doc.build(context);

	// _.each(output, function(path) {
	// 	outputLayer.addChild(path);
	// });

	outputLayer.style = {
			strokeScaling: false,
			strokeColor: "red",
			strokeWidth: 1,
			fillColor: "#FFFF00"
	};

	$("#paper-svg").get(0).appendChild(paper.project.exportSVG());
	outputLayer.visible = false;
	
	// Build Preview
	//using scale instead of zoom until paper.js has stable build with strokescaling
	context.matrix.scale(doc.properties.zoom || 1);
	var previewLayer = new paper.Layer();
	doc.preview(context);




	// paper.view.zoom = doc.properties.zoom || 1;
	paper.view.center = new paper.Point(200, 200);
	paper.view.update();
}
