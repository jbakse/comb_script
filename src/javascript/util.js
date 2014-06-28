exports.greet = function() {
	console.log("Hello, Util!");
};


exports.downloadDataUri = function(options) {
  var link = document.createElement("a");
  link.download = options.filename;
  link.href =  options.url;
  link.click();
};


// function downloadDataUri(options) {
// 	if (!options.url)
// 		options.url = "http://download-data-uri.appspot.com/";
// 	$('<form method="post" action="' + options.url + '" style="display:none"><input type="hidden" name="filename" value="' + options.filename + '"/><input type="hidden" name="data" value="' + options.data + '"/></form>').appendTo('body').submit().remove();
// }

