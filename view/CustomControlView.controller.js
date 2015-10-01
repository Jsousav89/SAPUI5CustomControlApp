sap.ui.localResources('control');  
jQuery.sap.require("control.SpeechRecognitionInputControl");

sap.ui.controller("custom.controls.demo.view.CustomControlView", {


		onButtonPress: function(evt){
			

			 var x = new control.SpeechRecognitionInputControl();
			 
			 var oLayout = this.getView().byId("thisPage");
		     oLayout.addContent(x);
			 
			
		
		}

});