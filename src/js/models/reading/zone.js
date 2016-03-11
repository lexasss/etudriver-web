// Reading model: mathes reading zone

(function (root) {

    'use strict';

    var Zone = {

        // types
        nonreading: 0,
        neutral: 1,
        reading: 2,

        init: function (settings, geomModel) {
            lineHeight = geomModel.lineHeight;
            progressiveLeft = Math.round((settings.progressiveLeft || -1.5) * lineHeight);
            progressiveRight = Math.round((settings.progressiveRight || 10) * lineHeight);
            regressiveLeft = -geomModel.lineWidth - 500;
            regressiveRight = 0;
            readingMarginY = Math.round((settings.readingMarginY || 1.5) * lineHeight);
            neutralMarginY = Math.round((settings.neutralMarginY || 3) * lineHeight);
            slope = settings.slope || 0.1;

            logger = root.GazeTargets.Logger;
        },

        match: function (saccade) {
            logger.closeBuffer();
            logger.push('zone search', saccade.x, saccade.y);
            var zone = this.nonreading;

            if (isInsideBox( readingMarginY, saccade)) {
                zone = this.reading;
            }
            else if (isInsideBox( neutralMarginY, saccade )) {
                zone = this.neutral;
            }

            //var isNewLine = detectNewLine(saccade);

            return zone;
        },

        reset: function () {
        }
    };

    // internal
    var lineHeight;
    var progressiveLeft;
    var progressiveRight;
    var regressiveLeft;
    var regressiveRight;
    var readingMarginY;
    var neutralMarginY;
    var slope;

    var logger;

    function isInsideProgressive(marginY, saccade)
    {
        var heightDelta = saccade.x * slope;
        var margin = Math.round( marginY + heightDelta );
        logger.push('Progressive: [', progressiveLeft, progressiveRight, -margin, margin, ']');
        return progressiveLeft < saccade.x && saccade.x < progressiveRight && 
               -margin < saccade.y && saccade.y < margin;
    }

    function isInsideRegressive(marginY, saccade)
    {
        var heightDelta = -saccade.x * slope;
        var margin = Math.round( marginY + heightDelta );
        logger.push('Regressive: [', regressiveLeft, regressiveRight, -margin, margin, ']');
        return regressiveLeft < saccade.x && saccade.x < 0 && 
               -margin < saccade.y && saccade.y < margin;
    }

    function isInsideBox(marginY, saccade)
    {
        return isInsideProgressive(marginY, saccade) || isInsideRegressive(marginY, saccade);
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

    root.GazeTargets.Models.Reading.Zone = Zone;

})(window);