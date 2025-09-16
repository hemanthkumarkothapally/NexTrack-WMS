sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
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
            this.loadConfiguration(oItem);
            oNavContainer.to(this.byId(keyPages[oItem]));
        },
        loadConfiguration: function (sScreenName) {
            let sPath="/"+sScreenName;
            var oData = this.getOwnerComponent().getModel("MasterModel").getProperty(sPath);
            var oConfigModel = new JSONModel();
            oConfigModel.setData(oData);
            this.getView().setModel(oConfigModel, "config");
            let oConfig=this.getView().getModel("config")

            const oForm = this.byId("idDynForm");
            oForm.destroyContent();
    const aFields = this.getView().getModel("config").getProperty("/formFields");

    aFields.forEach(f => {
        oForm.addContent(new sap.m.Label({ text: f.label }));
        if (f.type === "Input") {
            oForm.addContent(new sap.m.Input({
                value: "{config>" + f.path + "}",
                editable: f.editable
            }));
        } else if (f.type === "Select") {
            oForm.addContent(new sap.m.Select({
                selectedKey: "{config>" + f.path + "}",
                items: f.items.map(i => new sap.ui.core.Item({ key: i, text: i }))
            }));
        }
    });

            var oTable   = this.byId("idCategoryTable");
            oTable.destroyColumns();
    oTable.unbindItems();
    var aColumns = oConfig.getProperty("/tableColumns");

    // Create columns
    aColumns.forEach(function (oCol) {
        oTable.addColumn(new sap.m.Column({
            header: new sap.m.Text({ text: oCol.header })
        }));
    });

  oTable.addColumn(new sap.m.Column({
        header: new sap.m.Text({ text: "Actions" }),
        hAlign: "Center"
    }));

   const oTemplate = new sap.m.ColumnListItem({
        cells: [
            ...aColumns.map(col => new sap.m.Text({ text: "{config>" + col.path + "}" })),
            new sap.m.HBox({
                justifyContent: "Center",
                items: [
                    new sap.m.Button({
                        icon: "sap-icon://edit",
                        type: "Transparent",
                        press: this.onEdit.bind(this)
                    }),
                    new sap.m.Button({
                        icon: "sap-icon://delete",
                        type: "Transparent",
                        press: this.onDelete.bind(this)
                    })
                ]
            })
        ]
    });

    // Bind rows to the named model path
    oTable.bindItems({
        path: "config>/tableRows",   // ✅ named model binding
        template: oTemplate
    });
},

onEdit: function (oEvent) {
    const oCtx = oEvent.getSource().getParent().getBindingContext("config");
    const oRow = oCtx.getObject();
    sap.m.MessageToast.show("Edit pressed for: " + oRow.CategoryCode);
},

onDelete: function (oEvent) {
    const oCtx = oEvent.getSource().getParent().getBindingContext("config");
    const oRow = oCtx.getObject();
    sap.m.MessageToast.show("Delete pressed for: " + oRow.CategoryCode);
}
    });
});