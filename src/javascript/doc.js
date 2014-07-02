var _ = require('underscore');
var Mustache = require('mustache');

console.log(Mustache);
$(function() {

	var data = {
		regionTypes: _(language).values()
	};


	var template = $('#regionTypes').html();
	Mustache.parse(template); // optional, speeds up future uses
	var rendered = Mustache.render(template, data);
	$('#regionTypes').html(rendered);

	var template = $('#menu').html();
	Mustache.parse(template); // optional, speeds up future uses
	var rendered = Mustache.render(template, data);
	$('#menu').html(rendered);


});
