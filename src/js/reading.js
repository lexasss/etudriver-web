// Model for eading
// 
// Require objects in GazeTargets:
//        none

(function (root) {

    'use strict';

    var Reading = {
        init: function (_settings) {
            settings = _settings;
        },

        feed: function (targets, x, y, fixationDuration) {

            var newFixation = false;
            if (prevFixDuration > fixationDuration) {
                prevFixX = lastX;
                prevFixY = lastY;
                newFixation = true;
            }

            prevFixDuration = fixationDuration;

            lastX = x;
            lastY = y;

            if (newFixation) {
                var dx = x - prevFixX;
                var dy = y - prevFixY;
                var saccade = Math.sqrt(dx * dx + dy * dy);

                isReadingFixation = saccade <= settings.maxSaccadeLength && 
                    dx > Math.abs(dy);

                if (!isReadingFixation) {
                    yOffset = 0;
                }
                //console.log("new fix: " + dx + "," + dy + " = " + saccade + " : " + (isReadingFixation ? "reading" : "-"));
            }

            return {x: x, y: y + yOffset};
        },

        setSelected: function (target) {
            if (target && isReadingFixation) {
                var rect = target.getBoundingClientRect();
                yOffset = (rect.top + rect.height / 2) - lastY;
            }
            else {
                yOffset = 0;
            }
        },

        reset: function (target) {
            yOffset = 0;
            lastX = -1000;
            lastY = -1000;
            prevFixX = -1000;
            prevFixY = -1000;
            prevFixDuration = 0;
            isReadingFixation = false;
        }
    };

    // internal
    var settings;
    var yOffset;
    var lastX;
    var lastY;
    var prevFixX;
    var prevFixY;
    var prevFixDuration;
    var isReadingFixation;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    if (!root.GazeTargets.Models) {
        root.GazeTargets.Models = {};
    }

    root.GazeTargets.Models.Reading = Reading;

})(window);