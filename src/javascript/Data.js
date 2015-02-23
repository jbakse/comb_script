'use strict';
/* global gapi:false */
/* global google:false */
/* jshint esnext:true */

var _ = require('underscore');

var DEVELOPER_KEY = 'AIzaSyAaps9tbXrXH7Yhk94HnHv7EmVaz8Hxmjo';
var CLIENT_ID = '1055926372216-75g9p5ttbsb7vnu18rvfn46n13llbfsn.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/drive.install','https://www.googleapis.com/auth/drive.file'];
var APP_ID = 'combscript-jbakse';


// init - loads/authorizes google api for use

module.exports.init = function() {
	// $("#button-connect-drive").show();
	// $("#button-yaml-new").hide();
	// $("#button-yaml-open").hide();
	// $("#button-yaml-save").hide();

	return gapi.auth.authorize({
			'client_id': CLIENT_ID,
			'scope': SCOPES,
			'immediate': true
		}, handleAuthResult);

		

};

module.exports.manualConnect = function() {
	gapi.auth.authorize(
                  {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
                  handleAuthResult);
};

function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
		console.log("Google Drive API authorized.");
		
		$("#button-yaml-new").removeClass('hidden');
		$("#button-yaml-open").removeClass('hidden');
		$("#button-yaml-save").removeClass('hidden');

		gapi.client.load('drive', 'v2')
		.then(function() {
			return gapi.load('picker');
		})
		.then(function() {
			console.log("Google Drive API ready.");
		})
		.then(null, function(e) {
			$("#button-connect-drive").removeClass('hidden');
			console.error("Error initializing google api.", e);
		});
	}else{
		$("#button-connect-drive").removeClass('hidden');
		console.error("Google Drive API authorization denied.");
	}
}

// openYAML - promts user to select google drive file
// returns an object with info about the file
// .title .content .id

module.exports.openYAML = function(id) {

	var fileInfo = {};

	var picked;
	if (id) {
		picked = Promise.resolve(id);
	} else {
		picked = pickFile();
	}
	
	return picked.then(function(fileId) {
		fileInfo.id = fileId;
		return getFileResource(fileId);
	})
	.then( function(fileResource) {
		fileInfo.title = fileResource.title;
		return downloadFilePromise(fileResource);
	})
	.then( function(content){
		fileInfo.content = content;
		return Promise.resolve(fileInfo);
	});

};

// newYAML - creates a new, utitled file on google drive

module.exports.newYAML = function(name, content) {

	name = name || "untitled.yaml";
	// var name = prompt("File Name");
	content = content || "";
	// properties:\n    name: untitled\n    unit: mm\n    width: 100\n    height: 100\n\nchildren:\n    - rectangle:\n        properties:\n            width: 50\n            height: 50\n    ";
	var type = "text/x-yaml";

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
};

// saveYAML - updates the content of a google drive file 
module.exports.saveYAML = function(fileInfo) {
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
};






// displays google picker
// resolves with a google file ID (e.g. 0BzODaS_ym7yXaFJCenRDblatb2c)

function pickFile() {
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
				console.log(file)
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
