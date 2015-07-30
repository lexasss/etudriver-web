QUnit.module( 'ETUDriver', {
    beforeEach: function() {
        this.etud = window.GazeTargets.ETUDriver;
    },
    afterEach: function() {
    }
});

QUnit.test( 'init', function( assert ) {
    
    var statusChanged = assert.async();
    var dataReceived = assert.async();
    
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
            statusChanged();
            statusChanged = undefined;
        }
    }    
    
    var settings = {
        panel: {            // default control panel settings with eye-tracking control buttons
            show: true,               // boolean flag
            displaySamples: false,    // flag to display sample data, if panel is visible
            id: 'gt-panel',     // the panel id
            connectedClassName: 'gt-panel-connected'  // the class to apply then WebSocket is connected
        },
        communicator: {
            port: 8086,         // the port the WebSocket works on
            frequency: 0        // sampling frequency in Hz, between 10 and 1000 (other values keep the original tracker frequency)
        }
    };
    
    var callbacks = {
        data: onData,
        state: onState
    };
    
    this.etud.init(settings, callbacks, {});
});
