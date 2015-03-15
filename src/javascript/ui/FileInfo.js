'use strict';

$.Topic("File/opened").subscribe(update);
$.Topic("File/changed").subscribe(update);
$.Topic("File/closed").subscribe(update);

function update(_f){
	if (_f.isOpen) {
		$("#file-title").text(_f.title);
		$("#file-dirty").toggleClass("hidden", !_f.isDirty);
	} else {
		$("#file-title").text("");
		$("#file-dirty").toggleClass("hidden", true);
	}
}
