// Handles communication with ETU-Driver Service application 
// and optionally create a panel with buttons to issue commands
//
// Requires: utils.js

(function (root) {

    'use strict';

    var utils = root.GazeTargets.Utils;

    var ETUDriver = {
    	// Initializes tconnection to ETU-Driver Service application
    	init: function (_settings, _callbacks, _storage) {
    		settings = _settings || {};
    		callbacks = _callbacks || {};
    		storage = _storage || {};

    		if (storage.device) {
    			defaultDevice = utils.getStoredValue(storage.device);
    		}

	        if (utils.bool(settings.panel.show)) {
	            createPanel();
	        }
        
	        setStatus(stateLabel.connecting);

	        var wsURI = 'ws://localhost:' + settings.communicator.port + '/';
	        websocket = new WebSocket(wsURI);
	        websocket.onopen    = onWebSocketOpen;
	        websocket.onclose   = onWebSocketClose;
	        websocket.onmessage = onWebSocketMessage;
	        websocket.onerror   = onWebSocketError;
    	},

	    // Shows ETU-Driver options dialog
	    // arguments:
	    //  - onclosed: the function that is called when the options dialog is closed; arguments:
	    //      - accepted: boolean, true if a user pressed "OK" button, false otherwise
	    showOptions: function (onclosed) {
	        send(request.showOptions);
	    },

	    // Calibrate the current device
	    // arguments:
	    //  - onfinished: the function that is called when the calibration is finished; arguments:
	    //      - accepted: boolean, true if a new calibration was accepted, false otherwise
	    calibrate: function (onfinished) {
	        send(request.calibrate);
	    },

	    // Toggles tracking
	    toggleTracking: function () {
	        send(request.toggleTracking);
	    }
    };

    // consts

    // labels displayed in the ETUDriver panel
    var stateLabel = {
        disconnected: 'DISCONNECTED',
        connecting: 'CONNECTING...',
        connected: 'CONNECTED'
    };

    // textual rquests to sent to ETU-Driver Service application
    var request = {
        showOptions: 'SHOW_OPTIONS',
        calibrate: 'CALIBRATE',
        toggleTracking: 'TOGGLE_TRACKING',
        setDevice: 'SET_DEVICE'
    };

    // respond types receved from ETU-Driver Service application
    var respondType = {
        sample: 'sample',
        state: 'state',
        device: 'device'
    };

    var stateFlags = {
        none: 0,            // not connected, or unknown
        connected: 1,       // some tracker is online and is ready to be used
        calibrated: 2,      // the tracker is calibrated and ready to stream data
        tracking: 4,        // the tracker is streaming data
        busy: 8             // the service is temporally unavailable (calibration is in progress, 'Options' window is shown, etc.)
    };

    // callbacks
    var callbacks = {
    	data: function (ts, x, y, pupil, ec) { },
    	state: function (state) { }
    };
    
    // principal variables
    var settings;
    var storage;
    var websocket = null;
    var defaultDevice = '';

    // interface
    var controlPanel = null;
    var lblDevice = null;
    var btnShowOptions = null;
    var btnCalibrate = null;
    var btnStartStop = null;
    var lblLog = null;

    // states
    var currentStateFlags = stateFlags.none;
    var currentDevice = '';
    var samplingTimer = 0;

    // sample buffer
    var buffer = [];
    var sampleCount = 0;
    var samplingStart = 0;

    var createPanel = function () {

        var controlPanelHtml = '\n\
            <span id="gt-device"></span>\n\
            <input id="gt-showOptions" type="button" value="Options" disabled />\n\
            <input id="gt-calibrate" type="button" value="Calibrate" disabled />\n\
            <input id="gt-toggleTracking" type="button" value="Start" disabled />\n\
            <span id="gt-chgd-calibMenu"><ul><li><a href="#">Calibrate gesture</a><ul id="gt-chgd-calibList"></ul></li></ul></span>\n\
            <span id="gt-log"></span>\n\
            ';

        controlPanel = document.createElement('div');
        controlPanel.id = settings.panel.id;
        controlPanel.innerHTML = controlPanelHtml;
        
        var bodyPaddingTop = window.getComputedStyle(document.body).paddingTop;
        document.body.insertBefore(controlPanel, document.body.firstChild);
        document.body.style.margin = '0px';
        
        if (navigator.userAgent.indexOf('MSIE') === -1) {
            setTimeout(function () {
                document.body.style.paddingTop = Math.max(parseInt(bodyPaddingTop, 10), controlPanel.scrollHeight) + 'px';
            }, 100);
        }

        lblDevice = document.getElementById('gt-device');
        btnShowOptions = document.getElementById('gt-showOptions');
        btnCalibrate = document.getElementById('gt-calibrate');
        btnStartStop = document.getElementById('gt-toggleTracking');
        lblLog = document.getElementById('gt-log');

        btnShowOptions.addEventListener('click', function () {
            send(request.showOptions);
        });
        btnCalibrate.addEventListener('click', function () {
            send(request.calibrate);
        });
        btnStartStop.addEventListener('click', function () {
            send(request.toggleTracking);
        });
    };

    var setStatus = function (label) {
        if (lblDevice) {
            lblDevice.innerHTML = label;
        }
    };

	var send = function (message) {
        utils.debug('ETUDriver.send', 'WebSocket sent: ' + message);
        websocket.send(message);
    };
	    
    var onWebSocketOpen = function (evt) {
        //debug('onWebSocketOpen', evt);
        if (controlPanel) {
            setStatus(stateLabel.connected);
            controlPanel.classList.add(settings.panel.connectedClassName);
            var state = updateState(stateFlags.none);
            updateControlPanel(state);
            
            if (defaultDevice) {
                send(request.setDevice + ' ' + defaultDevice);
            }
        }
    };

    var onWebSocketClose = function (evt) {
        //debug('onWebSocketClose', evt);
        websocket = null;
        if (controlPanel) {
            currentDevice = '';
            setStatus(stateLabel.disconnected);
            controlPanel.classList.remove(settings.panel.connectedClassName);
            var state = updateState(stateFlags.none);
            updateControlPanel(state);
        }
    };

    var onWebSocketMessage = function (evt) {
        //debug('onWebSocketMessage', evt.data);
        try {
            var state;
            var ge = JSON.parse(evt.data);
            if (ge.type === respondType.sample) {
                if (samplingTimer) {
                    buffer.push({ts: ge.ts, x: ge.x, y: ge.y, pupil: ge.p, ec: ge.ec});
                } else if (callbacks.data) {
                    callbacks.data(ge.ts, ge.x, ge.y, ge.p, ge.ec);
                }
            } else if (ge.type === respondType.state) {
                utils.debug('onWebSocketMessage', 'WebSocket got state: ' + evt.data);
                state = updateState(ge.value);
                onstate(state);
            } else if (ge.type === respondType.device) {
                utils.debug('onWebSocketMessage', 'WebSocket got device: ' + evt.data);
                if (storage.device) {
                	utils.store(storage.device, ge.name);
                }
                state = updateState(undefined, ge.name);
                onstate(state);
            }
        } catch (e) {
            utils.exception('onWebSocketMessage', e);
            utils.exception('onWebSocketMessage', evt.data);
        }
    };

    var onWebSocketError = function (evt) {
        utils.debug('onWebSocketError', evt);
        if (lblLog) {
            lblLog.innerHTML = 'Problems in the connection to WebSocket server';
            setTimeout(function () {
                lblLog.innerHTML = '';
            }, 5000);
        }
    };

    var onstate = function (state) {
        utils.updatePixelConverter();
        if (controlPanel) {
            updateControlPanel(state);
        }

        if (state.isTracking) {
            if (settings.frequency >= 10 && settings.frequency <= 100) {
                samplingTimer = setTimeout(processData, 1000 / settings.frequency);
                samplingStart = (new Date()).getTime();
                sampleCount = 0;
            }
        }
        else {
            if (samplingTimer) {
                clearTimeout(samplingTimer);
                samplingTimer = 0;
            }
        }

        callbacks.state(state);
    };

    var updateControlPanel = function (state) {
        if (state.device) {
            lblDevice.innerHTML = state.device;
        }
        btnShowOptions.disabled = !websocket || state.isTracking || state.isBusy;
        btnCalibrate.disabled = !state.isConnected || state.isTracking || state.isBusy;
        btnStartStop.disabled = !state.isCalibrated || state.isBusy;
        btnStartStop.value = state.isTracking ? 'Stop' : 'Start';

        if (!state.isTracking && state.isCalibrated) {
            lblLog.innerHTML = '';
        }
    };

    var updateState = function (flags, device) {
        var isStopped = false;
        if (flags !== undefined) {
            isStopped = (currentStateFlags & stateFlags.tracking) > 0 && (flags & stateFlags.tracking) === 0;
            currentStateFlags = flags;
        } else {
            flags = currentStateFlags;
        }

        if (device !== undefined) {
            currentDevice = device;
        } else {
            device = currentDevice;
        }
        
        return {
            isServiceRunning: !!websocket,
            isConnected:  (currentStateFlags & stateFlags.connected) > 0,
            isCalibrated: (currentStateFlags & stateFlags.calibrated) > 0,
            isTracking:   (currentStateFlags & stateFlags.tracking) > 0,
            isBusy:       (currentStateFlags & stateFlags.busy) > 0,
            isStopped:    isStopped,
            device:       currentDevice
        };
    };

    var processData = function () {
        sampleCount += 1;
        var s = null;
        if (buffer.length) {
            var x = 0.0;
            var y = 0.0;
            var p = 0.0;
            var ec = {xl: 0.0, yl: 0.0, xr: 0.0, yr: 0.0};
            for (var i = 0; i < buffer.length; i += 1) {
                var sample = buffer[i];
                x += sample.x;
                y += sample.y;
                p += sample.pupil;
                if (sample.ec) {
                    ec.xl += sample.ec.xl;
                    ec.yl += sample.ec.yl;
                    ec.xr += sample.ec.xr;
                    ec.yr += sample.ec.yr;
                }
            }
            s = {ts: Math.round(sampleCount * (1000.0 / settings.frequency)),
                x: x / buffer.length,
                y: y / buffer.length,
                pupil: p / buffer.length,
                ec: {
                    xl: ec.xl / buffer.length,
                    yl: ec.yl / buffer.length,
                    xr: ec.xr / buffer.length,
                    yr: ec.yr / buffer.length
                }
            };
            buffer = [];
        } else if (lastSample) {
            s = lastSample;
        }
        if (s) {
            ondata(s.ts, s.x, s.y, s.pupil, s.ec);
        }
        var now = (new Date()).getTime();
        var nextAt = Math.round(samplingStart + (sampleCount + 1) * (1000.0 / settings.frequency));
        var pause = Math.max(0, nextAt - now);
        samplingTimer = setTimeout(processData, pause);
    };

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.ETUDriver = ETUDriver;

})(window);