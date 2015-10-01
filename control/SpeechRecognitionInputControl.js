jQuery.sap.declare("control.SpeechRecognitionInputControl");
jQuery.sap.require("sap.m.Button");
jQuery.sap.require("sap.ui.core.Icon");

sap.m.Input.extend("control.SpeechRecognitionInputControl", { //inherit Input definition                                         
  
  metadata: { 
  	properties:{
  		width: {type : "string", defaultValue: "70%"},   /// setting default width
  		value: {type : "string", defaultValue: ""},
  		recognition: { type:"any" }   //// for Cordova plug-in recognition object
  	},
  	
     aggregations : {
                    _buyButton      : {type : "sap.m.Button", multiple : false, visibility: "hidden"}   // Agregate button 
                }
                
  },  
  
   init : function(){   /// init the control
  
  	            var oControl = this;
  
                var oBuyBtn   = new sap.m.Button({
                  text:"", width:"40px",  icon:"sap-icon://microphone", type:"Default", 
             
                   press: function (oEvent) {    //////// Handle press event
                    
                    if ( oControl.recognition !== undefined){
                   		oControl.recognition.start();  //// Start recognition
                   		var _oBuyBtn = oControl.getAggregation("_buyButton");  
        				_oBuyBtn.setType(sap.m.ButtonType.Emphasized);  /// Change button color 
                    }
                    
                  } 
                });
                
                this.setAggregation("_buyButton", oBuyBtn);  /// Add aggregation control
               
               	if (sap.hybrid !== undefined ){  ///// hybrid library defined ?
               	
               	var isCompanionApp = sap.hybrid.getUrlParameterName("companionbuster");
               	
				if (window.cordova || sap.hybrid.Cordova || isCompanionApp) {   //// Verifying if it is a Cordova app
               
               	document.addEventListener("deviceready", function() {
						
						//sap.hybrid.Booted = true;
						// load odata library
						
						oControl.recognition = new SpeechRecognition();  /// Load Speech recognition library
						
						//this.onnomatch = null;
    					//this.onerror = null;
						
						oControl.recognition.onnomatch = function(event) {         /// Add event handlers
							var _oBuyBtn = oControl.getAggregation("_buyButton");
        					_oBuyBtn.setType(sap.m.ButtonType.Default);
						};
						
						oControl.recognition.onerror = function(event) {          /// Add event handlers
							var _oBuyBtn = oControl.getAggregation("_buyButton");
        					_oBuyBtn.setType(sap.m.ButtonType.Default);
						};
						
						
    					oControl.recognition.onresult = function(event) {      /// Add event handlers for result 
        					
        					if (event.results.length > 0) {       /// If there is a success
            					oControl.setValue(this.value = event.results[0][0].transcript);  /// Set value with voice recognition
        					}
        					
        					var _oBuyBtn = oControl.getAggregation("_buyButton"); 
        					_oBuyBtn.setType(sap.m.ButtonType.Default);  /// Get back the button to original state

						};
				
				
				}, false);
			
					}else{
			
					oBuyBtn.setType(sap.m.ButtonType.Default);
					oBuyBtn.setEnabled(false);   //// Disable button if there is no cordova app 
			
					}
               	}else{
               		/////////////// hybrid not defined
               		oBuyBtn.setType(sap.m.ButtonType.Default);
					oBuyBtn.setEnabled(false);   //// Disable button if there is no cordova app 

               	}
			
   },
   
   renderer : {
 
            render : function(oRm, oControl) {   /////// Render the control

            oRm.write("<div");
            oRm.writeControlData(oControl);       ////// Render control data
            oRm.writeStyles();
            oRm.write(">");
            
            sap.m.InputRenderer.render(oRm, oControl);  //// pass the control to base renderer
            
            oRm.renderControl(oControl.getAggregation("_buyButton"));  /// pass aggregated control for rendering
            
            oRm.write("</div>");
 
        }  
  	
  } 
});