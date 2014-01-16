var debug = function () {
    var text = '';
    for (var i = 0; i < arguments.length; i++) {
        text += arguments[i] + (i > 0 ? ', ' : '');
    }
    console.log(text);
};

var test = function () {
    var fixdet = new FixationDetector({
        maxFixSize: 50,		// pixels
        bufferLength: 10    // samples
    });
    var data1 = [
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
    
    var i, d, r;
    
    fixdet.reset();
    console.log('---- testing fixations --------');
    for (i = 0; i < data1.length; i++) {
        d = data1[i];
        r = fixdet.feed(d.ts, d.x, d.y, d.ec);
        if (r) {
            console.log('New fixation at [' + d.ts + ']');
        }
    }
    
    console.log('---- the test is finished --------');
};
