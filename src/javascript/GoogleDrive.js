'use strict';
/* global gapi:false */
/* global google:false */
/* jshint esnext:true */

var log = require('./ui/Log.js').sharedInstance();

var _ = require('underscore');

var DEVELOPER_KEY = 'AIzaSyAaps9tbXrXH7Yhk94HnHv7EmVaz8Hxmjo';
var CLIENT_ID = '1055926372216-75g9p5ttbsb7vnu18rvfn46n13llbfsn.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/drive.install','https://www.googleapis.com/auth/drive.file'];
var APP_ID = 'combscript-jbakse';



// var state = getParameterByName('state');
// 	var stateObj = state && JSON.parse(state);
// 	if (stateObj && stateObj.action == "create") {
// 		console.log("create new", stateObj);
// 		this.newYAML();
// 	}
// 	else if (stateObj && stateObj.action == "open") {
// 		var self = this;
// 		window.setTimeout(function(){
// 			self.openYAML(stateObj.ids[0]);
// 		}, 2000);
		
// 	}
// 	else {
// 		this.loadYAMLfromURL(settings.fileURL);
// 	}
// //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
// function getParameterByName(name) {
//     name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
//     var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//         results = regex.exec(location.search);
//     return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
// }


// init - loads/authorizes google api for use

module.exports.init = function() {

	$.Topic("UI/command/connectGoogleDrive").subscribe(manualConnect);
	$.Topic("UI/command/open").subscribe(openFile);
	$.Topic("UI/command/new").subscribe(newFile);
	$.Topic("UI/command/save").subscribe(saveFile);

	$.Topic("UI/editor/onContentChange").subscribe(onContentChange);
	


	autoConnect();
};

function autoConnect() {
	return gapi.auth.authorize(
		{'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
		handleAuthResult);
}

function manualConnect() {
	gapi.auth.authorize(
		{'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
		handleAuthResult);
}


function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
		console.log("Google Drive API authorized.");
		
		$("#button-new").removeClass('hidden');
		$("#button-open").removeClass('hidden');
		$("#button-save").removeClass('hidden');
		$("#button-connect-google-drive").addClass('hidden');
		loadAPIs();
		
	}else{
		console.error("Google Drive API authorization denied.");
		$("#button-connect-google-drive").removeClass('hidden');
	}
}

function loadAPIs() {
	gapi.client.load('drive', 'v2')
	.then(function() {
		return gapi.load('picker');
	})
	.then(function() {
		console.log("Google Drive API ready.");
	})
	.then(null, function(e) {
		$("#button-connect-google-drive").removeClass('hidden');
		console.error("Error loading google api.", e);
	});
}


var currentFileInfo = {}; 

function onContentChange(_e, content){
	currentFileInfo.content = content;
	$("#file-dirty").removeClass('hidden');
}

function newFile(){
	currentFileInfo = {};
	currentFileInfo.title = "untitled";
	currentFileInfo.content = "";

	$.Topic("File/onLoad").publish(currentFileInfo.content);

	$("#file-dirty").addClass('hidden');

	$("#file-title").text(currentFileInfo.title);

}

// openFile - promts user to select google drive file
// returns an object with info about the file
// .title .content .id

function openFile(id) {

	var newFileInfo = {};

	var picked;
	if (id) {
		picked = Promise.resolve(id);
	} else {
		picked = showPicker();
	}
	
	picked.then(function(fileId) {
		newFileInfo.id = fileId;
		return getFileResource(fileId);
	})
	.then( function(fileResource) {
		newFileInfo.title = fileResource.title;
		return downloadFilePromise(fileResource);
	})
	.then( function(content){
		newFileInfo.content = content;

		$.Topic("File/onLoad").publish(newFileInfo.content);

		$("#file-dirty").addClass('hidden');
		$("#file-title").text(newFileInfo.title);

		currentFileInfo = newFileInfo;

		log.appendSuccess("File opened.");
	})
	.catch( function(error) {
		console.log("Error opening file.", error);
	});

}


function saveFile(){
	if (!currentFileInfo.id) {

		currentFileInfo.title = prompt('Save file as');

		createDriveFile(currentFileInfo.title, currentFileInfo.content)
		.then( function(result) {
			currentFileInfo.id = result.id;
			$("#file-dirty").addClass('hidden');
			log.appendSuccess("File created.");
		});

	} else {
		
		updateDriveFile(currentFileInfo).then( function(result){
			$("#file-dirty").addClass('hidden');
			log.appendSuccess("File saved.");
		});
	}
}


// updateDriveFile - updates the content of a google drive file 
function updateDriveFile(fileInfo) {
	var request = gapi.client.request({
		'path': '/upload/drive/v2/files/' + fileInfo.id,
		'method': 'PUT',
		'params': {'uploadType': 'media'},
		'headers': {
			'Content-Type': 'text/x-yaml'
		},
		'body': fileInfo.content
	});

	return request;
}


// createDriveFile - creates a new, untitled file on google drive

function createDriveFile(name, content, type) {

	name = name || "untitled.comb";
	content = content || "";
	type = type || "text/x-yaml";

	// create a blob object to hold our data
	var blob = new Blob([content], {
		type: type
	});


	// stick a fileName attribute on to the blob
	// this makes it enough like a file object that insertFile() can use it
	blob.fileName = name;


	return new Promise(function(resolve, reject) {
		insertFile(blob, function(jsonResp) {
			resolve(jsonResp);
		});
	});
}





