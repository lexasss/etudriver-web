// Head corrector

(function (root) {

    'use strict';

    function HeadCorrector(settings) {
        var ref = null;
        var getAvg = function (ec) {
            var eyeCount = 0;
            var ecx = 0.0,
                ecy = 0.0;
            if (ec.xl) {
                ecx += ec.xl;
                ecy += ec.yl;
                eyeCount += 1;
            }
            if (ec.xr) {
                ecx += ec.xr;
                ecy += ec.yr;
                eyeCount += 1;
            }
            if (eyeCount) {
                ecx /= eyeCount;
                ecy /= eyeCount;
            }
            return {x: ecx, y: ecy};
        };
        this.init = function (ec) {
            ref = getAvg(ec);
        };
        this.correct = function (point, ec) {
            var pt = getAvg(ec);
            var dx = (pt.x - ref.x) * settings.transformParam;
            var dy = (pt.y - ref.y) * settings.transformParam;
            return {
                x: Math.round(point.x - dx), 
                y: Math.round(point.y + dy)
            };
        };
    }

    // Publication
    if (!root.GazeTargets) {
        root.GazeTargets = {};
    }

    root.GazeTargets.HeadCorrector = HeadCorrector;

})(window);