// Head gesture detecting classes

// Sample class
// params:
//  - ts:      timestamp
//  - x, y:    gaze x and y
//  - ec:      eye points in camera, {xl, yl, xr, yr}
//  - focused: the currently focused object
function HGDSample(ts, x, y, ec, focused) {  
    this.matched = 0;
    this.ts = ts;
    this.x = x;
    this.y = y;
    this.ec = ec;
    this.focused = focused;
}

HGDSample.prototype.isMatched = function (ruleIndex) {
    var mask = 1 << ruleIndex;
    return (this.matched & mask) > 0;
};

HGDSample.prototype.setMatched = function (ruleIndex, matched) {
    var mask = ~(1 << ruleIndex);
    this.matched = (this.matched & mask) + (matched ? 1 << ruleIndex : 0);
};

// Head gesture detector
// params:
//   - rules: a list of rules
function HeadGestureDetector(rules) {
    this.rules = rules;
    this.buffer = [];
    this.eventIsOn = false;
    this.canTest = false;
    this.current = null;
}

// resets the internal state
HeadGestureDetector.prototype.init = function () {
    this.buffer = [];
    this.eventIsOn = false;
    this.canTest = false;
    this.current = null;
};

// feed sample data
// returns:
//  - gesture matching result, either null, or {object} if the gesture was recognized
HeadGestureDetector.prototype.feed = function (ts, x, y, ec, focused) {
    var result = null;
    if (ec) {
        for (var i = 0; i < this.buffer.length; i++) {
            if (ts - this.buffer[i].ts > settings.headGesture.timeWindow) {
                this.buffer.shift();
                this.canTest = true;
            } else {
                break;
            }
        }
        this.canTest = this.canTest && this.buffer.length > 0;
        var sample = new HGDSample(ts, x, y, ec, focused);
        if (this.canTest) {
            this.test(sample);
        }
        this.buffer.push(sample);
        if (this.canTest) {
            result = this.searchPattern();
        }
    }
    this.current = result ? result.object : null;
    return result;
};

HeadGestureDetector.prototype.isRangeTestable = function (range) {
    return range.min !== 0.0 || range.max !== 0.0;
};

HeadGestureDetector.prototype.normalizeAngles = function (range, angle) {
    var min = range.min;
    var max = range.max;
    if (min === 0.0 && max === 0.0) {
        max = 360.0;
    } else if (max < min) {
        if (angle < 180.0) {
            min = 0.0;
        } else {
            max = 360.0;
        }
    }
    return {min: min, max: max};
};

HeadGestureDetector.prototype.testRule = function (rule, side, amplitude, angle) {
    var result = false;
    var angles = this.normalizeAngles(rule[side].angle, angle);
    var amps = rule[side].amplitude;
    result = amplitude >= amps.min && amplitude <= amps.max && angle >= angles.min && angle <= angles.max;
    return result;
};

HeadGestureDetector.prototype.test = function (sample) {
    var i;
    for (i = 0; i < this.rules.length; i += 1) {
        // Time-Threshold Detector
        var rule = this.rules[i];
        var index = this.buffer.length - 1;
        var minTS = sample.ts - rule.interval.max;
        var maxTS = sample.ts - rule.interval.min;
        while (index >= 0 && this.buffer[index].ts > maxTS) {
            index -= 1;
        }

        var detected = rule.matchAll;
        while (index >= 0 && this.buffer[index].ts > minTS) {
            var s = this.buffer[index];
            index -= 1;
            var dLX = sample.ec.xl - s.ec.xl;
            var dLY = sample.ec.yl - s.ec.yl;
            var dRX = sample.ec.xr - s.ec.xr;
            var dRY = sample.ec.yr - s.ec.yr;
            
            var ampLeft = Math.sqrt(dLX * dLX + dLY * dLY);
            var angLeft = Math.atan2(dLY, dLX) * 180.0 / Math.PI;
            var ampRight = Math.sqrt(dRX * dRX + dRY * dRY);
            var angRight = Math.atan2(dRY, dRX) * 180.0 / Math.PI;
            if (angLeft < 0.0)
                angLeft += 360.0;
            if (angRight < 0.0)
                angRight += 360.0;

            var result = 
                (this.isRangeTestable(rule.left.amplitude) ? this.testRule(rule, 'left', ampLeft, angLeft) : true) &&
                (this.isRangeTestable(rule.right.amplitude) ? this.testRule(rule, 'right', ampRight, angRight) : true);

            if (rule.matchAll) {
                detected = detected && result;
                if (!result) {
                    break;
                }
            } else {
                detected = detected || result;
                if (result) {
                    break;
                }
            }
        }

        sample.setMatched(i, detected);
    }
};

