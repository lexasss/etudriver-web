// Reading model: fixation start detetor, definition of fixation and sacccade
// 
// Depends:
//      GazeTargets.Models.Reading.Zone

(function (root) {

    'use strict';

    var Fixations = {

        init: function (_minDuration, _threshold, _sampleDuration) {
            minDuration = _minDuration || 80;
            threshold = _threshold || 70;
            sampleDuration = _sampleDuration || 33;
            
            zones = GazeTargets.Models.Reading.Zone;
            logger = root.GazeTargets.Logger;

            currentFixation = new Fixation(-10000, -10000, Number.MAX_VALUE);
            currentFixation.saccade = new Saccade(0, 0);
            candidate = null;
        },

        feed: function (data1, data2) {

            var result;
            if (data2) {    // this is smaple
                result = parseSample(data1, data2);
            }
            else {
                result = parseFixation(data1);
            }
            return result;
        },

        reset: function () {
            // fixations.forEach(function (value) {
            //     logger.log('{ x: ' + value.x + 
            //         ', y: ' + value.y + 
            //         ', d: ' + value.duration + ' },');
            // });
            fixations.length = 0;

            currentFixation = new Fixation(-10000, -10000, Number.MAX_VALUE);
            currentFixation.saccade = new Saccade(0, 0);
            candidate = null;
        },

        current: function() {
            return currentFixation;
        }
    };

    // internal
    var minDuration;
    var threshold;
    var sampleDuration;

    var fixations = [];
    var currentFixation;
    
    var candidate;
    var lpc = 0.8;
    var invLpc = 1 - lpc;

    var zones;
    var logger;

    function parseSample(x, y) {
        var dx = x - currentFixation.x;
        var dy = y - currentFixation.y;
        if (Math.sqrt( dx * dx + dy * dy) > threshold) {
            if (!candidate) {
                candidate = new Fixation(x, y, sampleDuration);
                candidate.previous = currentFixation;
                candidate.saccade = new Saccade(x - currentFixation.x, y - currentFixation.y);
            }
            else {
                candidate.x = (candidate.x + x) / 2;
                candidate.y = (candidate.y + y) / 2;
                candidate.duration += sampleDuration;
                currentFixation = candidate;
                candidate = null;
            }
        }
        else {
            var prevDuration = currentFixation.duration;
            currentFixation.duration += sampleDuration;
            currentFixation.x = lpc * currentFixation.x + invLpc * x;
            currentFixation.y = lpc * currentFixation.y + invLpc * y;
            
            if (prevDration < minDuration && currentFixation.duration >= minDuration) {
                result = currentFixation;
            }
        }

        return null;
    }

    function parseFixation(f) {

        if (f.duration < minDuration) {
            return null;
        }

        var result = null;
        if (currentFixation.duration > f.duration) {
            var fixation = new Fixation(f.x, f.y, f.duration);
            fixation.previous = currentFixation;
            
            var saccade = f.saccade;
            if (saccade) {
                fixation.saccade = new Saccade(saccade.dx, saccade.dy);
            }
            else {
                fixation.saccade = new Saccade(f.x - currentFixation.x, f.y - currentFixation.y);
            }
            
            currentFixation = fixation;
            fixations.push( currentFixation );
                
            result = currentFixation;
        }
        else {
            currentFixation.duration = f.duration;
        }

        return result;
    }

    // Fixation
    function Fixation(x, y, duration) {
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.saccade = null;
        this.word = null;
        this.previous = null;
    }

    Fixation.prototype.toString = function () {
        return 'FIX ' + this.x + ',' + this.y + ' / ' + this.duration +
            'ms S=[' + this.saccade + '], W=[' + this.word + ']';
    };

    // Saccade
    function Saccade(x, y) {
        this.x = x;
        this.y = y;
        this.zone = zones.nonreading;
        this.newLine = false;
    }

    Saccade.prototype.toString = function () {
        return this.x + ',' + this.y + ' / ' + this.zone + ',' + this.newLine;
    };

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    if (!root.GazeTargets.Models) {
        root.GazeTargets.Models = {};
    }

    if (!root.GazeTargets.Models.Reading) {
        root.GazeTargets.Models.Reading = {};
    }

    root.GazeTargets.Models.Reading.Fixations = Fixations;
    root.GazeTargets.Models.Reading.Fixation = Fixation;
    root.GazeTargets.Models.Reading.Saccade = Saccade;

})(window);