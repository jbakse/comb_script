var _ = require('underscore');
var Mustache = require('mustache');

console.log(Mustache);
$(function() {

	var template = $('#regionTypes').html();
	Mustache.parse(template); // optional, speeds up future uses

	var data = {
		regionTypes: _(language).values()
	};
	console.log(template, data);
	var rendered = Mustache.render(template, data);
	$('#regionTypes').html(rendered);


});
