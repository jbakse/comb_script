'use strict';

require('./jquery_util.js');
var _ = require('underscore/underscore.js');
var Mustache = require('mustache');
var language = require('./language.js');
var Preview = require('./ui/Preview.js');
var regionTypes = require('./region/regionTypes.js');
var Parser = require('./Parser.js');




function populateTemplates() {
	// prepare data
	var data = {};


	// collect information on region types
	data.regionTypes = _(language.regionTypes).values();
	_(data.regionTypes).each(function(type){
		
		//	find the required properties and store them for the template
		type.required_properties = _(type.properties).filter( function(prop) {
			return prop.required && prop.required === true;
		});
		
		//	find the optional properties and store them for the template
		type.optional_properties = _(type.properties).difference(type.required_properties);
		
		//	find the inherited properties and store them for the template
		if (type.extends && language.regionTypes[type.extends]) {
			type.inherited_properties = language.regionTypes[type.extends].properties;
		}
	});

	// find, render, and inject the menu template
	var menuTemplate = $('#template-menu').html();
	Mustache.parse(menuTemplate); // optional, speeds up future uses
	var menuRendered = Mustache.render(menuTemplate, data);
	$('#template-menu').html(menuRendered);


	// find, render, and inject the region-type api template
	var template = $('#template-regionTypes').html().replace(/&gt;/g, ">");
	var propertyTemplate = $('#template-property').html();
	var rendered = Mustache.to_html(template, data, {prop: propertyTemplate});
	$('#template-regionTypes').html(rendered);


	//enable property clicking
	$(".property-name").css("cursor", "pointer");
	$(".properties.inherited-properties li").addClass("closed");

	$(".property-name").click(
		function() {
			$(this).parent().toggleClass("closed");
		}
	);
}


function renderExamples() {
	$('.display.comb-script,.region-type pre').each( function(_index, _element) {
		
		// load and parse the source
		var source = $(_element).text();
		var data = Parser.parse(source);
		if (!data) return;

		// inject a height and width if not specified in the CombScript source 
		data.properties.width = data.properties.width || "525px";
		data.properties.height = data.properties.height || "225px";

		// build the document
		var doc = new regionTypes.Document();
		doc.loadData(data);
		
		// create the canvas
		var canvas = $("<canvas>")
			.addClass("example")
			.attr("id", "example-"+_index)
			.attr("width", doc.properties.width + 25)
			.attr("height", doc.properties.height + 25);
		canvas.insertBefore(_element);


		// use a combscript/preview to render the doc
		var preview = new Preview();
		preview.init(canvas.get(0));
		preview.setDocument(doc);
		preview.previewLayer.visible = true;
		paper.view.update();

		
	});

	

	// run google code prettify on the code examples
	$('pre').addClass('prettyprint');
	prettyPrint();
}





$(function() {
	populateTemplates();
	renderExamples();
});
