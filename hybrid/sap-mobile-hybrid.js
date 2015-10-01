/* hybrid capacity bootstrap
 *
 * This has to be happened after sapui5 bootstrap, and before first application page is loaded
 */

sap.hybrid = {
	Booted: false,
	Cordova: false,
	AppDescriptor: null,
	SMP: {
		AppContext: null,
		offlineStoreDef: null
	},

	setCordova: function() {
		sap.hybrid.Cordova = true;
	},

	getUrlParameterName: function(sParam) {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			if (sParameterName[0] == sParam) {
				return true;
			}
		}
		return false;
	},

	getPlatform: function() {
		var av = navigator.appVersion;
		if (av.indexOf("Android") >= 0) {
			return "android";
		} else if (av.indexOf("iPhone") >= 0) {
			return "ios";
		}
	},

	startViaODataAuth: function(data, isCompanionApp) {
		sap.hybrid.odataConfigMetadata(data);

		// config odata and customize url of auth process
		if (isCompanionApp) {
			sap.hybrid.onWeboDataConfigs();
			sap.hybrid.AuthODataAcess.url = data.hybrid.oDataConfigs[0].originOdata.serviceUrl;
		} else {
			sap.hybrid.onDeviceoDataConfigs();
			sap.hybrid.AuthODataAcess.url = data.hybrid.oDataConfigs[0].hybridOdata.serviceUrl;
		}

		// if there is kapsel logon
		if (data.hybrid.plugins && data.hybrid.plugins.kapsel.logon.selected) {
			// load logon lib
			jQuery.getScript("hybrid/kapsel/logon.js").done(function() {
				var host = data.hybrid.msType === 0 ? data.hybrid.hcpmsServer : data.hybrid.server;
				var port = data.hybrid.msType === 0 ? "443" : data.hybrid.port;
				var pref = data.hybrid.msType === 0 ? "true" : "false";

				// start SMP/HCPms logon
				doLogonInit({
					"serverHost": host,
					"https": pref,
					"serverPort": port
				}, data.hybrid.appid);
			});
		} else {
			// non-kapsel cordova app.
			// trigger odata auth process 
			sap.hybrid.AuthODataAcess.Authentication();
		}
	},

	bootStrap: function() {
		var isCompanionApp = sap.hybrid.getUrlParameterName("companionbuster");

		if (sap.hybrid.Cordova || isCompanionApp) {
			// cordova bootstrap. This is package or companion app mode

			// bind to cordova event
			document.addEventListener("deviceready", function() {
				sap.hybrid.Booted = true;

				// load odata library
				jQuery.getScript("hybrid/odata/hybridodata.js").done(function() {
					// load project.json
					var projectJson = isCompanionApp ? ".project.json" : "project.json";
					jQuery.getJSON(projectJson).done(function(data) {
						if (data.hybrid) {
							jQuery.getJSON("parentapp/manifest.json").done(function(manifestData) {
								if (manifestData["sap.app"].offline && manifestData["sap.mobile"]) {
									sap.hybrid.AppDescriptor = {
										offline: manifestData["sap.app"].offline,
										mobile: manifestData["sap.mobile"]
									};
								}
								sap.hybrid.initSMPOfflineOData(data);
								sap.hybrid.startViaODataAuth(data, isCompanionApp);
							}).fail(function() {
								sap.hybrid.startViaODataAuth(data, isCompanionApp);
							});
						}
					});
				});
			}, false);
		} else {
			// this is web preview and Fiori Client

			// load odata lib
			jQuery.getScript("hybrid/odata/hybridodata.js").done(function() {
				// load project json
				jQuery.getJSON(".project.json").done(function(data) {
					if (data.hybrid) {
						sap.hybrid.odataConfigMetadata(data);

						// construct odata config
						sap.hybrid.onWeboDataConfigs();

						if (sap.ui.Device.browser.safari) {
							// trigger odata auth process for safari
							sap.hybrid.AuthODataAcess.url = data.hybrid.oDataConfigs[0].originOdata.serviceUrl;
							sap.hybrid.AuthODataAcess.iOSAuth = true;
							sap.hybrid.AuthODataAcess.Authentication();
						} else {
							// start app
							sap.hybrid.startApp();
						}
					} else {
						// start app
						sap.hybrid.startApp();
					}
				});
			});
		}
	}
};