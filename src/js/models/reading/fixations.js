// Reading model: fixation start detetor, definition of fixation and sacccade
// 
// Depends:
//      GazeTargets.Models.Reading.Zone

(function (root) {

    'use strict';

    var Fixations = {

        init: function () {
            lastFixation = null;
            currentFixation = new Fixation(-10000, -10000, Number.MAX_VALUE);
            
            zones = GazeTargets.Models.Reading.Zone;
            logger = root.GazeTargets.Logger;
        },

        feed: function (x, y, duration) {

            if (currentFixation.duration > duration) {
                currentFixation = new Fixation(x, y, duration);
                currentFixation.previous = lastFixation;
                
                lastFixation = currentFixation;
                currentFixation.saccade = new Saccade(x - lastFixation.x, y - lastFixation.y);
                
                fixations.push( currentFixation );
                
                return currentFixation;
            }
            else {
                currentFixation.duration = duration;
            }

            return null;
        },

        reset: function () {
            fixations.forEach(function (value) {
                logger.log('{ x: ' + value.x + ', y: ' + value.y + ' },');
            });
            fixations.length = 0;

            lastFixation = null;
            currentFixation = new Fixation(-10000, -10000, Number.MAX_VALUE);
        },

        current: function() {
            return currentFixation;
        }
    };

    // internal
    var fixations = [];

    var lastFixation;
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

    // Saccade
    function Saccade(x, y) {
        this.x = x;
        this.y = y;
        this.zone = zones.nonreading;
        this.newLine = false;
    }

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

})(window);