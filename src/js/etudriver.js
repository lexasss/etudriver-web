// Handles communication with ETU-Driver Service application 
//
// Dependencies:
//      utils.js
//      etudPanel.js
// Depended style sheets:
//      chgd.css
//      etudPanel.css

(function (root) {

    'use strict';

    var ETUDriver = {
        // Initializes tconnection to ETU-Driver Service application
        // Must be called after other GazeTargets components are initialized
        init: function (_settings, _callbacks, _storage) {
            settings = _settings;
            callbacks = _callbacks;
            storage = _storage;

            utils = root.GazeTargets.Utils;
            panel = root.GazeTargets.ETUDPanel;

            if (storage.device) {
                defaultDevice = utils.getStoredValue(storage.device);
            }

            panel.setLabel(stateLabel.connecting);
            
            var wsURI = 'ws://localhost:' + settings.port + '/';
            websocket = new WebSocket(wsURI);
            websocket.onopen    = onWebSocketOpen;
            websocket.onclose   = onWebSocketClose;
            websocket.onmessage = onWebSocketMessage;
            websocket.onerror   = onWebSocketError;
        },

        // Shows ETU-Driver options dialog
        // arguments:
        //  - onclosed: the function that is called when the options dialog is closed; arguments:
        //      - [NOT_IMPL] accepted: boolean, true if a user pressed "OK" button, false otherwise
        showOptions: function (onclosed) {
            statusUpdateOneTimeCallback = onclosed;
            send(request.showOptions);
        },

        // Calibrate the current device
        // arguments:
        //  - onfinished: the function that is called when the calibration is finished; arguments:
        //      - [NOT_IMPL] accepted: boolean, true if a new calibration was accepted, false otherwise
        calibrate: function (onfinished) {
            statusUpdateOneTimeCallback = onfinished;
            send(request.calibrate);
        },

        // Toggles tracking
        toggleTracking: function () {
            send(request.toggleTracking);
        },

        // Returns the current state:
        //         isServiceRunning   bool
        //         isConnected        bool
        //         isCalibrated       bool
        //         isTracking         bool
        //         device             string
        getState: function () {
            var state = getState();
            return {
                isServiceRunning: state.isServiceRunning,
                isConnected: state.isConnected,
                isCalibrated: state.isCalibrated,
                isTracking: state.isTracking,
                device: state.device
            };
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

    var utils;
    var panel;

    // states
    var currentStateFlags = stateFlags.none;
    var currentDevice = '';
    var samplingTimer = 0;
    var statusUpdateOneTimeCallback = null;

    // sample buffer
    var buffer = [];
    var sampleCount = 0;
    var samplingStart = 0;

    var send = function (message) {
        utils.debug('ETUDriver.send', 'WebSocket sent: ' + message);
        websocket.send(message);
    };
        
    var onWebSocketOpen = function (evt) {
        //debug('onWebSocketOpen', evt);
        var state = getState(stateFlags.none);
        
        panel.setLabel(stateLabel.connected);
        panel.setIsConnected(true);
        panel.update(state);
        /*
        setTimeout(function () {
            if (defaultDevice && !(currentStateFlags & stateFlags.tracking)) {
                send(request.setDevice + ' ' + defaultDevice);
            }
        }, 200); */
    };

    var onWebSocketClose = function (evt) {
        //debug('onWebSocketClose', evt);
        websocket = null;
        currentDevice = '';
        
        var state = getState(stateFlags.none);

        panel.setLabel(stateLabel.disconnected);
        panel.setIsConnected(false);
        panel.update(state);
    };

    var onWebSocketMessage = function (evt) {
        //debug('onWebSocketMessage', evt.data);
        //try {
            var state;
            var ge = JSON.parse(evt.data);
            if (ge.type === respondType.sample) {
                if (samplingTimer) {
                    buffer.push({ts: ge.ts, x: ge.x, y: ge.y, pupil: ge.p, ec: ge.ec});
                } else if (callbacks.data) {
                    callbacks.data(ge.ts, ge.x, ge.y, ge.p, ge.ec);
                }
                panel.printData(ge);
            } else if (ge.type === respondType.state) {
                utils.debug('onWebSocketMessage', 'WebSocket got state: ' + evt.data);
                state = getState(ge.value);
                respondToStateChange(state);
            } else if (ge.type === respondType.device) {
                utils.debug('onWebSocketMessage', 'WebSocket got device: ' + evt.data);
                if (storage.device) {
                    utils.store(storage.device, ge.name);
                }
                state = getState(undefined, ge.name);
                respondToStateChange(state);
            }/*
        } catch (e) {
            utils.exception('onWebSocketMessage', e);
            utils.exception('onWebSocketMessage', evt.data);
        }*/
    };

    var onWebSocketError = function (evt) {
        utils.debug('onWebSocketError', evt);
        panel.showMessage('Problems in the connection to WebSocket server', 5000);
    };

    var getState = function (flags, device) {
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

    var respondToStateChange = function (state) {
        utils.updatePixelConverter();
        panel.update(state);

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

        if (statusUpdateOneTimeCallback) {
            statusUpdateOneTimeCallback(state.isCalibrated);
            statusUpdateOneTimeCallback = null;
        }

        if (callbacks.state) {
            callbacks.state(state);
        }
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