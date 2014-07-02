var _ = require('underscore');
var Mustache = require('mustache');

console.log(Mustache);
$(function() {

	var regionTypes = _(language).values();

	_(regionTypes).each(function(type){
		type.required_properties = _(type.properties).filter( function(prop) {
			return prop.required && prop.required === true;
		});
		
		type.properties = _(type.properties).difference(type.required_properties);
		
		if (type.extends && language[type.extends]) {
			type.inherited_properties = language[type.extends].properties;
		}
	});

	console.log(regionTypes);

	var data = {
		regionTypes: regionTypes
	};


	var template = $('#template-regionTypes').html().replace(/&gt;/g, ">");
	var propertyTemplate = $('#template-property').html();
	var rendered = Mustache.to_html(template, data, {prop: propertyTemplate});
	$('#template-regionTypes').html(rendered);

	var menuTemplate = $('#template-menu').html();
	Mustache.parse(menuTemplate); // optional, speeds up future uses
	var menuRendered = Mustache.render(menuTemplate, data);
	$('#template-menu').html(menuRendered);


	$('pre').addClass('prettyprint');
	prettyPrint();

});
