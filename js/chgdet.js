// Custom Head Gesture Detector
function CHGD_Point(timestamp, ec, focused) {
    this.ec = ec || {xl: 0.0, yl: 0.0, xr: 0.0, yr: 0.0};
    this.timestamp = timestamp || -1;
    this.focused = focused || null;
}

CHGD_Point.prototype.isSet = function () {
    return !(this.ec.xl === 0.0 && this.ec.yl === 0.0 && this.ec.xr === 0.0 && this.ec.yr === 0.0);
};

CHGD_Point.prototype.isValid = function () {
    return this.timestamp !== -1;
};

function CHGD_EC(xl, yl, xr, yr) {
    this.xl = xl || 0.0;
    this.yl = yl || 0.0;
    this.xr = xr || 0.0;
    this.yr = yr || 0.0;
}

function CHGD_Error(left, right) {
    this.left = left || 0.0;
    this.right = right || 0.0;
}

function CustomHeadGestureCalibrator(settings, callback) {
    var onClosed = callback;
    var onCalibStateChanged = null;
    
    var errorThreshold = 0.3;
    var correlThreshold = 0.8;
    var pauseDuration = 2000;
    
    var signals = [];
    var text = [];
    
    var currentSignal = null;
    var controllerCmd = 0;
    var detectedOnLastAttempt = false;
    var canAddSignal = true;
    var calibrationTimer = null;
    
    var durationAvg = 0;
    var durationSTD = 0;
    var avgSignal = null;
    var maxSignalChange = new CHGD_EC();
    
    var calibCount = settings.calibration.trials;
    
    var calibrationPanel = document.createElement('div');
    calibrationPanel.id = 'etud-chgd-calibOverlay';
    calibrationPanel.innerHTML = '\
        <div id="etud-chgd-calib">\
            <a id="etud-chgd-calibClose" href="#">X</button>\
        </div>';
    
    document.body.insertBefore(calibrationPanel, document.body.firstChild);
    
    var that = this;
    document.getElementById('etud-chgd-calibClose').addEventListener('click', function() {
        that.hide(true);
        return false;
    });
    
    var canvas = document.createElement('canvas');
    canvas.id = 'etud-chgd-calibCanvas';
    canvas.width = Math.round(320 * settings.calibration.plotSizeFactor);
    canvas.height = Math.round(240 * settings.calibration.plotSizeFactor);
    document.getElementById('etud-chgd-calib').appendChild(canvas);
    
    var calibPlot = canvas.getContext('2d');
    
    var findSignificantChange = function (signal, refIdx, from, to, inc) {
        var result = -1;
        var threshold = settings.calibration.threshold;
        var ref = signal[refIdx];
        for (var i = from; inc > 0 ? (i < to) : (i >= to); i += inc) {
            var pt = signal[i];
            var dxl = pt.ec.xl - ref.ec.xl;
            var dyl = pt.ec.yl - ref.ec.yl;
            var dxr = pt.ec.xr - ref.ec.xr;
            var dyr = pt.ec.yr - ref.ec.yr;
            var distLeft = Math.sqrt(dxl * dxl + dyl * dyl);
            var distRight = Math.sqrt(dxr * dxr + dyr * dyr);
            if (distLeft > threshold || distRight > threshold) {
                result = i;
                break;
            }
        }

        return result;
    };
    
    var getMinGestureDuration = function () {
        return Math.max(5.0, durationAvg - Math.max(2 * durationSTD, 0.2 * durationAvg));
    };
    
    var getMaxGestureDuration = function () {
        return Math.max(10.0, durationAvg + Math.max(2 * durationSTD, 0.2 * durationAvg));
    };
    
    var findAverage = function (signal, from, to) {
        var result = new CHGD_EC();

        if (from < to) {
            for (var i = from; i <= to; i += 1) {
                var value = signal[i];
                result.xl += value.ec.xl;
                result.yl += value.ec.yl;
                result.xr += value.ec.xr;
                result.yr += value.ec.yr;
            }

            var count = to - from + 1;
            result.xl /= count;
            result.yl /= count;
            result.xr /= count;
            result.yr /= count;
        }

        return result;
    };
    
    var shiftSignal = function (signal, from, to, value) {
        if (from < to) {
            for (var i = from; i <= to; i += 1) {
                var pt = signal[i];
                pt.ec.xl -= value.xl;
                pt.ec.yl -= value.yl;
                pt.ec.xr -= value.xr;
                pt.ec.yr -= value.yr;
            }
        }
    };
    
    var compareSignal = function (signal, from, to, offset) {
        var result = {error: new CHGD_Error(), correl: new CHGD_Error()};

        if (to > from) {
            var xy = new CHGD_Error(),
                x = new CHGD_Error(),
                y = new CHGD_Error(),
                x2 = new CHGD_Error(),
                y2 = new CHGD_Error();
                
            for (var i = from; i <= to; i += 1) {
                var refIdx = Math.round((i - from) / (to - from) * (avgSignal.length - 1));
                var ref = avgSignal[refIdx];
                var _pt = signal[i];
                var pt = new CHGD_EC(_pt.ec.xl - offset.xl, _pt.ec.yl - offset.yl, _pt.ec.xr - offset.xr, _pt.ec.yr - offset.yr);

                result.error.left += Math.sqrt(Math.pow(pt.xl - ref.xl, 2) + Math.pow(pt.yl - ref.yl, 2));
                result.error.right += Math.sqrt(Math.pow(pt.xr - ref.xr, 2) + Math.pow(pt.yr - ref.yr, 2));

                var r1 = new CHGD_Error(
                    Math.sqrt(Math.pow(pt.xl, 2) + Math.pow(pt.yl, 2)),
                    Math.sqrt(Math.pow(pt.xr, 2) + Math.pow(pt.yr, 2)));
                var r2 = new CHGD_Error(
                    Math.sqrt(Math.pow(ref.xl, 2) + Math.pow(ref.yl, 2)),
                    Math.sqrt(Math.pow(ref.xr, 2) + Math.pow(ref.yr, 2)));

                xy.left += r1.left * r2.left;
                x.left += r1.left;
                y.left += r2.left;
                x2.left += Math.pow(r1.left, 2);
                y2.left += Math.pow(r2.left, 2);

                xy.right += r1.right * r2.right;
                x.right += r1.right;
                y.right += r2.right;
                x2.right += Math.pow(r1.right, 2);
                y2.right += Math.pow(r2.right, 2);
            }

            var ampl = new CHGD_Error(
                Math.sqrt(Math.pow(maxSignalChange.xl, 2) + Math.pow(maxSignalChange.yl, 2)),
                Math.sqrt(Math.pow(maxSignalChange.xr, 2) + Math.pow(maxSignalChange.yr, 2)));

            var count = to - from + 1;
            result.error.left = result.error.left / count / ampl.left;
            result.error.right = result.error.right / count / ampl.right;

            try {
                result.correl.left += (count * xy.left - x.left * y.left) /
                        Math.sqrt(count * x2.left - Math.pow(x.left, 2)) /
                        Math.sqrt(count * y2.left - Math.pow(y.left, 2));
                result.correl.right += (count * xy.right - x.right * y.right) /
                        Math.sqrt(count * x2.right - Math.pow(x.right, 2)) /
                        Math.sqrt(count * y2.right - Math.pow(y.right, 2));
            }
            catch(e) { }
        }

        return result;
    };
    
    var addSignal = function (signal, from, to, offset, coef) {
        if (to > from) {
            for (var i = from; i <= to; i++) {
                var refIdx = Math.round((i - from) / (to - from) * (avgSignal.length - 1));
                var ref = avgSignal[refIdx];
                var pt = signal[i];

                ref.xl = (1.0 - coef)*ref.xl + coef*(pt.ec.xl - offset.xl);
                ref.yl = (1.0 - coef)*ref.yl + coef*(pt.ec.yl - offset.yl);
                ref.xr = (1.0 - coef)*ref.xr + coef*(pt.ec.xr - offset.xr);
                ref.yr = (1.0 - coef)*ref.yr + coef*(pt.ec.yr - offset.yr);
            }
        }
    };
    
    var removeEmptySignals = function () {
        for (var i = 0; i < signals.length; i += 1) {
            var signal = signals[i];
            if (signal.length < 2)  {
                signals.splice(i, 1);
                i -= 1;
            }
        }
    };
    
    var getAvg = function (values, invalidValue) {
        var result = 0.0;
        var count = 0;
        for (var i = 0; i < values.length; i += 1) {
            if (values[i] != invalidValue) {
                result += values[i];
                count += 1;
            }
        }

        return count ? result / count : 0.0;
    };

    var getSTD = function (values, avg, invalidValue) {
        var result = 0.0;
        var count = 0;
        for (var i = 0; i < values.length; i += 1) {
            if (values[i] != invalidValue) {
                result += Math.pow(values[i] - avg, 2);
                count += 1;
            }
        }

        return count ? Math.sqrt(result / count) : 0.0;
    };

    var getMaxSignalChange = function (signal) {
        var xlu = Number.MIN_VALUE, xll = Number.MAX_VALUE;
        var ylu = Number.MIN_VALUE, yll = Number.MAX_VALUE;
        var xru = Number.MIN_VALUE, xrl = Number.MAX_VALUE;
        var yru = Number.MIN_VALUE, yrl = Number.MAX_VALUE;
        for (var i = 0; i < signal.length; i += 1) {
            var pt = signal[i];
            if (xlu < pt.xl) xlu = pt.xl;
            if (xll > pt.xl) xll = pt.xl;
            if (ylu < pt.yl) ylu = pt.yl;
            if (yll > pt.yl) yll = pt.yl;
            if (xru < pt.xr) xru = pt.xr;
            if (xrl > pt.xr) xrl = pt.xr;
            if (yru < pt.yr) yru = pt.yr;
            if (yrl > pt.yr) yrl = pt.yr;
        }
        return new CHGD_EC(xlu - xll, ylu - yll, xru - xrl, yru - yrl);
    };

    var getAverageSignal = function (durations, startIndexes) {
        var result = [];

        durationAvg = getAvg(durations, 0);
        durationSTD = getSTD(durations, durationAvg, 0);

        var signalSTD = new CHGD_EC();
        var i, j, idx, s;

        var size = Math.round(durationAvg);
        for (i = 0; i < size; i += 1) {
            var relIdx = i / (size - 1);
            var avgPt = new CHGD_EC();
            var count = 0;

            // find mass center
            for (j = 0; j < signals.length; j += 1) {
                if (!durations[j]) {
                    continue;
                }

                idx = startIndexes[j] + Math.round(relIdx * durations[j]);
                s = signals[j][idx];
                avgPt.xl += s.ec.xl;
                avgPt.yl += s.ec.yl;
                avgPt.xr += s.ec.xr;
                avgPt.yr += s.ec.yr;
                count += 1;
            }
            if (count) {
                avgPt.xl /= count;
                avgPt.yl /= count;
                avgPt.xr /= count;
                avgPt.yr /= count;
            }

            result.push(avgPt);

            // find STD from mass center
            /* signalSTD never used 
            var std = new CHGD_EC();
            for (j = 0; j < signals.length; j += 1) {
                if (!durations[j]) {
                    continue;
                }

                idx = startIndexes[j] + Math.round(relIdx * durations[j]);
                s = signals[j][idx];
                std.xl += Math.pow(avgPt.xl - s.ec.xl, 2);
                std.yl += Math.pow(avgPt.yl - s.ec.yl, 2);
                std.xr += Math.pow(avgPt.xr - s.ec.xr, 2);
                std.yr += Math.pow(avgPt.yr - s.ec.yr, 2);
            }
            if (count) {
                signalSTD.xl += Math.sqrt(std.xl / count);
                signalSTD.yl += Math.sqrt(std.yl / count);
                signalSTD.xr += Math.sqrt(std.xr / count);
                signalSTD.yr += Math.sqrt(std.yr / count);
            }
            */
        }

        /*
        if (size) {
            signalSTD.xl /= size;
            signalSTD.yl /= size;
            signalSTD.xr /= size;
            signalSTD.yr /= size;
        }*/
        
        return result;
    };
    
    var getTrialsMetadata = function () {
        var startIndexes = [];
        var durations = [];
        var zeroSignalSizeCount = 0;
        
        var threshold = settings.calibration.threshold;
        var i, j, idx, s, endIdx;

        // search gesture start, end and duration in each trial
        for (i = 0; i < signals.length; i += 1) {
            var signal = signals[i];
            startIndexes[i] = findSignificantChange(signal, 0, 1, signal.length, 1);
            endIdx = findSignificantChange(signal, signal.length - 1, signal.length - 2, 0, -1);

            var to = startIndexes[i] < 0 ? signal.length - 1 : startIndexes[i] - 1;
            var startAvg = findAverage(signal, 0, to);
            var from = endIdx < 0 ? 0 : endIdx + 1;
            var endAvg = findAverage(signal, from, signal.length - 1);
            shiftSignal(signal, 0, signal.length - 1, startAvg);

            var dl = Math.sqrt(Math.pow(startAvg.xl - endAvg.xl, 2) + Math.pow(startAvg.yl - endAvg.yl, 2));
            var dr = Math.sqrt(Math.pow(startAvg.xr - endAvg.xr, 2) + Math.pow(startAvg.yr - endAvg.yr, 2));
            if (startIndexes[i] >= 0 && endIdx >= 0 && startIndexes[i] < endIdx && dl < threshold && dr < threshold) {
                durations.push(endIdx - startIndexes[i] + 1);
            }
            else {
                durations.push(0);
                zeroSignalSizeCount++;
            }
        }
        
        return {
            startIndexes: startIndexes,
            durations: durations,
            zeroSignalSizeCount: zeroSignalSizeCount
        };
    };

    var processTrialsData = function () {
        if (signals.length < calibCount) {
            return;
        }

        removeEmptySignals();
        
        var processed = getTrialsMetadata();

        var success = processed.zeroSignalSizeCount < signals.length / 2;
        if (success) {
            avgSignal = getAverageSignal(processed.durations, processed.startIndexes);
            maxSignalChange = getMaxSignalChange(avgSignal);
        }
    };

    var invalidate = function () {
        calibPlot.fillStyle = 'white';
        calibPlot.fillRect(0, 0, canvas.width, canvas.height);
        
        if (text.length > 0) {
            drawText(text);
        }
    };
    
    var drawText = function (lines) {
        var w = canvas.width,
            h = canvas.height;
        var textSize = 24;
        calibPlot.font = textSize + 'px Arial';
        calibPlot.textAlign = 'center';
        calibPlot.textBaseline = 'middle';
        calibPlot.fillStyle = '#444';
        lines.forEach(function (line, i) {
            calibPlot.fillText(line, Math.round(w/2), Math.round(h/2) + textSize * 1.5 * (i - (lines.length - 1) / 2));
        });
    };
    
    var drawSignal = function (signal) {
        var w = canvas.width,
            h = canvas.height;
        var drawEye = function (eye) {
            calibPlot.beginPath();
            for (var i = 0; i < signal.length; i += 1) {
                var pt = signal[i];
                if (i === 0) {
                    calibPlot.moveTo(pt.ec['x' + eye] * w, pt.ec['y' + eye] * h);
                } else {
                    calibPlot.lineTo(pt.ec['x' + eye] * w, pt.ec['y' + eye] * h);
                }
            }
            calibPlot.stroke();
        };
        calibPlot.strokeStyle = 'black';
        calibPlot.lineWidth = 2;
        if (signal) {
            drawEye('l');
            drawEye('r');
        }
    };
    
    var drawPoint = function (point) {
        var w = canvas.width,
            h = canvas.height;
        calibPlot.fillStyle = 'red';
        calibPlot.beginPath();
        calibPlot.arc(point.ec.xl * w, point.ec.yl * h, 3, 0, 2 * Math.PI);
        calibPlot.arc(point.ec.xr * w, point.ec.yr * h, 3, 0, 2 * Math.PI);
        calibPlot.fill();
    };

    var onTrainingDetectorTimeout = function () {
        detectedOnLastAttempt = false;
    };
    
    var nextStep = function (self) {
        calibrationTimer = null;
        var interval = 0;
        controllerCmd += 1;
        if (controllerCmd < 2 * calibCount) {
            if (controllerCmd % 2 === 1) {
                currentSignal = [];
                signals.push(currentSignal);
                interval = settings.calibration.trialDuration;
                text = [];
                if (onCalibStateChanged) {
                    onCalibStateChanged('start');
                }
            }
            else {
                currentSignal = null;
                interval = settings.calibration.pauseDuration;
                text = ['Gesture recorded', 'Prepare for the next'];
                if (onCalibStateChanged) {
                    onCalibStateChanged('stop');
                }
            }
        }
        else if (controllerCmd === 2 * calibCount) {
            currentSignal = null;
            interval = 1000;
            text = [];
            if (onCalibStateChanged) {
                onCalibStateChanged('stop');
            }
        }
        else if (controllerCmd === 2 * calibCount + 1) {
            text = ['Processing data', 'Please wait...'];
            invalidate();
            if (onCalibStateChanged) {
                onCalibStateChanged('processing');
            }

            processTrialsData();
            interval = 2000;

            text = ['Done!'];
            if (onCalibStateChanged) {
                onCalibStateChanged('processed');
            }
        }
        else if (controllerCmd === 2 * (calibCount + 1)) {
            text = [];
            self.hide(true);
            if (onCalibStateChanged) {
                onCalibStateChanged('finished');
            }
        }
        
        invalidate();
        if (interval) {
            calibrationTimer = setTimeout(nextStep, interval, self);
        }
    };
    
    //-------------------------------------------------
    this.getBufferSize = function () {
        return durationAvg + 4 * durationSTD + 20;
    };
    
    this.init = function (callback) {
        onCalibStateChanged = callback;
        
        signals = [];
        avgSignal = null;
        currentSignal = null;
        controllerCmd = 0;
        detectedOnLastAttempt = false;
        canAddSignal = true;

        this.show();
        calibrationTimer = setTimeout(nextStep, pauseDuration + 1500, this);
        
        text = ['Task: ' + calibCount + ' head gesture' + (calibCount > 1 ? 's' : ''), 'Prepare for the first gesture'];
        invalidate();
    };
    
    this.finilize = function () {
        currentSignal = null;
    };
    
    this.detect = function (signal, canUseAsRef) {
        var result = { detected: false };
        
        if (!avgSignal)
            return result;

        var frontChangeIdx = findSignificantChange(signal, 0, 1, signal.length - 1, 1);
        var backChangeIdx = findSignificantChange(signal, signal.length - 1, signal.length - 1, 0, -1);
        
        var offset, r = {error: new CHGD_Error(), correl: new CHGD_Error()};

        var size = backChangeIdx - frontChangeIdx + 1;
        if (frontChangeIdx > 0 && backChangeIdx > 0 && backChangeIdx > frontChangeIdx &&
                size > getMinGestureDuration() && size < getMaxGestureDuration()) {
            result.detected = true;
            offset = findAverage(signal, 0, frontChangeIdx - 1);
            r = compareSignal(signal, frontChangeIdx, backChangeIdx, offset);

            if (r.error.left > errorThreshold || r.error.right > errorThreshold ||
                r.correl.left < correlThreshold || r.correl.right < correlThreshold) {
                
                result.detected = false;
                canAddSignal = true;
            }

            if (result.detected && canUseAsRef && canAddSignal && frontChangeIdx > 10 && backChangeIdx < signal.length - 1) {
                addSignal(signal, frontChangeIdx, backChangeIdx, offset, 0.3);
                canAddSignal = false;
            }
        }

        if (result.detected) {
            result.detected = signal[frontChangeIdx - 1].focused;
        }

        if (result.detected && !detectedOnLastAttempt) {
            detectedOnLastAttempt = true;
            setTimeout(onTrainingDetectorTimeout, 1000);
        }

        return result;
    };
    
    this.feed = function (point) {
        if (currentSignal) {
            currentSignal.push(point);
        }
        invalidate();
        if (text.length === 0) {
            drawSignal(currentSignal);
            drawPoint(point);
        }
    };
    
    this.show = function () {
        calibrationPanel.style.display = 'block';
    };
    
    this.hide = function (closedByUser) {
        calibrationPanel.style.display = 'none';
        if (calibrationTimer) {
            clearTimeout(calibrationTimer);
            calibrationTimer = null;
        }
        if (closedByUser && onClosed) {
            onClosed();
        }
    };
}

