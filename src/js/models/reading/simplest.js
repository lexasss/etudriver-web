// Model for eading
// 
// Require objects in GazeTargets:
//        none

(function (root) {

    'use strict';

    var Simplest = {

        // Initializes the model
        // Arguments:
        //  _settings:                 - settings:
        //      maxSaccadeLength            maximum progressive saccade length
        //      maxSaccadeAngleRatio        maximum progressive saccade |dy|/dx ration
        init: function (_settings, _commons) {
            settings = _settings;
            commons = _commons;
        },

        feed: function (targets, x, y, fixationDuration) {

            obtainGeometry(targets);

            var newFixation = false;
            if (prevFixDuration > fixationDuration) {
                prevFixX = lastX;
                prevFixY = lastY;
                newFixation = true;
            }

            prevFixDuration = fixationDuration;

            lastX = x;
            lastY = y;

            var mapped = lastMapped;

            if (newFixation) {
                console.log(x, y);
                var dx = x - prevFixX;
                var dy = y - prevFixY;
                var saccade = Math.sqrt(dx * dx + dy * dy);

                isReadingFixation = saccade <= settings.maxSaccadeLength && 
                    Math.abs(dy) / dx <= settings.maxSaccadeAngleRatio;

                var saccadeIndicator = lastMapped ? (lastMapped.line.right - lastMapped.line.left) * 0.5 : Number.MAX_VALUE;
                if (!isReadingFixation || dx < -saccadeIndicator) {
                    yOffset = 0;
                }

                mapped = map(x, y + yOffset);

                //console.log("new fix: " + dx + "," + dy + " = " + saccade + " : " + (isReadingFixation ? "reading" : "-"));
            }

            lastMapped = mapped;
            select(lastMapped);

            return mapped ? mapped.dom : null;
        },

        reset: function () {
            yOffset = 0;
            lastX = -1000;
            lastY = -1000;
            prevFixX = -1000;
            prevFixY = -1000;
            prevFixDuration = Number.MAX_VALUE;
            isReadingFixation = false;
            lastMapped = null;
            lineSpacing = 0;
            lines.length = 0;
        }
    };

    // internal
    var settings;
    var commons;

    var lines = [];
    var lineSpacing;
    var lastMapped;

    var yOffset;
    var lastX;
    var lastY;
    var prevFixX;
    var prevFixY;
    var prevFixDuration;
    var isReadingFixation;

    function obtainGeometry(targets) {

        if (commons.fixedText && lines.length > 0) {
            return;
        }

        lines.length = 0;
        lineSpacing = 0;
        
        var lineY = 0;
        var currentLine = null;

        for (var i = 0; i < targets.length; ++i) {
            var target = targets[i];
            var rect = target.getBoundingClientRect();
            if (lineY < rect.top || !currentLine) {
                if (currentLine) {
                    lineSpacing += rect.top - currentLine.top;
                }
                currentLine = createLine(rect, target);
                lines.push(currentLine);
                lineY = rect.top;
            }
            else {
                currentLine.addWord(rect, target);
            }

//                console.log('{ left: ' + Math.round(rect.left) + ', top: ' + Math.round(rect.top) + ', right: ' + Math.round(rect.right) + ', bottom: ' + Math.round(rect.bottom) + ' }');
        }

        if (lines.length > 1) {
            lineSpacing /= lines.length - 1;
        }
        else if (lines.length > 0) {
            var line = lines[0];
            lineSpacing = 2 * (line.bottom - line.top);
        }
    }

    function createLine(rect, target) {
        var line = {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            words: [{
                rect: rect,
                dom: target
            }],

            addWord: function (rect, target) {
                this.right = rect.right;
                if (this.bottom < rect.bottom) {
                    this.bottom = rect.bottom;
                }
                this.words.push({
                    rect: rect,
                    dom: target,
                    line: this
                });
            }
        };

        line.words[0].line = line;

        return line;
    }

    function map(x, y) {

        var result = null;
        var minDist = Number.MAX_VALUE;

        for (var i = 0; i < lines.length; ++i) {
            var words = lines[i].words;
            for (var j = 0; j < words.length; ++j) {
                var word = words[j];
                var rect = word.rect;
                
                var dx = x < rect.left ? rect.left - x : (x > rect.right ? x - rect.right : 0);
                var dy = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    result = word;
                    minDist = dist;
                    if (dist === 0) {
                        i = lines.length;
                        break;
                    }
                }
            }
        }

        return minDist < lineSpacing ? result : null;
    }

    function select(word) {
        if (word && isReadingFixation) {
            var rect = word.dom.getBoundingClientRect();
            yOffset = (rect.top + rect.height / 2) - lastY;
        }
        else {
            yOffset = 0;
        }
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

    root.GazeTargets.Models.Reading.Simplest = Simplest;

})(window);