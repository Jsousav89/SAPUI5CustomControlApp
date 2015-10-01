/* hybrid oData Customization
 *
 * This script has to be happened after hybrid capacity bootstrap, as long as there is ODataModel to be converted to hybridODataModel
 */

sap.hybrid.OData = {
	metadata: {
		extConfigs: null,
		configs: null
	},
	configs: null
};

sap.hybrid.odataConfigMetadata = function(data) {
	if (data.hybrid.oDataConfigs) {
		if (data.extensibility && data.extensibility.serviceConfigs) {
			sap.hybrid.OData.metadata.extConfigs = data.extensibility.serviceConfigs;
		}
		sap.hybrid.OData.metadata.configs = data.hybrid.oDataConfigs;
	}
};

sap.hybrid.onDeviceoDataConfigs = function() {
	// source parent app has odata
	if (sap.hybrid.OData.metadata.configs) {
		if (sap.hybrid.OData.metadata.extConfigs) {
			// fiori extension
			if (sap.hybrid.OData.metadata.extConfigs.serviceBlock === "oServiceParams") {
				// scaffolding services
				sap.hybrid.OData.configs = {
					"sap.ca.serviceConfigs": []
				};
				sap.hybrid.OData.metadata.configs.forEach(function(oConfig) {
					sap.hybrid.OData.configs["sap.ca.serviceConfigs"].push(oConfig.hybridOdata);
				});
			} else {
				sap.hybrid.OData.configs = {
					"serviceConfig": sap.hybrid.OData.metadata.configs[0].hybridOdata
				};
			}
		} else {
			// non-extension app
			sap.hybrid.OData.configs = {
				serviceUrl: sap.hybrid.OData.metadata.configs[0].hybridOdata.serviceUrl
			};
		}
	}
};

sap.hybrid.onWeboDataConfigs = function() {
	// source parent app has odata
	if (sap.hybrid.OData.metadata.configs) {
		if (sap.hybrid.OData.metadata.extConfigs) {
			// fiori extension
			sap.hybrid.OData.configs = {};
		} else {
			// non-extension app
			sap.hybrid.OData.configs = {
				serviceUrl: sap.hybrid.OData.metadata.configs[0].originOdata.serviceUrl
			};
		}
	}
};

sap.hybrid.SMPODataServices = function() {
	if (window.sap_webide_companion) {
		sap.hybrid.AuthODataAcess.Authentication();
	} else {
		if (sap.hybrid.OData.metadata.configs[0].oDataType === "smpodata") {
			sap.hybrid.OData.metadata.configs[0].hybridOdata.serviceUrl = sap.hybrid.SMP.AppContext.applicationEndpointURL + "/";
			var endpointArray = sap.hybrid.SMP.AppContext.applicationEndpointURL.split("/");
			for (var i = 1; i < sap.hybrid.OData.metadata.configs.length; i++) {
				endpointArray[endpointArray.length - 1] = sap.hybrid.OData.metadata.configs[i].hybridOdata.name;
				sap.hybrid.OData.metadata.configs[i].hybridOdata.serviceUrl = endpointArray.join("/");
			}
			sap.hybrid.onDeviceoDataConfigs();
			if (sap.hybrid.SMP.offlineStoreDef) {
				sap.hybrid.OpenSMPOfflineOData();
			} else {
				sap.hybrid.startApp();
			}
		} else {
			sap.hybrid.AuthODataAcess.Authentication();
		}
	}
};

sap.hybrid.initSMPOfflineOData = function(data) {
	if (sap.hybrid.AppDescriptor && sap.hybrid.AppDescriptor.offline && sap.hybrid.AppDescriptor.mobile && sap.hybrid.AppDescriptor.mobile.definingRequests &&
		data.hybrid.plugins.kapsel.odata.selected && data.hybrid.plugins.cordova.device.selected && data.hybrid.plugins.cordova.network.selected) {
		sap.hybrid.SMP.offlineStoreDef = {};
		for (var p in sap.hybrid.AppDescriptor.mobile.definingRequests) {
			sap.hybrid.SMP.offlineStoreDef[p] = sap.hybrid.AppDescriptor.mobile.definingRequests[p].path;
		}
	}
};

sap.hybrid.OpenSMPOfflineOData = function() {
	// load offline odata lib
	jQuery.getScript("hybrid/odata/offlineStore.js").done(function() {
		openAppOfflineStore(sap.hybrid.SMP.AppContext, sap.hybrid.SMP.offlineStoreDef);
	});
};

sap.hybrid.AuthODataAcess = {
	url: "",
	logon: function(url, usr, pwd, onLogonSuccess, onUnauthorized, onLogonError) {
		$.ajax({
			type: "GET",
			url: url,
			username: usr,
			password: pwd,
			beforeSend: function(request) {
				request.setRequestHeader("Authorization", "Basic " + btoa(usr + ":" + pwd));
			},
			error: function(e) {
				if (e.status === 401) {
					onUnauthorized(e);
				} else if (onLogonError) {
					onLogonError(e);
				} else {
					alert("Logon Error:" + e.statusText);
				}
			},
			success: onLogonSuccess
		});
	},

	openLogonDialog: function(sServiceUrl) {
		var logonDialog = new sap.m.Dialog();
		logonDialog.setTitle("Basic Authentication");

		var vbox = new sap.m.VBox();
		var _userInput = new sap.m.Input();
		_userInput.setPlaceholder("Username");
		var _pwdInput = new sap.m.Input();
		_pwdInput.setPlaceholder("Password");
		_pwdInput.setType(sap.m.InputType.Password);
		vbox.addItem(_userInput);
		vbox.addItem(_pwdInput);
		logonDialog.addContent(vbox);

		logonDialog.addButton(new sap.m.Button({
			text: "OK",
			press: function() {
				var username = _userInput.getValue();
				var password = _pwdInput.getValue();

				sap.hybrid.AuthODataAcess.logon(sServiceUrl, username, password, function() {
					logonDialog.close();
					sap.hybrid.AuthODataAcess.afterAuthentication();
				}, function() {
					alert("Username or Password is incorrect!");
					_userInput.setValue("");
					_pwdInput.setValue("");
				}, function(e) {
					//alert(e.statusText);
				});
			}
		}));
		logonDialog.addButton(new sap.m.Button({
			text: "Cancel",
			press: function() {
				logonDialog.close();
			}
		}));
		logonDialog.open();
	},

	afterAuthentication: function() {
		sap.hybrid.startApp();
	},

	Authentication: function() {
		if (sap.hybrid.AuthODataAcess.url && sap.hybrid.AuthODataAcess.url !== "") {
			if (sap.hybrid.getPlatform() === "ios") {
				var username = "";
				var password = "";
				sap.hybrid.AuthODataAcess.logon(sap.hybrid.AuthODataAcess.url, username, password, function() {
					sap.hybrid.AuthODataAcess.afterAuthentication();
				}, null, null);
			} else {
				sap.hybrid.AuthODataAcess.logon(sap.hybrid.AuthODataAcess.url, null, null, function() {
					sap.hybrid.AuthODataAcess.afterAuthentication();
				}, function() {
					sap.hybrid.AuthODataAcess.openLogonDialog(sap.hybrid.AuthODataAcess.url);
				}, null);
			}
		} else {
			sap.hybrid.AuthODataAcess.afterAuthentication();
		}
	}
};