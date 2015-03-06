require('./jquery_util.js');
var _ = require('underscore/underscore.js');
var Mustache = require('mustache');
var language = require('./language.js');
var Preview = require('./ui/Preview.js');
var regionTypes = require('./region/regionTypes.js');
var Parser = require('./Parser.js');

console.log("Hello, Docs!");
function populateTemplates() {
	// prepare data
	var data = {};

	data.regionTypes = _(language.regionTypes).values();
	_(data.regionTypes).each(function(type){
		type.required_properties = _(type.properties).filter( function(prop) {
			return prop.required && prop.required === true;
		});
		
		type.properties = _(type.properties).difference(type.required_properties);
			
		if (type.extends && language.regionTypes[type.extends]) {
			type.inherited_properties = language.regionTypes[type.extends].properties;
		}
	});


	var menuTemplate = $('#template-menu').html();
	Mustache.parse(menuTemplate); // optional, speeds up future uses
	var menuRendered = Mustache.render(menuTemplate, data);
	$('#template-menu').html(menuRendered);


	var template = $('#template-regionTypes').html().replace(/&gt;/g, ">");
	var propertyTemplate = $('#template-property').html();
	var rendered = Mustache.to_html(template, data, {prop: propertyTemplate});
	$('#template-regionTypes').html(rendered);


	//enable property clicking

	//close inheretid properties
	$(".properties.inherited-properties li").addClass("closed");

	//make properties clickable
	$(".property-name").css("cursor", "pointer");
	$(".property-name").click(
		function() {
			$(this).parent().toggleClass("closed");
		}
	);
}


function renderExamples() {
	$('pre').each( function(_index, _element) {
		var source = $(_element).text();
		// console.log("source", source);
		var data = Parser.parse(source);
		if (!data) return;

		data.properties.width = data.properties.width || 525;
		data.properties.height = data.properties.height || 225;

		var doc = new regionTypes.Document();
		doc.loadData(data);
		

		var canvas = $("<canvas>")
			.addClass("example")
			.attr("id", "example-"+_index)
			.attr("width", doc.properties.width + 25)
			.attr("height", doc.properties.height + 25);


		var preview = new Preview();
		preview.init(canvas.get(0));

		// UI.preview.init($('#paper-canvas').get(0));
		preview.setDocument(doc);


		canvas.insertBefore(_element);
	});

	


	$('pre').addClass('prettyprint');
	prettyPrint();
}

$(function() {

	
	populateTemplates();
	renderExamples();

	


	
});
