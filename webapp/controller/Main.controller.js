sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("nextrackwms.nextrackwms.controller.Main", {
        onInit() {
            var oModel = new sap.ui.model.json.JSONModel({
                items: [
                    { ID: "E001", Name: "John Doe", Age: 28 },
                    { ID: "E002", Name: "Jane Smith", Age: 32 },
                    { ID: "E003", Name: "Mike Brown", Age: 25 }
                ]
            });
            this.getView().setModel(oModel, "myModel");
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
            let keyPages = this.getOwnerComponent().getModel("NexTrackModel").getProperty("/KeyPages");
            if (this.oItem) {
                if (keyPages[this.oItem] === "idCategoryMasterPage") {
                    let oConfigDta = this.getView().getModel("config").getData();
                    this.getOwnerComponent().getModel("MasterModel").setProperty(oConfigDta.sPath, oConfigDta)
                }
            }
            this.oItem = oEvent.getParameter("item").getKey();
            let oNavContainer = this.byId("maincontainer");

            if (keyPages[this.oItem] === "idCategoryMasterPage") {
                this.loadConfiguration("MasterModel", this.oItem);
                this._buildTable("idCategoryTable");
                this._buildForm("idDynForm");
                this.onCancelPress();
            }
            else if (keyPages[this.oItem] === "idAssetHistoryPage") {
                this.loadConfiguration("ReportingModel", this.oItem);
                this._buildTable("idItemTable");
            }
            oNavContainer.to(this.byId(keyPages[this.oItem]));
            this.getView().getModel("TransactionModel").refresh();
            this.onResetPress();
            this.resetAssetItem();

        },
        loadConfiguration: function (sModel, sScreenName) {
            let sPath = "/" + sScreenName;
            var oData = this.getOwnerComponent().getModel(sModel).getProperty(sPath);
            var oConfigModel = new JSONModel();
            oConfigModel.setData(oData);
            this.getView().setModel(oConfigModel, "config");

        },
        _buildForm: function (sFormId) {
            const oForm = this.byId(sFormId);
            oForm.removeAllContent();
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
                } else if (f.type === "FileUpload") {
                    oForm.addContent(new sap.ui.unified.FileUploader({
                        uploadUrl: "/upload/",
                        name: "myFileUploader",
                        tooltip: "Upload your file",
                        fileType: ["pdf"],
                        buttonText: "Upload File"
                    }));
                }
            });
        },
        _buildTable: function (sTableId) {
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
            if (sTableId === "idCategoryTable") {
                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Text({ text: "Actions" }),
                    hAlign: "Center"
                }));
            }
            const oTemplate = new sap.m.ColumnListItem({
                cells: [
                    ...aColumns.map(col => new sap.m.Text({ text: "{config>" + col.path + "}" })),
                    sTableId === "idCategoryTable" ? new sap.m.HBox({
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
                    }) : null
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

            // Get the path and index of the selected item
            const sPath = oCtx.getPath();
            const aPathParts = sPath.split("/");
            const iIndex = parseInt(aPathParts[aPathParts.length - 1]);

            // Set the form data to the selected row
            oNexTrackModel.setProperty("/formData", { ...oRow }); // Use spread to avoid reference

            // Store the index of the row being edited as a flag
            oNexTrackModel.setProperty("/editIndex", iIndex);

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
            let oFormData = oNexTrackModel.getProperty("/formData");
            let iEditIndex = oNexTrackModel.getProperty("/editIndex");

            const sTablePath = "/tableRows"; // This path needs to be dynamic based on the page

            let aTableRows = oConfigModel.getProperty(sTablePath);

            if (iEditIndex !== null && iEditIndex !== undefined) {
                aTableRows[iEditIndex] = { ...oFormData };
                oNexTrackModel.setProperty("/editIndex", null);
                MessageToast.show("Record updated successfully!");

            } else {
                // We are in CREATE MODE: Add a new record
                aTableRows.push({ ...oFormData });
                MessageToast.show("New record added successfully!");
            }
            oConfigModel.setProperty(sTablePath, aTableRows);
            this.onCancelPress();
        },
        onCancelPress: function () {
            this.getView().getModel("NexTrackModel").setProperty("/formData", {})
        },

        //REPORTING Section
        onItemorAssetPress: function (oEvent) {
            let sSelectedKey = oEvent.getParameter("newValue");
            if (sSelectedKey === "Asset") {
                this.byId("idItemTable").setVisible(false);
                this.byId("idAssetTable").setVisible(true);
            }
            else {
                this.byId("idItemTable").setVisible(true);
                this.byId("idAssetTable").setVisible(false);
            }
        },
        onItemVerificationSearch: function () {
            let sNumber = this.byId("idItemVerificationCombobox").getSelectedKey();
            if (sNumber) {
                this.byId("_IDGenTable4").setVisible(true)
            }
            else {
                MessageBox.warning("Please Enter Schedule number")
            }
        },
        onItemVerificationReset: function () {
            this.byId("_IDGenComboBox37").setSelectedKey(null);
            this.byId("_IDGenDatePicker33").setValue(null);
            this.byId("_IDGenDatePicker34").setValue(null);
            this.byId("_IDGenTable4").setVisible(false)
        },
        onAssetVerificationSearch: function () {
            let sNumber = this.byId("idAssetVerificationCombobox").getSelectedKey();
            let oData = {
                Matched: "4",
                NotMatched: "2",
                NotFound: "1",
                Audit: "1"
            }
            if (sNumber) {
                this.byId("idAssetVerificationTable").bindRows({
                    path: "ReportingModel>/AssetVerification"
                })
                this.getOwnerComponent().getModel("ReportingModel").setProperty("/tiles",oData)
            }
            else {
                MessageBox.warning("Please Enter Schedule number")
            }
        },
        onAssetVerificationReset: function () {
            let oData = {
                Matched: "0",
                NotMatched: "0",
                NotFound: "0",
                Audit: "0"
            }
             this.getOwnerComponent().getModel("ReportingModel").setProperty("/tiles",oData)
            this.byId("idAssetVerificationCombobox").setSelectedKey(null);
            this.byId("idAssetVerificationFromDate").setValue(null);
            this.byId("idAssetVerificationToDate").setValue(null);
            this.byId("idAssetVerificationTable").unbindRows()
        },
        ///// TRANSACTION SCREEN

         onOpenDialog: function () {
            var oDialog = this.byId("createPODialog");
            oDialog.open();
        },

        onDialogClosePress: function () {
            this.byId("createPODialog").close();
        },

        onCreatePO: function () {
            // Logic to handle the PO creation
            // ...
            this.onDialogClosePress();
        },
        findAsset: function (oEvent) {
            let assetId = oEvent.getParameter("query");
            let oTransactionData = this.getView().getModel("TransactionModel").getData();
            let transactions = oTransactionData.TransactionsMaster
            let found = false
            transactions.forEach((transaction) => {
                if (transaction.assetId === assetId) {
                    this.getView().getModel("TransactionModel").setProperty("/Transactions/0", transaction)
                    found = true
                }
            })
            if (!found)
                MessageToast.show("Not Found")
        },
        onComboChange: function (oEvent, oValue) {
            let oTransactionData = this.getView().getModel("TransactionModel").getData();
            let selectedLocation = oEvent.getParameter("newValue")
            if (oValue === 'Location') {
                let locations = oTransactionData.Locations;
                locations.forEach((location) => {
                    if (location.name === selectedLocation) {
                        this.getView().getModel("TransactionModel").setProperty("/Sublocations", location.sublocations)
                    }
                    this.byId("_IDGenComboBox19").setSelectedKey("");
                    this.byId("_IDGenComboBox19").setValue("");
                })
            }
            else if (oValue == 'Category') {
                let Categories = oTransactionData.Categories;
                Categories.forEach((Category) => {
                    if (Category.name === selectedLocation) {
                        this.getView().getModel("TransactionModel").setProperty("/SubCategories", Category.subcategories)
                    }
                    this.byId("_IDGenComboBox17").setSelectedKey("");
                    this.byId("_IDGenComboBox17").setValue("");
                })
            }
        },
        onAssetReset: function () {
            let oTransactionData = this.getView().getModel("TransactionModel").setProperty("/Transactions", [])
        },
        onAssetSave: function () {
            let assetId = this.byId("_IDGenInput64").getValue()
            let oTransactionData = this.getView().getModel("TransactionModel").getData();
            let transactions = oTransactionData.TransactionsMaster
            let found = false
            for (let i = 0; i <= transactions.length; i++) {
                if (transactions[i].assetId === assetId) {
                    this.getView().getModel("TransactionModel").setProperty(`/TransactionsMaster/${i}`, transactions[i])
                    found = true
                    MessageToast.show("Asset Updated")
                }
            }
            if (!found)
                MessageToast.show("Not Found")
        },
        onSavePress: function () {
            const payload = {
                // Form 1
                "assetId": this.getView().byId("_IDGenInput199").getValue(),
                "parentId": this.getView().byId("_IDGenInput1").getValue(),

                // Form 2
                "refNumber": this.getView().byId("_IDGenInput2").getValue(),
                "assetDesc": this.getView().byId("_IDGenInput3").getValue(),
                "acqDate": this.getView().byId("_IDGenDatePicker").getValue(),
                "useDate": this.getView().byId("_IDGenDatePicker1").getValue(),
                "retireDate": this.getView().byId("_IDGenDatePicker2").getValue(),
                "category": this.getView().byId("_IDGenComboBox").getSelectedKey(),
                "subCategory": this.getView().byId("_IDGenComboBox1").getSelectedKey(),
                "location": this.getView().byId("_IDGenComboBox2").getSelectedKey(),
                "subLocation": this.getView().byId("_IDGenComboBox3").getSelectedKey(),
                "costCenter": this.getView().byId("_IDGenComboBox4").getSelectedKey(),
                "group": this.getView().byId("_IDGenComboBox5").getSelectedKey(),
                "physicalStatus": this.getView().byId("_IDGenComboBox6").getSelectedKey(),
                "machineNumber": this.getView().byId("_IDGenInput4").getValue(),
                "depRateITAct": this.getView().byId("_IDGenInput5").getValue(),
                "addDepRateITAct": this.getView().byId("_IDGenInput6").getValue(),
                "depRateCAct": this.getView().byId("_IDGenInput7").getValue(),
                "quantity": this.getView().byId("_IDGenInput8").getValue(),
                "bookLife": this.getView().byId("_IDGenInput9").getValue(),

                // Form 3
                "vendor": this.getView().byId("_IDGenComboBox7").getSelectedKey(),
                "make": this.getView().byId("_IDGenComboBox8").getSelectedKey(),
                "model": this.getView().byId("_IDGenComboBox9").getSelectedKey(),
                "voucherDate": this.getView().byId("_IDGenDatePicker3").getValue(),
                "voucherNumber": this.getView().byId("_IDGenInput11").getValue(),
                "invoiceDate": this.getView().byId("_IDGenDatePicker4").getValue(),
                "invoiceNumber": this.getView().byId("_IDGenInput12").getValue(),
                "serialNumber": this.getView().byId("_IDGenInput13").getValue(),
                "poNumber": this.getView().byId("_IDGenInput14").getValue(),
                "poDate": this.getView().byId("_IDGenDatePicker5").getValue(),
                "workingInShift": this.getView().byId("_IDGenComboBox10").getSelectedKey(),
                "shiftRate": this.getView().byId("_IDGenInput15").getValue(),
                "ownership": this.getView().byId("_IDGenComboBox11").getSelectedKey(),
                "rfidNumber": this.getView().byId("_IDGenInput16").getValue(),
                "assetType": this.getView().byId("_IDGenComboBox12").getSelectedKey(),

                // Form 4
                "originalPoCost": this.getView().byId("_IDGenInput17").getValue(),
                "subsidiaryAmount": this.getView().byId("_IDGenInput18").getValue(),
                "adjustedBookValue": this.getView().byId("_IDGenInput19").getValue(),
                "openingCActAD": this.getView().byId("_IDGenInput20").getValue(),
                "openingITActAD": this.getView().byId("_IDGenInput21").getValue(),
                "adInput": this.getView().byId("_IDGenInput22").getValue(),
                "itActAD": this.getView().byId("_IDGenInput23").getValue(),
                "nonDepreciativeValue": this.getView().byId("_IDGenInput24").getValue(),
                "itActNDValue": this.getView().byId("_IDGenInput25").getValue(),
                "netValue": this.getView().byId("_IDGenInput26").getValue(),
                "itActNetValue": this.getView().byId("_IDGenInput27").getValue(),
                "remarks": this.getView().byId("_IDGenTextArea").getValue(),

                // Form 5
                "insuranceCompany": this.getView().byId("_IDGenInput28").getValue(),
                "policyNumber": this.getView().byId("_IDGenInput29").getValue(),
                "insuranceDate": this.getView().byId("_IDGenDatePicker6").getValue(),
                "premiumAmount": this.getView().byId("_IDGenInput30").getValue(),
                "dueDate": this.getView().byId("_IDGenDatePicker7").getValue(),
                "insuredValue": this.getView().byId("_IDGenInput31").getValue(),
                "serviceCompany": this.getView().byId("_IDGenInput32").getValue(),
                "serviceNo": this.getView().byId("_IDGenInput33").getValue(),
                "serviceDate": this.getView().byId("_IDGenDatePicker8").getValue(),
                "serviceAmount": this.getView().byId("_IDGenInput34").getValue(),
                "nextServiceDate": this.getView().byId("_IDGenDatePicker9").getValue(),
                "warrantyCompany": this.getView().byId("_IDGenInput35").getValue(),
                "warrantyNo": this.getView().byId("_IDGenInput36").getValue(),
                "warrantyDate": this.getView().byId("_IDGenDatePicker10").getValue(),
                "warrantyAmount": this.getView().byId("_IDGenInput37").getValue(),
                "warrantyDueDate": this.getView().byId("_IDGenDatePicker11").getValue(),
                "additionalInfo": this.getView().byId("_IDGenTextArea1").getValue(),

                // Form 6
                "preventiveFrequency": this.getView().byId("_IDGenComboBox13").getSelectedKey(),
                "preventiveDueDate": this.getView().byId("_IDGenDatePicker12").getValue(),
                "preventiveLastDate": this.getView().byId("_IDGenDatePicker13").getValue(),
                "calibrationFrequency": this.getView().byId("_IDGenComboBox14").getSelectedKey(),
                "calibrationDueDate": this.getView().byId("_IDGenDatePicker14").getValue(),
                "calibrationLastDate": this.getView().byId("_IDGenDatePicker15").getValue()
            };
            console.log("Payload:", payload);
            let master = this.getView().getModel("TransactionModel").getProperty("/TransactionsMaster")
            debugger
            let i = master.length
            this.getView().getModel("TransactionModel").setProperty(`/TransactionsMaster/${i}`, payload)
            MessageToast.show("Record Created");
            this.onResetPress();
        },
        onResetPress: function () {
            // Get a reference to the view
            const oView = this.getView();

            // Get all the SimpleForm controls by their IDs
            const formIds = [
                "idDynForm",
                "idAssetCreationPage",
                "_IDGenSimpleForm",
                "_IDGenSimpleForm1",
                "_IDGenSimpleForm2",
                "_IDGenSimpleForm3",
                "_IDGenSimpleForm4",
                "_IDGenSimpleForm6",
                "_IDGenSimpleForm7",
                "_IDGenSimpleForm8",
                "_IDGenSimpleForm9",
                "_IDGenSimpleForm10",
                "_IDGenSimpleForm11",
                "_IDGenSimpleForm12",
                "_IDGenSimpleForm5",
                "_IDGenSmpleForm6",
                "_IDGenSmpleForm7",
                "_IDGenSmpleForm8",
                "_IDGenSmpleForm9",
                "_IDGenSmpleForm10",
                "_IDGenSimpleForm14",
                "_IDGenSimpleForm16",
                "_IDGenSimpleForm13"
            ];

            formIds.forEach(formId => {
                const oForm = oView.byId(formId);
                if (oForm) {
                    // Get all controls inside the SimpleForm
                    const aControls = oForm.getContent();
                    aControls.forEach(oControl => {
                        // Check the type of control and clear its value
                        if (oControl instanceof sap.m.Input || oControl instanceof sap.m.TextArea) {
                            oControl.setValue("");
                        } else if (oControl instanceof sap.m.DatePicker) {
                            oControl.setValue("");
                        } else if (oControl instanceof sap.m.ComboBox) {
                            oControl.setSelectedKey(null);
                            oControl.setValue("");
                        }
                    });
                }
            });
        },
        onEmployeeSelect: function (oEvent) {
            let selectedKey = oEvent.getParameter("newValue");
            let oModel = this.getView().getModel("TransactionModel").getData();
            let emp_names = oModel.employee_names;
            let name = emp_names[selectedKey]
            this.byId("_IDGenInput39").setValue(name)
            this.byId("_IDGenInput42").setValue(name)
            this.byId("_IDGenInput48").setValue(name)

        },
        onTypeChange: function (oEvent, oType) {
            let selectedKey = oEvent.getParameter("newValue") || " ";
            let oModel = this.getView().getModel("TransactionModel")
            if (selectedKey === "Item") {
                let metadata = {
                    "title": "Item Selection",
                    "code": "Item Code",
                    "description": "Item Description",
                    "rfid": "RFID No",
                    "make": "Make",
                    "model": "Model",
                    "location": "Location",
                    "quantity": "Quantity",
                    "serial_number": "Serial Number",
                    "sublocation": "Sub-Location",
                    "movement_title": "Allotted Item List",
                    "Scanned_tilte": "Scanned Item List"
                }
                oModel.setProperty("/table_metadata", metadata)
                oModel.setProperty("/formFeilds", false);
                oModel.setProperty("/coloumnVisible", false);
                oModel.setProperty("/history_metadata", {
                    "title": "Item Allotment History",
                    "visible": true
                })
            }
            else if (selectedKey === "Asset") {
                let metadata = {
                    "title": "Asset Selection",
                    "code": "Asset Code",
                    "description": "Asset Description",
                    "rfid": "RFID No",
                    "make": "Make",
                    "model": "Model",
                    "location": "Location",
                    "quantity": "Quantity",
                    "serial_number": "Serial Number",
                    "sublocation": "Sub-Location",
                    "movement_title": "Allotted Asset List",
                    "Scanned_tilte": "Scanned Asset List"
                }
                oModel.setProperty("/table_metadata", metadata);
                oModel.setProperty("/formFeilds", true);
                oModel.setProperty("/coloumnVisible", true);
                oModel.setProperty("/history_metadata", {
                    "title": "Asset Allotment History",
                    "visible": true
                })
            } else {

                this.resetAssetItem();
            }
        },
        resetAssetItem: function () {
            let oModel = this.getView().getModel("TransactionModel");
            let metadata = {
                "title": "Asset/Item Selection",
                "code": "Item Code",
                "description": "Item Description",
                "rfid": "RFID No",
                "make": "Make",
                "model": "Model",
                "location": "Location",
                "quantity": "Quantity",
                "serial_number": "Serial Number",
                "sublocation": "Sub-Location",
                "movement_title": "Allotted Item List",
                "Scanned_tilte": "Scanned Item List"
            }
            oModel.setProperty("/formFeilds", false);
            oModel.setProperty("/table_metadata", metadata)
            oModel.setProperty("/coloumnVisible", false);
            oModel.setProperty("/history_metadata", {
                "title": "Item Allotment History",
                "visible": false
            })
        },
        onCreatePO: function (oEvent) {
            let oView = this.getView();
            let oDialog = oView.byId("createPODialog");
            let sPONo = oView.byId("_IDGenInput63").getValue();
            let sItem = oView.byId("_IDGenComboBox15").getSelectedKey();
            let sQuantity = oView.byId("_IDGenInput65").getValue();
            let oModel = oView.getModel("TransactionModel");
            let oData = oModel.getData();

            if (!oData.poItems) {
                oData.poItems = [];
            }
            let oNewPO = {
                PO_Number: sPONo,
                Item_Name: sItem,
                Expected_Quantity: parseInt(sQuantity, 10) || 0,
                Received_Quantity: 0,
                Creation_Date: new Date().toISOString().slice(0, 10)
            };
            oData.poItems.push(oNewPO);
            oModel.refresh(true);
            oDialog.close();
        },
        onAssetIdFromSelect: function (oEvent) {
            let oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.byId("assetIdFrom").setValue(oSelectedItem.getText());
            }
        },

        onAssetIdToSelect: function (oEvent) {
            let oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.byId("assetIdTo").setValue(oSelectedItem.getText());
            }
        },
        generateQr: function () {
            // Combine asset IDs
            let text = this.byId("assetIdFrom").getValue() + "-" + this.byId("assetIdTo").getValue();

            // Get selected type (QR or Barcode)
            let selectedRadioButton = this.byId("generationType").getSelectedButton().getProperty("text");

            // Get size from Select (e.g., "50x50" in mm)
            const oSelect = this.byId("sizeSelect");
            const sKey = oSelect.getSelectedKey();
            const size = sKey.split("x");

            // Clear previous code
            const oBox = this.byId("qrcodeDisplay");
            oBox.destroyItems();

            if (selectedRadioButton === "Barcode") {
                // Barcode
                const oHtmlComp = new sap.ui.core.HTML({
                    content: "<svg id='barcode'></svg>"
                });
                oBox.addItem(oHtmlComp);

                setTimeout(function () {
                    if (typeof JsBarcode !== "undefined") {
                        JsBarcode("#barcode", text, {
                            format: "CODE128",
                            lineColor: "#000000",
                            width: 2,
                            height: size[1],
                            displayValue: true
                        });
                    } else {
                        sap.m.MessageToast.show("JsBarcode library not loaded!");
                    }
                }, 100);

            } else {
                // QR Code
                const oHtmlComp = new sap.ui.core.HTML({
                    content: "<div id='qrcode'></div>"
                });
                oBox.addItem(oHtmlComp);

                setTimeout(function () {
                    if (typeof QRCode !== "undefined") {
                        new QRCode(document.getElementById("qrcode"), {
                            text: text,
                            width: size[0],
                            height: size[1]
                        });
                    } else {
                        sap.m.MessageToast.show("QRCode library not loaded!");
                    }
                }, 100);
            }
        },
        onRefresh: function () {
            // Clear input fields
            this.byId("assetIdFrom").setValue("");
            this.byId("assetIdTo").setValue("");
            this.byId("sizeSelect").setSelectedKey("50x50");
            this.byId("generationType").getButtons()[0].setSelected(true);
            const oBox = this.byId("qrcodeDisplay");
            oBox.destroyItems();
        },
        onSubmit: function () {
            var oView = this.getView();
            var payload = {
                Asset: oView.byId("_IDGenInput40").getValue(),                       // Asset
                OriginalCost: oView.byId("originalCostInput").getValue(),            // Original Cost
                OriginalQuantity: oView.byId("originalQuantityInput").getValue(),    // Original Quantity
                DisposalQuantity: oView.byId("disposalQuantityInput").getValue(),    // Disposal Quantity
                ProceedsAmount: oView.byId("proceedsAmountInput").getValue(),        // Proceeds Amount
                SaleDate: oView.byId("saleDate").getDateValue()
                    ? oView.byId("saleDate").getDateValue().toISOString().split("T")[0] // yyyy-MM-dd
                    : null,                                                 // Sale Date
                Vendor: oView.byId("_IDGenInput41").getValue(),                      // Vendor
                FileImage: oView.byId("_IDGenFileUploader7").getValue(),             // File Name
                Remarks: oView.byId("remarksInput").getValue()                       // Remarks
            };
            let oModel = this.getView().getModel("TransactionModel");
            let disposalData = oModel.getData().disposalData.push(payload);
            oModel.refresh(true);
            this.onResetPress();
        }

    });
});