// Fixation and FixationDetector

// Fixation
// The constructor takes data of its first sample
function Fixation (ts, x, y) {
    this.ts = ts;
    this.x = x;
    this.y = y;
    this.duration = 0;
    this.saccade = {dx: 0, dy: 0};
    this.samples = [];
}

// params:
//	ts: timestamp in milliseconds
//	x: gaze x in pixels
//	y: gaze y in pixels
Fixation.prototype.addSample = function (bufferLength, ts, x, y) {
    if(this.samples.length == bufferLength) {
        this.samples.shift();
    }

    this.samples.push({x: x, y: y});
    this.duration = ts - this.ts;

    var fx = 0;
    var fy = 0;
    for (var i = 0; i < this.samples.length; i += 1) {
        var sample = this.samples[i];
        fx += sample.x;
        fy += sample.y;
    }
    this.x = fx / this.samples.length;
    this.y = fy / this.samples.length;
};

// Fixation detector
function FixationDetector(settings) {
    
    this.currentFix = null;

    // Operational variables
    var candidateFix = null;

    // Must be called when new sample is available
    // params:
    //	ts: timestamp in milliseconds
    //	x: gaze x in pixels
    //	y: gaze y in pixels
    // returns:
    //	true if a new fixation starts, false otherwise
    this.feed = function (ts, x, y) {
        var result = false;
        if (!this.currentFix) {
            this.currentFix = new Fixation(ts, x, y);
            result = true;
        }
        else if (!candidateFix) {
            var dx = this.currentFix.x - x;
            var dy = this.currentFix.y - y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < settings.maxFixSize) {
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
            } else {
                candidateFix = new Fixation(ts, x, y);
                candidateFix.saccade.dx = x - this.currentFix.x;
                candidateFix.saccade.dy = y - this.currentFix.y;
            }
        } else {
            var dxCurr = this.currentFix.x - x;
            var dyCurr = this.currentFix.y - y;
            var distCurr = Math.sqrt(dxCurr*dxCurr + dyCurr*dyCurr);
            var dxCand = candidateFix.x - x;
            var dyCand = candidateFix.y - y;
            var distCand = Math.sqrt(dxCand*dxCand + dyCand*dyCand);
            if (distCurr < settings.maxFixSize) {
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
            }
            else if(distCand < settings.maxFixSize) {
                this.currentFix = candidateFix;
                candidateFix = null;
                this.currentFix.addSample(settings.bufferLength, ts, x, y);
                result = true;
            }
            else {
                candidateFix = new Fixation(ts, x, y);
                candidateFix.saccade.dx = x - this.currentFix.x;
                candidateFix.saccade.dy = y - this.currentFix.y;
            }
        }

        return result;
    };
    
    this.reset = function () {
        this.currentFix = null;
        candidateFix = null;
    };
}
