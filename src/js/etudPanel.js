// Create a panel with buttons to issue ETUdriver commands
//
// Dependencies:
//      utils.js
// Depended style sheets:
//      chgd.css
//      etudPanel.css

(function (root) {

    'use strict';

    var ETUDPanel = {
        // Initializes tconnection to ETU-Driver Service application
        // Must be called prior to initialization of other GazeTargets compoents due to the control panel creation
        init: function (_settings) {
            settings = _settings || {};

            utils = root.GazeTargets.Utils;

            if (utils.bool(settings.show)) {
                createPanel();
            }
        },

        setLabel: function (label) {
            if (lblDevice) {
                lblDevice.innerHTML = label;
            }
        },

        setIsConnected: function (isConnected) {
            if (!controlPanel) {
                return;
            }

            if (isConnected) {
                controlPanel.classList.add(settings.connectedClassName);
            } else {
                controlPanel.classList.remove(settings.connectedClassName);
            }
        },

        update: function (state) {
            if (!controlPanel) {
                return;
            }
            
            if (state.device) {
                lblDevice.innerHTML = state.device;
            }
            btnShowOptions.disabled = !state.isServiceRunning || state.isTracking || state.isBusy;
            btnCalibrate.disabled = !state.isConnected || state.isTracking || state.isBusy;
            btnStartStop.disabled = !state.isCalibrated || state.isBusy;
            btnStartStop.value = state.isTracking ? 'Stop' : 'Start';

            if (!state.isTracking && state.isCalibrated) {
                lblLog.innerHTML = '';
            }
        },

        printData: function (event) {
            if (!controlPanel || !utils.bool(settings.displaySamples)) {
                return;
            }

            var formatValue = function (value, size) {
                var result = value + ',';
                while (result.length < size) {
                    result += ' ';
                }
                return result;
            };
            
            var point = ropot.GazeTargets.Utils.screenToClient(event.x, event.y);
            var log = 't = ' + formatValue(event.ts, 6) +
                ' x = ' + formatValue(point.x, 5) +
                ' y = ' + formatValue(point.y, 5) +
                ' p = ' + formatValue(event.pupil, 4);

            if (event.ec !== undefined) {
                log += 'ec: { ';
                var v;
                for (v in event.ec) {
                    log += v + ' = ' + event.ec[v] + ', ';
                }
                log += '}';
            }

            lblLog.innerHTML = log;
        }

    };

    // principal variables
    var settings;
    var utils;

    // interface
    var controlPanel = null;
    var lblDevice = null;
    var btnShowOptions = null;
    var btnCalibrate = null;
    var btnStartStop = null;
    var lblLog = null;

    var createPanel = function () {

        var controlPanelHtml = '\n\
            <span id="gt-etudpanel-device"></span>\n\
            <input id="gt-etudpanel-showOptions" type="button" value="Options" disabled />\n\
            <input id="gt-etudpanel-calibrate" type="button" value="Calibrate" disabled />\n\
            <input id="gt-etudpanel-toggleTracking" type="button" value="Start" disabled />\n\
            <span id="gt-chgd-calibMenu"></span>\n\
            <span id="gt-etudpanel-log"></span>\n\
            ';

        controlPanel = document.createElement('div');
        controlPanel.id = settings.id;
        controlPanel.innerHTML = controlPanelHtml;
        
        var bodyPaddingTop = window.getComputedStyle(document.body).paddingTop;
        document.body.insertBefore(controlPanel, document.body.firstChild);
        document.body.style.margin = '0px';
        
        if (navigator.userAgent.indexOf('MSIE') === -1) {
            setTimeout(function () {
                document.body.style.paddingTop = Math.max(parseInt(bodyPaddingTop, 10), controlPanel.scrollHeight) + 'px';
            }, 100);
        }

        lblDevice = document.getElementById('gt-etudpanel-device');
        btnShowOptions = document.getElementById('gt-etudpanel-showOptions');
        btnCalibrate = document.getElementById('gt-etudpanel-calibrate');
        btnStartStop = document.getElementById('gt-etudpanel-toggleTracking');
        lblLog = document.getElementById('gt-etudpanel-log');

        btnShowOptions.addEventListener('click', function () {
            root.GazeTargets.ETUDriver.showOptions();
        });
        btnCalibrate.addEventListener('click', function () {
            root.GazeTargets.ETUDriver.calibrate();
        });
        btnStartStop.addEventListener('click', function () {
            root.GazeTargets.ETUDriver.toggleTracking();
        });
    };

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.ETUDPanel = ETUDPanel;

})(window);