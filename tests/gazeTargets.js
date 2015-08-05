if (window.QUnit) {
var req = document.getElementById('req');
req.style.display = 'none';

QUnit.module( 'GazeTargets', {
    beforeEach: function() {
        this.gt = window.GazeTargets;
    },
    afterEach: function() {
    }
});

QUnit.test( 'init', function( assert ) {
    
    var statusChanged = assert.async();
    var dataReceived = assert.async();
    var stopped = assert.async();
    
    var isTracking = false;
    
    function onSample(ts, x, y, pupil, ec) {
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
    
    var callbacks = {
        sample: onSample,
        state: onState
    };
    
    var settings =  {
        headCorrector: {
            enabled: false
        }
    };
    
    this.gt.init(settings, callbacks, {});
});

QUnit.test( 'updateTargets', function( assert ) {
    assert.ok(true, '- not implemented - ' );
});

QUnit.test( 'calibrateCustomHeadGesture', function( assert ) {
    assert.ok(true, '- not implemented - ' );
});

QUnit.test( 'getKeyboard', function( assert ) {
    assert.ok(this.gt.getKeyboard('default'), 'default keyboard must exist');
});

QUnit.test( 'verifyCalibration', function( assert ) {
    assert.ok(true, '- not implemented - ' );
});

}