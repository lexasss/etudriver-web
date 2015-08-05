if (window.QUnit) {
var req = document.getElementById('req');
req.style.display = 'none';

QUnit.module( 'ETUDriver', {
    beforeEach: function() {
        this.panel = window.GazeTargets.ETUDPanel;
        this.etud = window.GazeTargets.ETUDriver;
    },
    afterEach: function() {
    }
});

QUnit.test( 'init', function( assert ) {
    
    var statusChanged = assert.async();
    var dataReceived = assert.async();
    var stopped = assert.async();
    
    var isTracking = false;
    
    function onData(ts, x, y, pupil, ec) {
        if (dataReceived) {
            assert.ok(true, 'data received' );
            dataReceived();
            dataReceived = undefined;
        }
    }

    function onState(state) {
        if (statusChanged) {
            assert.ok(true, 'state changed' );
            assert.ok(true, '=== please start and stop eye tracking ===' );
            statusChanged();
            statusChanged = undefined;
        }
        if (state.isTracking) {
            isTracking = true;
        } else if (isTracking && stopped) {
            isTracking = false;
            assert.ok(true, 'stopped' );
            stopped();
            stopped = null;
        }
    }    
    
    var settings = {
        etudPanel: {            // default control panel settings with eye-tracking control buttons
            show: true,               // boolean flag
            displaySamples: false,    // flag to display sample data, if panel is visible
            id: 'gt-etudpanel',     // the panel id
            connectedClassName: 'gt-etudpanel-connected'  // the class to apply then WebSocket is connected
        },
        etudriver: {
            port: 8086,         // the port the WebSocket works on
            frequency: 0        // sampling frequency in Hz, between 10 and 1000 (other values keep the original tracker frequency)
        }
    };
    
    var callbacks = {
        data: onData,
        state: onState
    };
    
    this.panel.init(settings.etudPanel);
    this.etud.init(settings.etudriver, callbacks, {});
});

QUnit.test( 'showOptions', function( assert ) {
    
    var statusChanged = assert.async();
    
    function onDone(isCalibrated) {
        if (statusChanged) {
            assert.ok(true, 'options window was closed' );
            statusChanged();
            statusChanged = undefined;
        }
    }    
    
    this.etud.showOptions(onDone);
});

QUnit.test( 'calibrate', function( assert ) {
    
    var statusChanged = assert.async();
    
    function onDone(isCalibrated) {
        if (statusChanged) {
            assert.ok(true, 'calibration finished: ' + (isCalibrated ? 'success' : 'failed'));
            statusChanged();
        }
    }    
    
    this.etud.calibrate(onDone);
});

}