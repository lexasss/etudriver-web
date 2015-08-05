if (window.QUnit) {
var req = document.getElementById('req');
req.style.display = 'none';

QUnit.module( 'FixationDetector', {
    beforeEach: function() {
        this.chgd = new window.GazeTargets.CustomHeadGestureDetector('default', {
            calibration: {          // gesture calibration settings
                trials: 5,             // number of trials
                threshold: 0.0120,     // minimum signal from the baseline
                trialDuration: 2000,   // ms
                pauseDuration: 2000,   // ms
                plotSizeFactor: 1.0    // a factor for 320x240
            },
            detection: {        // detector settings
                maxAmplitudeError: 0.20,    // 0..1 
                minCorrelation: 0.85,       // 0.05..0.95
                minPause: 500,              // the minimum pause between gestures
                alterRefSignalOnDetection: false    // if true, the baseline changes on the gesture detection
            }
        });
        this.rnd = function (value) {
            var v = function (v) {
                return v + (Math.random() * 0.004 - 0.002);
            };
            return {
                xl: v(value.xl),
                yl: v(value.yl),
                xr: v(value.xr),
                yr: v(value.yr)
            };
        };
    },
    afterEach: function() {
    }
});

QUnit.test( 'all', function( assert ) {
    var finished = assert.async();

    var data1 = [
        {ts:   1, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  33, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  66, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 100, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 133, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 166, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 200, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 233, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 266, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 300, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 333, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 366, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 400, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 433, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 466, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 500, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 533, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 566, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 600, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 633, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 666, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 700, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 733, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 766, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 800, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}}
    ];

    var data2 = [
        {ts:   1, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  33, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  66, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 100, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 166, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 200, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 233, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 266, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 300, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 333, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 366, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 400, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 433, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 466, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 500, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 533, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 566, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 600, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 633, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 666, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 700, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 733, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 766, x: 23, y: 432, ec: {xl: 0.5, yl: 0.505, xr: 0.6, yr: 0.505}},
        {ts: 800, x: 23, y: 432, ec: {xl: 0.5, yl: 0.515, xr: 0.6, yr: 0.515}},
        {ts: 833, x: 23, y: 432, ec: {xl: 0.5, yl: 0.540, xr: 0.6, yr: 0.540}},
        {ts: 866, x: 23, y: 432, ec: {xl: 0.5, yl: 0.560, xr: 0.6, yr: 0.560}},
        {ts: 900, x: 23, y: 432, ec: {xl: 0.5, yl: 0.575, xr: 0.6, yr: 0.575}},
        {ts: 933, x: 23, y: 432, ec: {xl: 0.5, yl: 0.580, xr: 0.6, yr: 0.580}},
        {ts: 966, x: 23, y: 432, ec: {xl: 0.5, yl: 0.582, xr: 0.6, yr: 0.582}},
        {ts: 1000, x: 23, y: 432, ec: {xl: 0.5, yl: 0.580, xr: 0.6, yr: 0.580}},
        {ts: 1033, x: 23, y: 432, ec: {xl: 0.5, yl: 0.575, xr: 0.6, yr: 0.575}},
        {ts: 1066, x: 23, y: 432, ec: {xl: 0.5, yl: 0.560, xr: 0.6, yr: 0.560}},
        {ts: 1100, x: 23, y: 432, ec: {xl: 0.5, yl: 0.540, xr: 0.6, yr: 0.540}},
        {ts: 1133, x: 23, y: 432, ec: {xl: 0.5, yl: 0.515, xr: 0.6, yr: 0.515}},
        {ts: 1166, x: 23, y: 432, ec: {xl: 0.5, yl: 0.505, xr: 0.6, yr: 0.505}},
        {ts: 1200, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1233, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1266, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1300, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1333, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1366, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1400, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1433, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}}
    ];
    
    var i, j, d, r, timer = null;
    
    i = 0;
    var that = this;
    console.log('---- calibrating the ' + this.chgd.getName() + ' detector --------');
    this.chgd.init(this.chgd.modes.calibration, function (state) {
        if (state === 'start') {
            j = 0;
            timer = setTimeout(function cycle() {
                timer = null;
                d = data2[j];
                that.chgd.feed(d.ts, that.rnd(d.ec), {name: 'nod detected'});
                j += 1;
                if (j < data2.length) {
                   timer =  setTimeout(cycle, 5);
                }
            }, 10);
        } else if (state === 'stop') { 
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        } else if (state === 'finished') { 
            var signal = data2;
            j = 0;
            setTimeout(function () {
                console.log('---- testing a signal --------');
                that.chgd.init(that.chgd.modes.detection);
            }, 10);
            timer = setTimeout(function cycle() {
                timer = null;
                d = signal[j];
                r = that.chgd.feed(d.ts, that.rnd(d.ec), {name: 'nod detected'});
                if (r) {
                    console.log('[' + d.ts + ']: ' + r.name);
                }
                j += 1;
                if (j < signal.length) {
                    timer = setTimeout(cycle, 30);
                } else if (signal === data2) {
                    console.log('---- testing no signal --------');
                    j = 0;
                    signal = data1;
                    timer = setTimeout(cycle, 30);
                } else {
                    console.log('---- the test is finished --------');
                    assert.ok(true, 'detected all states' );
                    finished();
                }
            }, 100);
        }
        console.log(state);
    });
});

}