// Model for eading
// 
// Require objects in GazeTargets:
//        none

(function (root) {

    'use strict';

    var Reading = {

        // Initializes the model
        // Arguments:
        //  _settings: {                - settings:
        //      maxSaccadeLength            maximum progressive saccade length
        //      maxSaccadeAngleRatio        maximum progressive saccade |dy|/dx ration
        init: function (_settings) {
            settings = _settings;
        },

        // Reconstructs the text geometry
        // Arguments:
        //  targets:   array of DOM elements
        setTargets: function (targets) {
            lines = [];
            
            var lineY = 0;
            var currentLine = null;
            targets.forEach(function (elem) {
                var rect = elem.getBoundingClientRect();
                if (lineY != rect.top || !currentLine) {
                    currentLine = createLine(rect);
                    lines.push(currentLine);
                    lineY = rect.top;
                }
                else {
                    currentLine.addWord(rect);
                }

//                console.log('{ left: ' + Math.round(rect.left) + ', top: ' + Math.round(rect.top) + ', right: ' + Math.round(rect.right) + ', bottom: ' + Math.round(rect.bottom) + ' }');
            });
        },

        feed: function (x, y, fixationDuration) {

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
                console.log(x, y);
                var dx = x - prevFixX;
                var dy = y - prevFixY;
                var saccade = Math.sqrt(dx * dx + dy * dy);

                isReadingFixation = saccade <= settings.maxSaccadeLength && 
                    Math.abs(dy) / dx <= settings.maxSaccadeAngleRatio;

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
    var lines;

    var yOffset;
    var lastX;
    var lastY;
    var prevFixX;
    var prevFixY;
    var prevFixDuration;
    var isReadingFixation;

    function createLine(rect) {
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            words: [rect],

            addWord: function (rect) {
                this.right = rect.right;
                if (this.bottom < rect.bottom) {
                    this.bottom = rect.bottom;
                }
                this.words.push(rect);
            }
        };
    }

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    if (!root.GazeTargets.Models) {
        root.GazeTargets.Models = {};
    }

    root.GazeTargets.Models.Reading = Reading;

})(window);