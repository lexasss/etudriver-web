updatePixelConverter();

var test = function (modulation) {
    var currentTarget = null;
    var timer = null;
    var ss = getScreenSize();
    modulation.h.center = ss.width / 2;
    modulation.v.center = ss.height / 2;
    
    var calibVerifier = new CalibrationVerifier({
        display: true,
        rows: 3,
        columns: 3,
        size: 12,                   // target size in pixels
        duration: 1500,             // target exposition time; note that sample gathering starts 500ms after a target is displayed
        transitionDuration: 0,      // time to travel from one location to another; set to 0 for no animation
        displayResults: 600,         // results display time in seconds; set to 0 not to display the result
        interpretationThreshold: 20,// amplitude difference threshold (px) used in the interpretation of the verification results
        pulsation: {
            enabled: false,         // if set to "true", the target has "aura" that pulsates
            duration: 600,          // pulsation cycle duration, ms
            size: 20                // size of "aura", px
        },
        className: {
            container: 'gt-calibVerifier-containerDefault',
            target: 'gt-calibVerifier-targetDefault',
            pulsator: 'gt-calibVerifier-pulsatorDefault'
        },
        resultColors: {                // colors of the object painted in the resulting view
            target: '#444',
            sample: '#48C',
            offset: 'rgba(224,160,64,0.5)',
            text: '#444'
        }
    });
    
    var feedSample = function () {
        if (calibVerifier.isActive()) {
            var noisify = function (x, s) {
                return x + (Math.random() * 2 * s - s);
            };
            
            var modulate = function (x, m) {
                return noisify(x + (x - m.center) * m.a + m.b, 20);
            };
            
            var x = modulate(currentTarget.x, modulation.h);
            var y = modulate(currentTarget.y, modulation.v);
            calibVerifier.feed(0, x, y);
        }
    };
    
    calibVerifier.run({}, {
        targetStarted: function (target) {
            currentTarget = {x: target.location.x * ss.width, y: target.location.y * ss.height};
            timer = setInterval(feedSample, 30);
        },
        targetFinished: function (finished, next) {
            clearInterval(timer);
            timer = null;
        },
        finished: function (result) {
            var avgToText = function (value) {
                return value.mean.toFixed(1) + ' (' + value.std.toFixed(1) + ')';
            }
            debug('Amplitude', avgToText(result.amplitude));
            debug('Angle', avgToText(result.angle));
            debug('STD', avgToText(result.std));
            debug('Ratings', 'amplitude = ' + result.interpretation.rating.amplitude +
                ', uniformity = ' + result.interpretation.rating.uniformity);
            if (result.apx.h) {
                debug('H', (result.apx.h.map(function (v) { return v.toFixed(1); })).join(', '));
            }
            if (result.apx.v) {
                debug('V', (result.apx.v.map(function (v) { return v.toFixed(1); })).join(', '));
            }
            debug('---- the test is finished --------');
        }
    });
    
    debug('---- testing calibration verification --------');
};
