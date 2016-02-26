// Reading model: fixation start detetor, definition of fixation and sacccade
// 
// Depends:
//      GazeTargets.Models.Reading.Zone

(function (root) {

    'use strict';

    var Fixations = {

        init: function () {
            zones = GazeTargets.Models.Reading.Zone;
            logger = root.GazeTargets.Logger;

            currentFixation = new Fixation(-10000, -10000, Number.MAX_VALUE);
            currentFixation.saccade = new Saccade(0, 0);
        },

        feed: function (x, y, duration) {

            if (currentFixation.duration > duration) {
                var fixation = new Fixation(x, y, duration);
                fixation.previous = currentFixation;
                fixation.saccade = new Saccade(x - currentFixation.x, y - currentFixation.y);
                
                currentFixation = fixation;
                fixations.push( currentFixation );
                
                return currentFixation;
            }
            else {
                currentFixation.duration = duration;
            }

            return null;
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
        },

        current: function() {
            return currentFixation;
        }
    };

    // internal
    var fixations = [];

    var currentFixation;

    var zones;
    var logger;

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