function CustomHeadGestureDetector(_name, settings) {
    this.modes = {
        none: 0,
        calibration: 1,
        training: 2,
        detection: 3,
    };
    
    this.current = null;
    
    var calibrator = new CustomHeadGestureCalibrator(settings, function () {
        // handle the closing event caused by user (the calibration was terminated)
    });
    
    var name = _name;
    var mode = this.modes.none;
    var signal = null;
    
    var isGesture = false;
    var lastGestureDetectionTime = 0;
    var lastValidPoint = new CHGD_Point();
    var isLastWasValid = true;
    
    var correctInvalidPoints = function (timestamp, ec) {
        var i;
        var prevValidIdx = signal.length;
        for (i = signal.length - 1; i >= 0; i -= 1) {
            if (signal[i].isValid()) {
                prevValidIdx = i;
                break;
            }
        }
        if (prevValidIdx < signal.length) {
            var count = signal.length - prevValidIdx;
            var vp = signal[prevValidIdx];
            for (i = prevValidIdx + 1; i < signal.length; i += 1) {
                var rate = (i - prevValidIdx) / count;
                signal[i] = new CHGD_Point(vp.timestamp + (timestamp - vp.timestamp) * rate, {
                            xl: vp.ec.xl + (ec.xl - vp.xl) * rate,
                            yl: vp.ec.yl + (ec.yl - vp.yl) * rate,
                            xr: vp.ec.xr + (ec.xr - vp.xr) * rate,
                            yr: vp.ec.yr + (ec.yr - vp.yr) * rate
                        },
                        signal[i].focused);
            }
        }
    };

    var processSignal = function (timestamp) {
        var isRelieableTime = (timestamp - lastGestureDetectionTime) > settings.detection.minPause;
        var canUseAsRef = settings.detection.alterRefSignalOnDetection && !isGesture && isRelieableTime;

        var result = {};
        if (mode === this.modes.training) {
            result = calibrator.detect(signal, canUseAsRef);
            calibrator.feed(lastValidPoint);
        }
        else if (mode === this.modes.detection) {
            result = calibrator.detect(signal, canUseAsRef);
            if (!isGesture && isRelieableTime) {
                result.valid = true;
            }
        }

        if (result.detected) {
            lastGestureDetectionTime = timestamp;
        }

        isGesture = !!result.detected;
        
        return result;
    };
    
    this.getName = function () {
        return name;
    };
    
    this.init = function (_mode, callback) {
        mode = _mode;
        
        this.current = null;
        
        signal = mode === this.modes.calibration ? null : [];

        isGesture = false;
        lastGestureDetectionTime = 0;
        lastValidPoint = new CHGD_Point();
        isLastWasValid = true;
        
        if (mode === this.modes.calibration) {
            calibrator.init(callback);
        }
    };

    this.finilize = function () {
        calibrator.finilize();
        signal = null;
        mode = this.modes.none;
    };

    this.feed = function(timestamp, ec, focused) {
        if (mode == this.modes.none) {
            return null;
        }

        var valid = true;
        if (lastValidPoint.isSet())
        {
            var dxl = lastValidPoint.ec.xl - ec.xl;
            var dyl = lastValidPoint.ec.yl - ec.yl;
            var dxr = lastValidPoint.ec.xr - ec.xr;
            var dyr = lastValidPoint.ec.yr - ec.yr;
            valid = Math.sqrt(Math.pow(dxl, 2) + Math.pow(dyl, 2)) < 0.2 &&
                    Math.sqrt(Math.pow(dxr, 2) + Math.pow(dyr, 2)) < 0.2;
        }

        if (valid) {
            lastValidPoint = new CHGD_Point(timestamp, ec, focused);

            if (!isLastWasValid && signal && signal.length > 0) {
                correctInvalidPoints(timestamp, ec);
            }
        } else {
            lastValidPoint.timestamp = -1;
        }

        isLastWasValid = valid;

        if (mode === this.modes.calibration) {
            calibrator.feed(lastValidPoint);
        }
        else if (signal.length === calibrator.getBufferSize()) {
            signal.shift();
            signal.push(lastValidPoint);

            if (valid) {
                var result = processSignal.call(this, timestamp);
                this.current = result.valid ? result.detected : null;
            }
        }
        else {
            signal.push(lastValidPoint);
        }
        
        return this.current;
    };
}