HeadGestureDetector.prototype.searchPattern = function () {
    var result = null;
    
    var ri = this.rules.length - 1;
    var pri = -1;
    var priTimestamp = 0;
    var start = null;
    var end = null;
    var i;
    for (i = this.buffer.length - 1; i >= 0; i -= 1) {
        var s = this.buffer[i];
        if (s.isMatched(ri)) {
            if (priTimestamp > 0 && priTimestamp - s.ts > this.rules[pri].interval.max) {
                break;
            }

            if (ri === this.rules.length - 1) {
                end = s;
            } else if (ri === 0) {
                var startTS = s.ts - this.rules[0].interval.max;
                while (i > 0 && this.buffer[i - 1].ts > startTS) {
                    i -= 1;
                }
                start = this.buffer[i];
                break;
            }
            priTimestamp = s.ts;
            pri = ri;
            ri -= 1;
        }
        else if (pri >= 0 && s.isMatched(pri)) {
            priTimestamp = s.ts;
        }
    }

    var maxInterval = 0;
    var minInterval = 0;
    for (i = 0; i < this.rules.length; i += 1) {
        var rule = this.rules[i];
        maxInterval += rule.interval.max;
        minInterval += rule.interval.min;
    }

    var allMatched = start && end && (end.ts - start.ts) < maxInterval && (end.ts - start.ts) > minInterval ? true : false;
    if (allMatched && !this.eventIsOn) {
        result = {object: start.focused};
        //extend(true, result, this.computeEyeGazePoints(i));
        
        while (this.buffer.length > 0) {
            var sample = this.buffer[0];
            if (sample.ts < end.ts)
                this.buffer.shift();
            else
                break;
        }
    }
    this.eventIsOn = allMatched;
    
    return result;
};

HeadGestureDetector.prototype.computeEyeGazePoints = function (startIndex) {
    var gx = 0.0,
        gy = 0.0,
        count = 0,
        exl = 0.0,
        eyl = 0.0,
        countl = 0,
        exr = 0.0,
        eyr = 0.0,
        countr = 0;
    var i = Math.max(startIndex, 9);
    var maxTimestamp = this.buffer[i].ts;
    var timestamp = maxTimestamp;
    while (maxTimestamp - timestamp < 150 && i >= 0) {
        var s = this.buffer[i];
        gx += s.x;
        gy += s.y;
        count += 1;
        if (s.ec.xl > 0.0) {
            exl += s.ec.xl;
            eyl += s.ec.yl;
            countl += 1;
        }
        if (s.ec.xr > 0.0) {
            exr += s.ec.xr;
            eyr += s.ec.yr;
            countr += 1;
        }
        timestamp = s.ts;
        i -= 1;
    }
    if (count > 0) {
        gx /= count;
        gy /= count;
    }
    if (countl > 0) {
        exl /= countl;
        eyl /= countl;
    }
    if (countr > 0) {
        exr /= countr;
        eyr /= countr;
    }

    return {
        gaze: {
            x: gx, y: gy
        }, 
        eye: {
            left: {x: exl, y: eyl},
            right: {x: exr, y: eyr}
        }
    };
};
