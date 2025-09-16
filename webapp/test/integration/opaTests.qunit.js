/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["nextrackwms/nextrackwms/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
