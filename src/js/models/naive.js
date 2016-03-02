// Naive mapping model
// 

(function (root) {

    'use strict';

    var Naive = {

        // Initializes the model
        init: function () {
        },

        feed: function (targets, data1, data2) {

            var mapped = null;
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
                if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
                    if (mapped) {
                        if (document.elementFromPoint(x, y) === target) {
                            mapped = target;
                            break;
                        }
                    } else {
                        mapped = target;
                    }
                }
            }

            return mapped;
        },

        reset: function () {
        }
    };

    // internal

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    if (!root.GazeTargets.Models) {
        root.GazeTargets.Models = {};
    }

    root.GazeTargets.Models.Naive = Naive;

})(window);