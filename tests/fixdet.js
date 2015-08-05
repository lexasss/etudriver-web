if (window.QUnit) {
var req = document.getElementById('req');
req.style.display = 'none';

QUnit.module( 'FixationDetector', {
    beforeEach: function() {
        this.fixdet = new window.GazeTargets.FixationDetector({
            maxFixSize: 50,		// pixels
            bufferLength: 10    // samples
        });
        this.parseData = function (data) {
            var i, d, r;
            var detections = 0;

            this.fixdet.reset();
            console.log('---- testing fixations --------');
            for (i = 0; i < data.length; i++) {
                d = data[i];
                r = this.fixdet.feed(d.ts, d.x, d.y, d.ec);
                if (r) {
                    console.log('New fixation at [' + d.ts + ']');
                    detections++
                }
            }

            return detections;
        };
    },
    afterEach: function() {
    }
});

QUnit.test( 'reset, feed', function( assert ) {
    var data = [
        {ts:   1, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  33, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts:  66, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 100, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 166, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 200, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 233, x: 23, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 266, x: 230, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
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
        {ts: 633, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 666, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 700, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 733, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 766, x: 93, y: 432, ec: {xl: 0.5, yl: 0.505, xr: 0.6, yr: 0.505}},
        {ts: 800, x: 93, y: 432, ec: {xl: 0.5, yl: 0.510, xr: 0.6, yr: 0.510}},
        {ts: 833, x: 93, y: 432, ec: {xl: 0.5, yl: 0.515, xr: 0.6, yr: 0.515}},
        {ts: 866, x: 93, y: 432, ec: {xl: 0.5, yl: 0.520, xr: 0.6, yr: 0.520}},
        {ts: 900, x: 93, y: 432, ec: {xl: 0.5, yl: 0.520, xr: 0.6, yr: 0.520}},
        {ts: 933, x: 93, y: 432, ec: {xl: 0.5, yl: 0.515, xr: 0.6, yr: 0.515}},
        {ts: 966, x: 93, y: 432, ec: {xl: 0.5, yl: 0.510, xr: 0.6, yr: 0.510}},
        {ts: 1000, x: 93, y: 432, ec: {xl: 0.5, yl: 0.505, xr: 0.6, yr: 0.505}},
        {ts: 1033, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1066, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1100, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1133, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1166, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1200, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1233, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}},
        {ts: 1266, x: 93, y: 432, ec: {xl: 0.5, yl: 0.5, xr: 0.6, yr: 0.5}}
    ];
    
    assert.ok( this.parseData(data), 'fixations found' );
});

}