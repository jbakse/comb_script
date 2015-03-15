'use strict';
// var math = require('mathjs/math.min.js');

var Region = require('./Region.js');
var util = require('../util.js');

module.exports = Document;

//////////////////////////////////////////////////////////////////////
// Document

function Document(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Document";
	this.waitList = [];

	this.properties.left = math.unit('0 cm');
	this.properties.top = math.unit('0 cm');
	this.properties.registration = "center";
}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;

