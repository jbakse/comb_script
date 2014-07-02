'use strict';

var Region = require('./Region.js');
var util = require('../util.js');

module.exports = Document;

//////////////////////////////////////////////////////////////////////
// Document

function Document(_data, _parent) {
	this.waitList = [];
	Region.call(this, _data, _parent);
	this.type = "Document";



	this.typeProperties.boundsStyle.strokeColor = '#999999';

	this.regions = util.collectTree(this, "children");


}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;


Document.prototype.onMouseEnter = function() {};
Document.prototype.onMouseLeave = function() {};
Document.prototype.onClick = function() {};

