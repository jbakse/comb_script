'use strict';
var _ = require('underscore');

var DEVELOPER_KEY = 'AIzaSyAaps9tbXrXH7Yhk94HnHv7EmVaz8Hxmjo';
var CLIENT_ID = '1055926372216-75g9p5ttbsb7vnu18rvfn46n13llbfsn.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/drive'];
var APP_ID = 'combscript-jbakse';
// var AUTH_TOKEN;

module.exports.init = function(){
	gapi.auth.authorize(
		{'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
		authCallback);
};

module.exports.openYAML = function(){
	console.log("g", google);

	return pickFile().then(getFileInfo).then(getFileContents);
};

//http://www.html5rocks.com/en/tutorials/es6/promises/

function pickFile() {
	return new Promise( function( resolve, reject) {
		var view = new google.picker.View(google.picker.ViewId.DOCS);

		view.setQuery(".yaml");

		var pCB = function(data) {
			if (data.action == google.picker.Action.PICKED) {
				var fileId = data.docs[0].id;
				resolve(fileId)
			}
			if (data.action == google.picker.Action.CANCEL) {
				reject(Error("Canceled Pick"));
			} 
		};


		var picker = new google.picker.PickerBuilder()
		.enableFeature(google.picker.Feature.NAV_HIDDEN)
		.setAppId(APP_ID)
		.setOAuthToken(gapi.auth.getToken().access_token)
		.addView(view)
		.setDeveloperKey(DEVELOPER_KEY)
		.setCallback(pCB)
		.build();
		
		picker.setVisible(true);
	});
}

function getFileInfo(fileId) {
	return new Promise( function( resolve, reject) {

		var request = gapi.client.drive.files.get({'fileId': fileId});
		request.execute(function(fileInfo) {
			resolve(fileInfo);
		});

	});
}

function getFileContents(fileInfo) {
	return new Promise( function(resolve, reject) {
		if (!fileInfo.downloadUrl) {
			reject(Error("Error loading info on picked file."));
		}

		if (fileInfo.downloadUrl) {
			
			var xhr = new XMLHttpRequest();
			xhr.open('GET', fileInfo.downloadUrl);
			
			var accessToken = gapi.auth.getToken().access_token;
			xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
			
			xhr.onload = function() {
				resolve(xhr.responseText);
			};
			xhr.onerror = function() {
				reject(Error("Error loading picked file contents."));
			};
			xhr.send();
		}


	});
}


function authCallback(authResult){
	if (authResult && !authResult.error) {
		gapi.client.load('drive', 'v2').then( function(response){
			return gapi.load('picker');
		}).then( function(response) {
			console.log("Google Drive API Ready");
		});
	}
}



 // function driveReady(){
	// gapi.client.drive.files.list(
	// {
	// 	'q': "title contains 'yaml'"
	// }
	// ).execute( function(response) {
	// 	console.log("response", response);
	// 	_.each(response.result.items, function(i) {
	// 		console.log("item", i.title);
	// 	});
	// });
 // }


 // function retrieveAllFiles(callback) {
	// var retrievePageOfFiles = function(request, result) {
	// 	request.execute(function(resp) {
	// 		result = result.concat(resp.items);
	// 		var nextPageToken = resp.nextPageToken;
	// 		if (nextPageToken) {
	// 			request = gapi.client.drive.files.list({
	// 				'pageToken': nextPageToken
	// 			});
	// 			retrievePageOfFiles(request, result);
	// 		} else {
	// 			callback(result);
	// 		}
	// 	});
	// }
	// var initialRequest = gapi.client.drive.files.list();
	// retrievePageOfFiles(initialRequest, []);
 // }
