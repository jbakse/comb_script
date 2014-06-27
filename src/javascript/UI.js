module.exports.clearLog = function(_message) {
	$("#log").empty();
}

module.exports.appendLog = function(_message) {
	$("#log").append(_message);
}
