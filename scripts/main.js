//'use strict';

var _ = require('underscore');

var Region = require('./Region.js');
var Context = require('./Context.js');

var file_url = "../yaml/simple.yaml";

// kick
$( function() {
	main();
});

function main() {
	console.log("Hello, Main!");

	// p1 = new paper.Point(10, 10);
	// p2 = new paper.Point(20, 20);
	
	// console.log(p1.add(p2), p1, p2);

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
	console.log("Loaded YAML");

	var yamlData = jsyaml.load(_yaml);
	console.log(yamlData);

	var d = new Region.Document(yamlData);

	console.log("Tree");
	console.log(d.tree());

	var context = new Context(
					new paper.Point(200, 200), 
				    new paper.Rectangle(new paper.Point(-200,-200), new paper.Point(200, 200))
				    );
	

	

	
	output = d.build(context);

	var outputLayer = new paper.Layer();
	_.each(output, function(path) {
		outputLayer.addChild(path);
		outputLayer.strokeColor = "black";
		outputLayer.fillColor = new paper.Color(1, 1, 0, 0.1);

	});


	

	$("#paper-svg").get(0).appendChild(paper.project.exportSVG());

	d.preview(context);



	paper.view.zoom = 1;
	paper.view.center = new paper.Point(200, 200);
	paper.view.update();
}







	// region = new Region();
	// console.log(region);




	// var r1 = new paper.Rectangle(new paper.Point(10, 10), new paper.Size(100, 100));
	// var p1 = new paper.Path.Ellipse(r1);
	// p1.strokeColor = 'red';

	// paper.view.draw();
