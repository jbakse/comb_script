'use strict';

var Region = require('./Region.js');
var util = require('../util.js');

module.exports = Document;

//////////////////////////////////////////////////////////////////////
// Document

function Document(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Document";
	this.waitList = [];
}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;

