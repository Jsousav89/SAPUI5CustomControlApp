jQuery.sap.require("sap.ui.thirdparty.datajs");

var appOfflineStore = {};

function storeErrorCallback(e) {
	console.log("Failed to open offline store.");
	console.error("An error occurred: " + JSON.stringify(e));
	alert("Failed to open offline store.");
}

//kapsel offline functions		
function openStoreSuccessCallback() {
	var endTime = new Date();
	var duration = (endTime - appOfflineStore.startTime) / 1000;
	console.log("Offline Store opened in  " + duration + " seconds");
	//set offline client
	sap.OData.applyHttpClient();

	//start applciation here
	sap.hybrid.startApp();

	appOfflineStore.appIsLoaded = true;
}

function openAppOfflineStore(appContext, reqObj) {
	console.log("open AppOffline Store");
	appOfflineStore.startTime = new Date();

	var properties = {
		"name": "FApplicationOfflineStore",
		"host": appContext.registrationContext.serverHost,
		"port": appContext.registrationContext.serverPort,
		"https": appContext.registrationContext.https,
		"serviceRoot": appContext.applicationEndpointURL + "/",
		"definingRequests": reqObj
	};

	appOfflineStore.store = sap.OData.createOfflineStore(properties);
	appOfflineStore.store.open(openStoreSuccessCallback, storeErrorCallback /*, options*/ );
}

function offlineRefreshErrorCallback(e) {
	console.log("failed to refresh offline store.");
	//reset flag
	appOfflineStore.refreshing = false;

	var oEventBus = sap.ui.getCore().getEventBus();
	oEventBus.publish("OfflineStore", "RefreshError");

	console.error("An error occurred: " + JSON.stringify(e));
}

function offlineRefreshStoreCallback() {
	var endTime = new Date();
	var duration = (endTime - appOfflineStore.startTimeRefresh) / 1000;
	console.log("Store refreshed in  " + duration + " seconds");

	appOfflineStore.refreshing = false;
	var oEventBus = sap.ui.getCore().getEventBus();
	oEventBus.publish("OfflineStore", "Synced");
}

//After calling this the store will receive any changes from the OData producer.
function refreshAppOfflineStore() {
	console.log("enter offline refresh.");
	if (!appOfflineStore.store) {
		console.log("The kapsel offline store must be open before it can be refreshed");
		return;
	}

	if (navigator.onLine) {
		appOfflineStore.startTimeRefresh = new Date();
		console.log("offline store refresh called");
		appOfflineStore.store.refresh(offlineRefreshStoreCallback, offlineRefreshErrorCallback);
	}
}

function flushErrorCallback(e) {
	console.log("Failed to flush offline store.");
	console.error("An error occurred: " + JSON.stringify(e));

	var oEventBus = sap.ui.getCore().getEventBus();
	oEventBus.publish("OfflineStore", "FlushError");

	if (appOfflineStore.refreshing) {
		refreshAppOfflineStore();
	}
}

function offlineFlushStoreCallback() {
	var endTime = new Date();
	var duration = (endTime - appOfflineStore.startTimeRefresh) / 1000;
	console.log("Store flushed in  " + duration + " seconds");

	if (appOfflineStore.refreshing) {
		refreshAppOfflineStore();
	}
}

//After calling this the store will push any changes to the OData producer.
function pushAppOfflineStore() {
	console.log("pushAppOfflineStore.");
	if (!appOfflineStore.store) {
		console.log("The kapsel offline store must be open before it can be flushed");
		return;
	}

	if (navigator.onLine) {
		appOfflineStore.startTimeRefresh = new Date();
		console.log("offline store flush called");
		appOfflineStore.store.flush(offlineFlushStoreCallback, flushErrorCallback);
	}
}

//synchronize data between smp server and offline store
function synAppOfflineStore() {
	if (!appOfflineStore.refreshing) {
		appOfflineStore.refreshing = true;
		pushAppOfflineStore();
	}
}