sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("nextrackwms.nextrackwms.controller.Main", {
        onInit() {
        },
        onMenuButtonPress: function () {
            var oSideNav = this.byId("sidecontent");

            // if (oSideNav.hasStyleClass("mySmallSideNav")) {
            //     oSideNav.removeStyleClass("mySmallSideNav");
            // } else {
            //     oSideNav.addStyleClass("mySmallSideNav");
            // }
            let oToolPage = this.byId("mainpage");
            let bSideExpanded = oToolPage.getSideExpanded();

            // this._setToggleButtonTooltip(bSideExpanded);

            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },
        onItemSelect: function (oEvent) {
            let oItem = oEvent.getParameter("item").getKey();
            let oNavContainer = this.byId("maincontainer");
            let keyPages=this.getOwnerComponent().getModel("NexTrackModel").getProperty("/KeyPages");
            oNavContainer.to(this.byId(keyPages[oItem]));
        }
    });
});