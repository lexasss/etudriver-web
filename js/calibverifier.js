// Calibration verification routine.
// Calibration verification routine.
// User have to look at targets located in the center of grid's cells.
// The target are displayed sequentially for a short time.
// When the verification routine is finished, it computes a value representing the accuracy of gaze pointing.
//
// requires utils.js

function CalibrationVerifier(customSettings) {
    'use strict';

    var container;
    var target;
    var pulsator;
    var canvas, ctx;
    var ratingContainer;
    var close;
    var testPoints = [];
    var settings = customSettings;
    var callbacks;

    var moveStepDuration = 20;
    var dataCollectionDelay = 500;
    var pulsationInterval = 20;

    var delayedFullScreenExitTimer, pulsationTimer = 0;
    var moveFromLocation, moveTo, moveStepCount;
    var currentMoveStep;
    var currentPointIndex = -1;
    var dataCollectionStartTime;
    var canCollectData = false;
    var screenSize;

    var fullScreen = new FullScreen();

    var onFullScreenChanged = function (e) {
        debug('CalibrationVerifier', 'onFullScreenChanged, e = ');
        console.log(e);

        if (currentPointIndex >= 0) {
            return;
        }
        if (fullScreen.isActive) {
            start();
        }
    };

    var onFullScreenError = function (e) {
        debug('CalibrationVerifier', 'onFullScreenError, e = ');
        console.log(e);
    };

    fullScreen.addEventListener('change', onFullScreenChanged);
    fullScreen.addEventListener('error', onFullScreenError);

    this.run = function (customSettings, customCallbacks) {
        callbacks = extend(true, {}, customCallbacks);
        settings = extend(true, {}, settings, customSettings);
        screenSize = getScreenSize();

        fillLocations();
        if (!container) {
            createUI();
        }
        pulsator.style.display = 'none';
        canvas.style.display = 'none';
        ratingContainer.style.display = 'none';
        close.style.display = 'none';
        
        if (settings.display) {
            container.style.display = 'block';
            target.style.display = 'block';

            if (!fullScreen.isActive) {
                fullScreen.request(container);
            } else if (currentPointIndex < 0) {
                start();
            }
        } else if (currentPointIndex < 0) {
            container.style.display = 'none';
            target.style.display = 'none';
            start();
        }
    };

    this.feed = function (ts, x, y) {
        if (canCollectData) {
            testPoints[currentPointIndex].samples.push({ts: ts, x: x, y: y});
        }
    };

    this.isActive = function () {
        return canCollectData;
    };

    // Private methods
    var createUI = function () {
        container = document.createElement('div');
        container.className = 'etud-calibVerifier-container';
        container.classList.add(settings.className.container);

        target = document.createElement('div');
        target.className = 'etud-calibVerifier-target';
        target.classList.add(settings.className.target);
        target.style.width = settings.size + 'px';
        target.style.height = settings.size + 'px';
        target.style.borderRadius = settings.size / 2 + 'px';

        pulsator = document.createElement('div');
        pulsator.className = 'etud-calibVerifier-pulsator';
        pulsator.classList.add(settings.className.pulsator);

        canvas = document.createElement('canvas');
        canvas.width = screenSize.width;
        canvas.height = screenSize.height;
        canvas.className = 'etud-calibVerifier-canvas';
        canvas.addEventListener('click', hideUI);
        canvas.addEventListener('keyup', hideUI);

        ratingContainer = document.createElement('div');
        ratingContainer.className = 'etud-calibVerifier-rating';
        var ratingLabels = ['Amplitude', 'Uniformity'];
        
        for (var i = 0; i < 2; ++i) {
            if (i > 0) {
                var spacer = document.createElement('div');
                spacer.className = 'spacer';
                ratingContainer.appendChild(spacer);
            }
            
            var label = document.createElement('span');
            label.textContent = ratingLabels[i];
            ratingContainer.appendChild(label);
            
            for (var j = 0; j < 5; ++j) {
                var star = document.createElement('div');
                star.className = 'star empty';
                ratingContainer.appendChild(star);
            }
        }
        
        close = document.createElement('div');
        close.className = 'close';
        close.addEventListener('click', hideUI);

        container.appendChild(canvas);
        container.appendChild(pulsator);
        container.appendChild(target);
        container.appendChild(ratingContainer);
        container.appendChild(close);
        document.body.appendChild(container);

        ctx = canvas.getContext('2d');
    };

    var fillLocations = function () {
        testPoints = [];

        for (var i = 0; i < settings.rows; i++) {
            for (var j = 0; j < settings.columns; j++) {
                testPoints.push({
                    location: {
                        x: (j + 0.5) / settings.columns,
                        y: (i + 0.5) / settings.rows
                    },
                    cell: {
                        row: i,
                        col: j
                    },
                    samples: []
                });
            }
        }

        for (i = 0; i < 3*testPoints.length; i++) {
            var idx1 = getRandomInt(testPoints.length - 1);
            var idx2 = getRandomInt(testPoints.length - 1);
            var tmp = testPoints[idx1];
            testPoints[idx1] = testPoints[idx2];
            testPoints[idx2] = tmp;
        }
    };

    var start = function () {
        debug('CalibrationVerifier', 'starting the verification');
        currentMoveStep = 0;
        moveStepCount = Math.floor(settings.transitionDuration / moveStepDuration) + 1;
        next();
    };

    var next = function () {
        canCollectData = false;
        pulsator.style.display = 'none';
        clearInterval(pulsationTimer);
        pulsationTimer = 0;

        if (currentPointIndex >= 0 && callbacks.targetFinished) {
            debug('CalibrationVerifier', 'collected ' + moveTo.samples.length + ' samples');
            var nextTarget = currentPointIndex + 1 === testPoints.length ? null : testPoints[currentPointIndex + 1];
            if (nextTarget) {
                nextTarget = {
                    location: clone(nextTarget.location),
                    cell: clone(nextTarget.cell)
                }
            };
            callbacks.targetFinished(moveTo, nextTarget);
        }

        currentPointIndex++;

        if (currentPointIndex === 0 && callbacks.started) {
            var firstTarget = testPoints[0];
            var nextTarget = {
                location: clone(firstTarget.location),
                cell: clone(firstTarget.cell)
            };
            callbacks.started(nextTarget);
        }

        if (currentPointIndex < testPoints.length) {
            debug('CalibrationVerifier', 'target #' + currentPointIndex);
            if (settings.transitionDuration > 0) {
                debug('CalibrationVerifier', 'animating');
                moveFromLocation = currentPointIndex === 0 ? {x: 0, y: 0} : moveTo.location;
                moveTo = testPoints[currentPointIndex];
                setTimeout(move, moveStepDuration);
            } else {
                moveTo = testPoints[currentPointIndex];
                show();
            }
        } else {
            if (settings.displayResults) {
                delayedFullScreenExitTimer = setTimeout(hideUI, 1000 * settings.displayResults);
            }
            currentPointIndex = -1;
            reportResult();
        }
    };

    var move = function () {
        currentMoveStep++;
        if (currentMoveStep < moveStepCount) {
            var dx = (moveTo.location.x - moveFromLocation.x) / moveStepCount;
            var dy = (moveTo.location.y - moveFromLocation.y) / moveStepCount;
            showAt(moveFromLocation.x + dx * currentMoveStep, moveFromLocation.y + dy * currentMoveStep);
            setTimeout(move, moveStepDuration);
        }
        else {
            currentMoveStep = 0;
            show();
        }
    };

    var showAt = function (x, y) {
        target.style.left = (Math.round(x * screenSize.width) - settings.size/2) + 'px';
        target.style.top = (Math.round(y * screenSize.height) - settings.size/2) + 'px';
    };

    var show = function () {
        debug('CalibrationVerifier', 'target is displaying');
        var testPoint = testPoints[currentPointIndex];
        showAt(testPoint.location.x, testPoint.location.y);

        setTimeout(startDataCollection, dataCollectionDelay);
        setTimeout(next, settings.duration);

        if (callbacks.targetStarted) {
            var currentTarget = {
                location: clone(testPoint.location),
                cell: clone(testPoint.cell)
            }
            callbacks.targetStarted(currentTarget);
        }
    };

    var startDataCollection = function () {
        if (settings.pulsation.enabled) {
            pulsate();
            pulsator.style.display = 'block';
            dataCollectionStartTime = (new Date()).getTime();
            pulsationTimer = setInterval(pulsate, pulsationInterval);
        }
        canCollectData = true;
    };

    var pulsate = function () {
        var duration = (new Date()).getTime() - dataCollectionStartTime;
        var angle = Math.PI * ((duration / settings.pulsation.duration) % 1);
        var size = Math.sin(angle) * settings.pulsation.size;

        var testPoint = testPoints[currentPointIndex];
        pulsator.style.left = (Math.round(testPoint.location.x * screenSize.width) - settings.size/2 - size) + 'px';
        pulsator.style.top = (Math.round(testPoint.location.y * screenSize.height) - settings.size/2 - size) + 'px';
        pulsator.style.width = (settings.size + 2*size) + 'px';
        pulsator.style.height = (settings.size + 2*size) + 'px';
        pulsator.style.borderRadius = (settings.size + 2*size)/2 + 'px';
    };

    var reportResult = function () {
        debug('CalibrationVerifier', 'reporting results');
        var i, len;

        target.style.display = 'none';
        canvas.style.display = 'block';
        ratingContainer.style.display = 'block';
        close.style.display = 'block';

        ctx.clearRect(0, 0, screenSize.width, screenSize.height);
        ctx.font = '16pt Arial';

        var pointStats = [];
        var avg = {
            amplitude: {mean: 0, std: 0},
            angle: {mean: {sin: 0, cos: 0}, std: 0},
            std: {mean: 0, std: 0},
            targets: [],
            apx: {},
            interpretation: []
        };

        // creates zeroed array for approximation
        var avgH = Array.apply(null, new Array(settings.columns)).map(function() { return 0; });
        var avgV = Array.apply(null, new Array(settings.rows)).map(function() { return 0; });

        // for each location
        for (i = 0, len = testPoints.length; i < len; ++i) {
            var testPoint = testPoints[i];
            var point = {
                x: testPoint.location.x * screenSize.width, 
                y: testPoint.location.y * screenSize.height
            };

            ctx.fillStyle = settings.resultColors.target;
            ctx.beginPath();
            ctx.arc(Math.round(point.x), Math.round(point.y), settings.size/2, 0, 2*Math.PI);
            ctx.fill();

            var stats = calcTargetStats(testPoint.samples, point);
            if (stats) {
                stats.location = point;
                stats.cell = testPoint.cell;
                avg.targets.push(stats);
                avg.amplitude.mean += stats.amplitude.abs;
                avg.angle.mean.sin += Math.sin(stats.angle);
                avg.angle.mean.cos += Math.cos(stats.angle);
                avg.std.mean += stats.std;

                avgH[testPoint.cell.col] += stats.amplitude.h;
                avgV[testPoint.cell.row] += stats.amplitude.v;

                ctx.fillStyle = settings.resultColors.offset;
                ctx.beginPath();
                ctx.arc(Math.round(point.x + stats.amplitude.abs * Math.cos(stats.angle)),
                        Math.round(point.y + stats.amplitude.abs * Math.sin(stats.angle)),
                        stats.std, 0, 2*Math.PI);
                ctx.fill();
            }
        }

        if (avg.targets.length > 0) {
            avg.amplitude.mean /= avg.targets.length;
            avg.angle.mean.sin /= avg.targets.length;
            avg.angle.mean.cos /= avg.targets.length;
            avg.std.mean /= avg.targets.length;

            for (i = 0, len = avg.targets.length; i < len; ++i) {
                var targetStat = avg.targets[i];
                avg.amplitude.std += Math.pow(targetStat.amplitude.abs - avg.amplitude.mean, 2);
                avg.std.std += Math.pow(targetStat.std - avg.std.mean, 2);
            }
            avg.amplitude.std = Math.sqrt(avg.amplitude.std / (len - 1));
            avg.std.std = Math.sqrt(avg.std.std / (len - 1));

            avg.angle.std = Math.sqrt(Math.pow(avg.angle.mean.sin, 2) + Math.pow(avg.angle.mean.cos, 2));
            avg.angle.mean = Math.atan2(avg.angle.mean.sin, avg.angle.mean.cos);

            // Modify the approximation arrays
            avgH = avgH.map(function (elem, index) {
                return {
                    x: (2 * index + 1) / settings.columns - 1,
                    y: elem / settings.rows
                };
            });
            avgV = avgV.map(function (elem, index) {
                return {
                    x: (2 * index + 1) / settings.rows - 1,
                    y: elem / settings.columns
                };
            });

            avg.apx =  {
                h: approximate(avgH, 2),
                v: approximate(avgV, 2)
            };

            var canInterpretate = !!(avg.apx.h && avg.apx.v);
            if (canInterpretate) {
                var interpretationH = interpretateDirection(avg.apx.h, ['left', 'right']);
                var interpretationV = interpretateDirection(avg.apx.v, ['top', 'bottom']);
                avg.interpretation = interpretate(interpretationH, interpretationV, avg.amplitude);

                ctx.fillStyle = settings.resultColors.text;
                ctx.fillText(avg.interpretation.text[1], 10, screenSize.height - 50);
                ctx.fillText(avg.interpretation.text[0], 10, screenSize.height - 25);

                var stars = ratingContainer.querySelectorAll('.star');
                for (i = 0, len = stars.length; i < len; ++i) {
                    var star = stars[i];
                    var rating = i < 5 ? avg.interpretation.rating.amplitude : avg.interpretation.rating.uniformity;
                    var value = rating / 2 - (i % 5);
                    if (value > 0.75) {
                        star.className = 'star full';
                    } else if (value > 0.25) {
                        star.className = 'star half';
                    } else {
                        star.className = 'star empty';
                    }
                }
            }
        }

        if (callbacks.finished) {
            callbacks.finished(avg);
        }
    };

    var calcTargetStats = function (samples, point) {
        var offset = {x: 0, y: 0};
        var result = null;
        var sample, i, len;

        ctx.fillStyle = settings.resultColors.sample;

        for (i = 0, len = samples.length; i < len; ++i) {
            sample = samples[i];

            // TODO: some outliers filtering

            offset.x += sample.x - point.x;
            offset.y += sample.y - point.y;

            ctx.beginPath();
            ctx.arc(Math.round(sample.x), Math.round(sample.y), 2, 0, 2*Math.PI);
            ctx.fill();
        }

        if (samples.length > 1) {
            offset.x /= samples.length;
            offset.y /= samples.length;

            var amplitude = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            var angle = Math.atan2(offset.y, offset.x);

            var std = 0;
            var avg = {x: point.x + offset.x, y: point.y + offset.y};
            for (i = 0, len = samples.length; i < len; ++i) {
                sample = samples[i];
                var dx = sample.x - avg.x;
                var dy = sample.y - avg.y;
                std += dx * dx + dy * dy;   // ^2 and sqrt compensate each other
            }
            std = Math.sqrt(std / (len - 1));
            result = {
                amplitude: {
                    h: Math.abs(offset.x),
                    v: Math.abs(offset.y),
                    abs: amplitude
                },
                angle: angle,
                std: std
            };
        }

        return result;
    };

    // Approximation of a polynomial function using the least-squares method
    // from http://www.alexeypetrov.narod.ru/C/sqr_less_about.html
    var approximate = function (data, K) {
        // init
        var i, j, k;
        var N = data.length;
        if (N < K + 1) {
            return null;
        }

        var a = new Array(K + 1);
        var b = new Array(K + 1);
        var x = new Array(N);
        var y = new Array(N);
        var sums = new Array(K + 1);
        for (k = 0; k < N; ++k) {
            var d = data[k];
            x[k] = d.x;
            y[k] = d.y;
        }
        for (i = 0; i <= K; ++i) {
            a[i] = 0;
            b[i] = 0;
            sums[i] = new Array(K + 1);
            for (j = 0; j <= K; ++j) {
                sums[i][j] = 0;
                for (k = 0; k < N; ++k) {
                    sums[i][j] += Math.pow(x[k], i+j);
                }
            }
        }
        for (i = 0; i <= K; ++i) {
            for (k = 0; k < N; ++k) {
                b[i] += Math.pow(x[k], i) * y[k];
            }
        }

        // diagonal
        var temp = 0;
        for (i = 0; i <= K; ++i) {
            if (sums[i][i] === 0) {
                for (j = 0; j <= K; ++j) {
                    if (j === i) continue;
                    if (sums[j][i] !== 0 && sums[i][j] !== 0) {
                        for (k = 0; k <= K; ++k) {
                            temp = sums[j][k];
                            sums[j][k] = sums[i][k];
                            sums[i][k] = temp;
                        }
                        temp = b[j];
                        b[j] = b[i];
                        b[i] = temp;
                        break;
                    }
                }
            }
        }

        for (k = 0; k <= K; ++k) {
           for (i = k + 1; i <= K; ++i) {
                if (sums[k][k] === 0) {
                   //printf("\nSolution does not exist.\n");
                   return null;
                }
                var M = sums[i][k] / sums[k][k];
                for (j = k; j <= K; ++j) {
                    sums[i][j] -= M * sums[k][j];
                }
                b[i] -= M*b[k];
            }
        }

        for (i = K; i >= 0; --i) {
            var s = 0;
            for (j = i; j <= K; ++j) {
                s += sums[i][j] * a[j];
            }
            a[i] = (b[i] - s) / sums[i][i];
        }

        return a;
    };

    var interpretateDirection = function (a, sides) {
        var compute = function (a, x) {
            var result = 0;
            for (var i = 0, len = a.length; i < len; ++i) {
                result += a[i] * Math.pow(x, i);
            }
            return result;
        };

        var threshold = settings.interpretationThreshold;

        // compute the values on the one side, center and other side of the screen
        var y = [compute(a, -1), compute(a, 0), compute(a, 1)];

        // compute relative differences: side1/center, side2/center, side1/side2
        var diff = [(y[0] - y[1]) / threshold, (y[2] - y[1]) / threshold, (y[0] - y[2]) / threshold];

        // comparison states
        var better = -1;
        var same = 0;
        var worse = 1;

        // convert the relative differences into states
        var diff2state = function (value) {
            var result = same;
            if (value <= -1) {
                result = better;
            }
            else if (value >= 1) {
                result = worse;
            }
            return result;
        };

        // lets have states for each comparison pair
        diff = diff.map(diff2state);

        var side1 = 0,
            center = 1,
            side2 = 2;

        var intrp = [Number.NaN, Number.NaN, Number.NaN];
        var intrpVal = {
            muchWorse: -2,
            worse: -1,
            equal: 0,
            better: 1,
            muchBetter: 2
        };

        var interpTypes = {
            flat: 'flat',
            lowGradient: 'low gradient',
            highGradient: 'high gradient',
            side: 'high side',
            lowCone: 'low cone',
            highCone: 'high cone'
        };
        var interpType;

        if (diff[0] === better && diff[1] === better) {
            intrp[center] = intrpVal.muchWorse;
            interpType = interpTypes.highCone;
        } else if (diff[0] === worse && diff[1] === worse) {
            intrp[center] = intrpVal.muchBetter;
            interpType = interpTypes.highCone;
        } else if (diff[0] === better && diff[1] === same && diff[2] === better) {
            intrp[side1] = intrpVal.muchBetter;
            interpType = interpTypes.side;
        } else if (diff[0] === better && diff[1] === same && diff[2] === same) {
            intrp[side1] = intrpVal.better;
            intrp[center] = intrpVal.worse;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === better && diff[1] === worse && diff[2] === better) {
            intrp[side1] = intrpVal.better;
            intrp[side2] = intrpVal.worse;
            interpType = interpTypes.highGradient;
        } else if (diff[0] === same && diff[1] === better && diff[2] === same) {
            intrp[side2] = intrpVal.better;
            intrp[center] = intrpVal.worse;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === same && diff[1] === better && diff[2] === worse) {
            intrp[side2] = intrpVal.muchBetter;
            interpType = interpTypes.side;
        } else if (diff[0] === same && diff[1] === same && diff[2] === better) {
            intrp[side1] = intrpVal.better;
            interpType = interpTypes.lowGradient;
        } else if (diff[0] === same && diff[1] === same && diff[2] === same) {
            intrp[center] = intrpVal.equal;
            interpType = interpTypes.flat;
        } else if (diff[0] === same && diff[1] === same && diff[2] === worse) {
            intrp[side2] = intrpVal.better;
            interpType = interpTypes.lowGradient;
        } else if (diff[0] === same && diff[1] === worse && diff[2] === better) {
            intrp[side2] = intrpVal.muchWorse;
            interpType = interpTypes.side;
        } else if (diff[0] === same && diff[1] === worse && diff[2] === same) {
            intrp[side2] = intrpVal.worse;
            intrp[center] = intrpVal.better;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === worse && diff[1] === better && diff[2] === worse) {
            intrp[side1] = intrpVal.worse;
            intrp[side2] = intrpVal.better;
            interpType = interpTypes.highGradient;
        } else if (diff[0] === worse && diff[1] === same && diff[2] === same) {
            intrp[side1] = intrpVal.worse;
            intrp[center] = intrpVal.better;
            interpType = interpTypes.lowCone;
        } else if (diff[0] === worse && diff[1] === same && diff[2] === worse) {
            intrp[side1] = intrpVal.muchWorse;
            interpType = interpTypes.side;
        }

        var rating = ['much worse', 'worse', '', 'better', 'much better'];

        var at = ' at ';
        var to = ' to ';
        var worseningFrom = 'gradually worsening from ';

        var result = [];
        if (!isNaN(intrp[center])) {
            if (!isNaN(intrp[side1])) {
                result.push(rating[intrp[side1]+2] + at + sides[0]);
            } else if (!isNaN(intrp[side2])) {
                result.push(rating[intrp[side2]+2] + at + sides[1]);
            }
            if (intrp[center] !== 0) {
                result.push(rating[intrp[center]+2] + at + 'center');
            } else {
                result.push('about equal');
            }
        } else if (!isNaN(intrp[side1])) {
            if (!isNaN(intrp[side2])) {
                if (intrp[side1] > intrp[side2]) {
                    result.push(worseningFrom + sides[0] + to + sides[1]);
                } else {
                    result.push(worseningFrom + sides[1] + to + sides[0]);
                }
            } else {
                result.push(rating[intrp[side1]+2] + at + sides[0]);
            }
        } else if (!isNaN(intrp[side2])) {
            result.push(rating[intrp[side2]+2] + at + sides[1]);
        }

        return {text: result, type: interpType};
    };

    var interpretate = function (intrpH, intrpV, amplitude) {
        var success = [];
        var failed = [];
        var text;

        // compound the interpretations, successful and failed separately
        if (intrpH.text.length) {
            success.push(intrpH.text.join(', ') + ' in the horizontal dimension');
        } else {
            failed.push(' horizontal');
        }

        if (intrpV.text.length) {
            success.push(intrpV.text.join(', ') + ' in the vertical dimension');
        } else {
            failed.push(' vertical');
        }

        if (success.length > 0) {
            text = success.join(', ');
            success = ['Interpretation: calibration is ', text, '.'];
        }
        if (failed.length > 0) {
            text = failed.join(' and ');
            failed = ['Cannot interpretate results for the ', text, ' dimension.'];
        }

        // estimate the overall calibration quality ratings
        var amplitude = 10 - Math.floor(2 * amplitude.mean / settings.interpretationThreshold);

        var test = function (what, where) {
            return (new RegExp(what)).test(where);
        };

        var uniformity = 10;
        uniformity -= test('gradient|cone|side', intrpH.type) ? 2 : 0;
        uniformity -= test('gradient|cone|side', intrpV.type) ? 2 : 0;
        uniformity -= test('high', intrpH.type) ? 2 : 0;
        uniformity -= test('high', intrpV.type) ? 2 : 0;

        var result = {
            text: [
                success.join(''), 
                failed.join('')
            ], 
            rating: {
                amplitude: Math.max(1, amplitude),
                uniformity: Math.max(1, uniformity),
            }
        };
        return result;
    };

    var hideUI = function () {
        container.style.display = 'none';
        fullScreen.exit();

        if (delayedFullScreenExitTimer) {
            clearTimeout(delayedFullScreenExitTimer);
            delayedFullScreenExitTimer = 0;
        }
    };
}