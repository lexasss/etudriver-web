// Dwell-time progress
//
// Depended style sheets:
//      progress.css

(function (root) {

    'use strict';

    var Progress = {
        init: function (_settings) {
            settings = _settings;

            progress = document.createElement('canvas');
            progress.className = 'gt-progress';
            progress.height = settings.size;
            progress.width = settings.size;
            progress.style.display = 'none';
            document.body.appendChild(progress);
        },

        show: function (show) {
            if (show && progress.style.display !== 'block') {
                progress.style.display = 'block';
            }
            else if (!show && progress.style.display === 'block') {
                progress.style.display = 'none';
            }
        },

        moveTo: function (mapped) {
            if (progress && typeof mapped.gaze.selection.dwellTime !== 'undefined') {
                var rect = mapped.getBoundingClientRect();
                progress.style.left = Math.round(rect.left + (rect.width - settings.size) / 2) + 'px';
                progress.style.top = Math.round(rect.top + (rect.height - settings.size) / 2) + 'px';
            }
        },

        update: function (target) {
            var ctx = progress.getContext('2d');
            var size = settings.size;
            ctx.clearRect(0, 0, size, size);
            
            if (target) {
                var p = Math.min(1.0, (target.gaze.attention - settings.delay) / (target.gaze.selection.dwellTime - settings.delay));
                if (p > 0.0) {
                    ctx.beginPath();
                    ctx.lineWidth = Math.max(settings.minWidth, size / 10);
                    ctx.arc(size / 2, size / 2, 0.45 * size, -0.5 * Math.PI,
                        -0.5 * Math.PI + 2.0 * Math.PI * p);
                    ctx.strokeStyle = settings.color;
                    ctx.stroke();
                }
            }
        }
    };

    var progress = null;
    var settings;

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.Progress = Progress;

})(window);