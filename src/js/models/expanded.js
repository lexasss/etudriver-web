// Naive mapping model
// 

(function (root) {

    'use strict';

    var Expanded = {

        // Initializes the model
        // Arguments:
        //  _settings:                 - settings:
        //      expansion                   expansion limit
        init: function (_settings) {
            settings = _settings;
        },

        feed: function (targets, data1, data2) {

            var mapped = null;
            var minDist = Number.MAX_VALUE;
            var x, y;

            if (data2) {
                x = data1;
                y = data2;
            }
            else {
                var fix = data1;
                x = fix.x;
                y = fix.y;
            }

            for (var i = 0; i < targets.length; i += 1) {
                var target = targets[i];
                var rect = target.getBoundingClientRect();
                
                var dx = x < rect.left ? rect.left - x : (x > rect.right ? x - rect.right : 0);
                var dy = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist && dist < settings.expansion) {
                    mapped = target;
                    minDist = dist;
                }
                else if (dist === 0) {
                    if (document.elementFromPoint(x, y) === target) {
                        mapped = target;
                        break;
                    }
                }
            }

            return mapped;
        },

        reset: function () {
        }
    };

    // internal
    var settings;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    if (!root.GazeTargets.Models) {
        root.GazeTargets.Models = {};
    }

    root.GazeTargets.Models.Expanded = Expanded;

})(window);