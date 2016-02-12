// Naive mapping model
// 

(function (root) {

    'use strict';

    var Naive = {

        // Initializes the model
        init: function () {
        },

        feed: function (targets, x, y, fixationDuration) {

            var mapped = null;

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