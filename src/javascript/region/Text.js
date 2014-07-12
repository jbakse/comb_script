'use strict';


var _ = require('underscore');
var Region = require('./Region.js');


module.exports = Text;

var font;

/* global __dirname */
// using browserify and brfs to inline the svg data.
// https://github.com/substack/brfs
var fs = require('fs');
var font = fs.readFileSync(__dirname + '/../../images/fonts/sutton_30x60.svg', 'utf8');



// $.ajax({
// 	url: "images/fonts/sutton_30x60.svg",
// 	success: function(_data) {
// 		font = _data;
// 	}
// });

var font_height = 60;
var font_width = 30;
var font_spacing = 15;

var glyphMap = {
'&': "char-ampersand",
'!': "char-exclamation",
'.': "char-period",
'?': "char-question",
';': "char-semicolon",
':': "char-colon",
'~': "char-tilde",
',': "char-comma",
'’': "char-apostrophe",
'\'': "char-quote",
'"': "char-doublequote",
'-': "char-dash",
'9': "char-9",
'8': "char-8",
'7': "char-7",
'6': "char-6",
'5': "char-5",
'4': "char-4",
'3': "char-3",
'2': "char-2",
'1': "char-1",
'0': "char-0",
'z': "char-z",
'y': "char-y",
'x': "char-x",
'w': "char-w",
'v': "char-v",
'u': "char-u",
't': "char-t",
's': "char-s",
'r': "char-r",
'q': "char-q",
'p': "char-p",
'o': "char-o",
'n': "char-n",
'm': "char-m",
'l': "char-l",
'k': "char-k",
'j': "char-j",
'i': "char-i",
'h': "char-h",
'g': "char-g",
'f': "char-f",
'e': "char-e",
'd': "char-d",
'c': "char-c",
'b': "char-b",
'a': "char-a",
'Z': "char-Z",
'Y': "char-Y",
'X': "char-X",
'W': "char-W",
'V': "char-V",
'U': "char-U",
'T': "char-T",
'S': "char-S",
'R': "char-R",
'Q': "char-Q",
'P': "char-P",
'O': "char-O",
'N': "char-N",
'M': "char-M",
'L': "char-L",
'K': "char-K",
'J': "char-J",
'I': "char-I",
'H': "char-H",
'G': "char-G",
'F': "char-F",
'E': "char-E",
'D': "char-D",
'C': "char-C",
'B': "char-B",
'A': "char-A",
};


//////////////////////////////////////////////////////////////////////
// Text

function Text(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Text";
	this.isShape = true;
}

Text.prototype = Object.create(Region.prototype);
Text.prototype.constructor = Text;

Text.prototype.drawBounds = function(_bounds) {
	var g = new paper.Group();

	var scale = this.properties.size / font_height;
	var position = new paper.Point(0, 0);
	if (this.properties.align == 'center') {
		position.x = -(this.properties.text.length * 0.5) * (font_width + font_spacing) * scale;
	}
	if (this.properties.align == 'right') {
		position.x = -(this.properties.text.length) * (font_width + font_spacing) * scale;
	}
	if (this.properties.vertical_align == 'center') {
		position.y = -(font_height * 0.5) * scale;
	}
	if (this.properties.vertical_align == 'bottom') {
		position.y = -(font_height) * scale;
	}

	_(this.properties.text).each(function(c, i) {
		if (c === ' ') return;

		//var glyphID = glyphMap[c.toLowerCase()] || 'char-period';
		var glyphID = glyphMap[c] || 'char-period';
		var glyphSVG = $("#"+glyphID, font).get(0);
		var glyph = new paper.Group().importSVG(glyphSVG, {
			expandShapes: true
		});

		glyph.scale(scale, new paper.Point(0,0));
		glyph.translate(position);
		glyph.translate(i * (font_width + font_spacing) * scale, 0);
		g.addChild(glyph);
	}, this);



	return g;
};


Text.prototype.drawBuild = function(_bounds) {
	return this.drawBounds(_bounds);
};