// displays google picker
// resolves with a google file ID (e.g. 0BzODaS_ym7yXaFJCenRDblatb2c)

function showPicker() {
	return new Promise(function(resolve, reject) {
		var view = new google.picker.View(google.picker.ViewId.DOCS);
		view.setMimeTypes("text/x-yaml");

		var pickerCallback = function(data) {
			if (data.action == google.picker.Action.PICKED) {
				var fileId = data.docs[0].id;
				resolve(fileId);
			}
			if (data.action == google.picker.Action.CANCEL) {
				reject(Error("Canceled Pick"));
			}
		};


		var picker = new google.picker.PickerBuilder()
		.setAppId(APP_ID)
		.setDeveloperKey(DEVELOPER_KEY)
		.setOAuthToken(gapi.auth.getToken().access_token)
		.enableFeature(google.picker.Feature.NAV_HIDDEN)
		.addView(view)
		.setCallback(pickerCallback)
		.build()
		.setVisible(true);
	});
}

// returns the file resource for the fileID
// https://developers.google.com/drive/v2/reference/files

function getFileResource(fileId) {
	return new Promise(function(resolve, reject) {

		var request = gapi.client.drive.files.get({
			'fileId': fileId
		})
		.then(function(response) {
			resolve(response.result);
		}, function(reason) {
			reject(reason);
		});

	});
}

// wrapper for downloadFile () to make it into a promise
function downloadFilePromise(file) {
	return new Promise(function(resolve, reject) {
		downloadFile(file, function(contents) {
			if (contents !== null) {
				resolve(contents);
			} else {
				reject(Error("Could not get file contents."));
			}
		});
	});
}





////////////////////////////////////////////////////////////////////
// 
// Google Drive API Example Libarary
// library calls based on google doc examples with minimal changes for compatability


// https://developers.google.com/drive/v2/reference/files/insert
/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Function to call when the request is complete.
 */
 function insertFile(fileData, callback) {
 	var boundary = '-------314159265358979323846';
 	var delimiter = "\r\n--" + boundary + "\r\n";
 	var close_delim = "\r\n--" + boundary + "--";

 	var reader = new FileReader();
 	reader.readAsBinaryString(fileData);
 	reader.onload = function(e) {
 		var contentType = fileData.type || 'application/octet-stream';
 		var metadata = {
 			'title': fileData.fileName,
 			'mimeType': contentType
 		};

 		var base64Data = btoa(reader.result);
 		var multipartRequestBody =
 		delimiter +
 		'Content-Type: application/json\r\n\r\n' +
 		JSON.stringify(metadata) +
 		delimiter +
 		'Content-Type: ' + contentType + '\r\n' +
 		'Content-Transfer-Encoding: base64\r\n' +
 		'\r\n' +
 		base64Data +
 		close_delim;

 		var request = gapi.client.request({
 			'path': '/upload/drive/v2/files',
 			'method': 'POST',
 			'params': {
 				'uploadType': 'multipart'
 			},
 			'headers': {
 				'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
 			},
 			'body': multipartRequestBody
 		});
 		if (!callback) {
 			callback = function(file) {
 				console.log(file);
 			};
 		}
 		request.execute(callback);
 	};
 }

/**
 * Update an existing file's metadata and content.
 *
 * @param {String} fileId ID of the file to update.
 * @param {Object} fileMetadata existing Drive file's metadata.
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Callback function to call when the request is complete.
 */
 function updateFile(fileId, fileMetadata, fileData, callback) {
 	var boundary = '-------314159265358979323846';
 	var delimiter = "\r\n--" + boundary + "\r\n";
 	var close_delim = "\r\n--" + boundary + "--";

 	var reader = new FileReader();
 	reader.readAsBinaryString(fileData);
 	reader.onload = function(e) {
 		var contentType = fileData.type || 'application/octet-stream';
    // Updating the metadata is optional and you can instead use the value from drive.files.get.
    var base64Data = btoa(reader.result);
    var multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: ' + contentType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n' +
    '\r\n' +
    base64Data +
    close_delim;

    var request = gapi.client.request({
    	'path': '/upload/drive/v2/files/' + fileId,
    	'method': 'PUT',
    	'params': {'uploadType': 'multipart', 'alt': 'json'},
    	'headers': {
    		'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
    	},
    	'body': multipartRequestBody});
    if (!callback) {
    	callback = function(file) {
    		console.log(file);
    	};
    }
    request.execute(callback);
};
}


// https://developers.google.com/drive/v2/reference/files/get
/**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
 function downloadFile(file, callback) {
 	if (file.downloadUrl) {
 		var accessToken = gapi.auth.getToken().access_token;
 		var xhr = new XMLHttpRequest();
 		xhr.open('GET', file.downloadUrl);
 		xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
 		xhr.onload = function() {
 			callback(xhr.responseText);
 		};
 		xhr.onerror = function() {
 			callback(null);
 		};
 		xhr.send();
 	}
 	else {
 		callback(null);
 	}
 }