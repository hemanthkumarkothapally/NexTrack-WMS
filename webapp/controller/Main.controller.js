sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel,MessageToast) => {
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
            let keyPages = this.getOwnerComponent().getModel("NexTrackModel").getProperty("/KeyPages");
            if(keyPages[oItem]==="idCategoryMasterPage"){
            this.loadConfiguration("MasterModel",oItem);
            this._buildTable("idCategoryTable");
            this._buildForm("idDynForm");
            this.onCancelPress();
            }
            else if(keyPages[oItem]==="idAssetHistoryPage"){
                this.loadConfiguration("ReportingModel",oItem);
                 this._buildTable("idItemTable");
            }
            oNavContainer.to(this.byId(keyPages[oItem]));
        },
        loadConfiguration: function (sModel,sScreenName) {
            let sPath = "/" + sScreenName;
            var oData = this.getOwnerComponent().getModel(sModel).getProperty(sPath);
            var oConfigModel = new JSONModel();
            oConfigModel.setData(oData);
            this.getView().setModel(oConfigModel, "config");
                
        },
        _buildForm:function(sFormId){
            const oForm = this.byId(sFormId);
            oForm.destroyContent();
            const aFields = this.getView().getModel("config").getProperty("/formFields");

            aFields.forEach(f => {
                oForm.addContent(new sap.m.Label({ text: f.label }));
                if (f.type === "Input") {
                    oForm.addContent(new sap.m.Input({
                        value: "{NexTrackModel>/formData/" + f.path + "}"
                    }));
                } else if (f.type === "Select") {
                    oForm.addContent(new sap.m.ComboBox({
                        selectedKey: "{NexTrackModel>/formData/" + f.path + "}",
                        items: f.items.map(i => new sap.ui.core.Item({ key: i, text: i }))
                    }));
                } else if (f.type === "Date") {
                    oForm.addContent(new sap.m.DatePicker({
                        value: "{NexTrackModel>/formData/" + f.path + "}",
                        displayFormat: "dd-MM-yyyy",
                        valueFormat: "dd-MM-yyyy"
                    }));
                } else if (f.type === "Password") {
                    oForm.addContent(new sap.m.Input({
                        value: "{NexTrackModel>/formData/" + f.path + "}",
                        type: "Password"
                    }));
                }
            });
        },
        _buildTable:function(sTableId){
            let oConfig = this.getView().getModel("config")
            var oTable = this.byId(sTableId);
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
            let oNexTrackModel = this.getView().getModel("NexTrackModel");

            oNexTrackModel.setProperty("/formData", oRow);
            MessageToast.show("Edit pressed for: " + oRow.CategoryCode);
        },

        onDelete: function (oEvent) {
            const oCtx = oEvent.getSource().getParent().getBindingContext("config");

            // Get the model and the path to the data array
            const oModel = oCtx.getModel();
            const sPath = oCtx.getPath();

            // Get the index of the item to be deleted
            const aPathParts = sPath.split("/");
            const iIndex = parseInt(aPathParts[aPathParts.length - 1]);

            // Get the parent array that contains the item
            const sArrayPath = aPathParts.slice(0, aPathParts.length - 1).join("/");
            const aTableRows = oModel.getProperty(sArrayPath);

            // Remove the item from the array
            aTableRows.splice(iIndex, 1);

            // Update the model to reflect the deletion
            oModel.setProperty(sArrayPath, aTableRows);

            // Optional: Show a confirmation message
            const oRow = oCtx.getObject();
            MessageToast.show("Deleted: " + oRow.CategoryCode);
        },
        onSubmitPress: function () {
            let oConfigModel = this.getView().getModel("config");
            let oNexTrackModel = this.getView().getModel("NexTrackModel");

            // Get the current data from the form
            let oFormData = oNexTrackModel.getProperty("/formData");

            // Get the existing table data
            let aTableRows = oConfigModel.getProperty("/tableRows");

            // Push the new form data into the table data array
            aTableRows.push({ ...oFormData }); // Use spread syntax to create a new object

            // Update the model with the new table data
            oConfigModel.setProperty("/tableRows", aTableRows);
            this.onCancelPress();
        },
        onCancelPress: function () {
            this.getView().getModel("NexTrackModel").setProperty("/formData", {})
        },
        onItemorAssetPress:function(oEvent){
            let sSelectedKey=oEvent.getParameter("newValue");
            if(sSelectedKey==="Asset"){
                this.byId("idItemTable").setVisible(false);
                this.byId("idAssetTable").setVisible(true);
            }
            else{
                this.byId("idItemTable").setVisible(true);
                this.byId("idAssetTable").setVisible(false);
            }
        }
    });
});