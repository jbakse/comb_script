'use strict';

var _ = require('underscore/underscore.js');


module.exports = Log;

////////////////////////////////////////////////////////////////////
// Log

function Log() {

	this.debugTemplate =
		_.template('<li class = "debug"><span class="message"><%= message %></span></li>');

	this.successTemplate =
		_.template('<li class = "success"><span class="message"><%= message %></span></li>');

	this.messageTemplate =
		_.template('<li class = "message"><span class="message"><%= message %></span></li>');

	this.warningTemplate =
		_.template('<li class = "warning"><span class="message"><%= message %></span></li>');

	this.errorTemplate =
		_.template('<li class = "error"><span class="message"><%= message %></span></li>');

	this.parseErrorTemplate =
		_.template('<li class = "error"><span class="line">Line <%= mark.line + 1 %></span><br/><span class="message"><%= reason %></span></li>');

	this.exceptionTemplate =
		_.template('<li class = "error"><span class="message"><%= message %><br />Exception occurred:  <%= e.message %></span></li>');


}

var shared;
Log.sharedInstance = function() {
	shared = shared || new Log(); 
	return shared;
};

Log.prototype.clear = function(_message) {
	$("#log").empty();
};

function stringArguments(_arguments) {
	var args = Array.prototype.slice.call(_arguments);
	return args.join(" ");
}

Log.prototype.appendDebug = function() {
	$("#log").append(this.debugTemplate({
		message: stringArguments(arguments)
	}));
	var d = $('#log');
	d.scrollTop(d.prop("scrollHeight"));

};

Log.prototype.appendSuccess = function() {
	$("#log").append(this.successTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendMessage = function() {
	$("#log").append(this.messageTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendWarning = function() {
	$("#log").append(this.warningTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendError = function() {
	$("#log").append(this.errorTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendParseError = function(_YAMLException) {
	// console.log("parseError")
	// console.log(_YAMLException, _YAMLException.stack);
	// console.trace();
	
	$("#log").append(this.parseErrorTemplate(_YAMLException));
	//todo add click to this
};

Log.prototype.appendException = function(_e, _message) {

	$("#log").append(this.exceptionTemplate({e: _e, message: _message}));
	//todo add click to this
};

