// Gaze pointer
//
// Dependencies:
//      utils.js
// Depended style sheets:
//      pointer.css

(function (root) {

    'use strict';

    var Pointer = {
        init: function (_settings) {
            settings = _settings;

            utils = root.GazeTargets.Utils;
            
            pointer = document.createElement('div');
            pointer.className = 'gt-pointer';

            var s = pointer.style;
            s.display = 'none';
            s.backgroundColor = settings.color;
            s.opacity = settings.opacity;
            s.borderRadius = (settings.size / 2).toFixed(0) + 'px';
            s.height = settings.size + 'px';
            s.width = settings.size + 'px';

            document.body.appendChild(pointer);
        },

        moveTo: function (pt) {
            pointer.style.left = Math.round(pt.x - settings.size / 2) + 'px';
            pointer.style.top = Math.round(pt.y - settings.size / 2) + 'px';
        },

        show: function (show) {
            if (show && pointer.style.display !== 'block') {
                pointer.style.display = 'block';
            }
            else if (!show && pointer.style.display === 'block') {
                pointer.style.display = 'none';
            }
        }
    };

    var pointer = null;
    var settings;
    var utils;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Pointer = Pointer;

})(window);