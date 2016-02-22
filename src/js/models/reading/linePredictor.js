// Reading model: line predictor

(function (root) {

    'use strict';

    var LinePredictor = {

        init: function(_geomModel) {
            geomModel = _geomModel;

            logger = root.GazeTargets.Logger;
        },

        get: function(switched, newLine, currentFixation) {
            var result = null;
            if (newLine) {
                result = newLine;
                logger.log('current line is the new line');
            }
            else if (switched.toReading) {
                result = guessCurrentLine( currentFixation );
            }
            else if (switched.toNonReading) {
                result = null;
                logger.log('current line reset');
            }
            else {
                var previousFixation = currentFixation.previous;
                result = previousFixation && previousFixation.word ? 
                    previousFixation.word.line : 
                    getClosestLine( currentFixation);
                logger.log('previous fixation line?');
            }

            return result;
        },

        reset: function() {
            geomModel = null;
        }
    };

    // internal
    var geomModel;
    var logger;

    function guessCurrentLine(currentFixation) {
        var result = null;
        
        // first search the fixations already mapped
        if (currentFixation) {
            result = guessNearestLineFromPreviousFixations( currentFixation );
            logger.log('guessed line from prev fixation', result);
        }

        // then just map lines naively
        if (!result) {
            result = getClosestLine( currentFixation );
            logger.log('just taking the closest line', result.top);
        }

        return result;
    }

    function guessNearestLineFromPreviousFixations( currentFixation ) {
        var minDist = Number.MAX_VALUE;
        var closestFixation = null;
        var dx, dy, dist;

        var fixation = currentFixation.previous;
        while (fixation) {

            if (fixation.word) {
                dx = currentFixation.x - fixation.x;
                dy = currentFixation.y - fixation.y;
                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    closestFixation = fix;
                }
            }

            fixation = fixation.previous;
        }

        return closestFixation && (minDist < geomModel.lineSpacing / 2) ? closestFixation.word.line : null;
    }

    function getClosestLine( fixation ) {

        var result = null;
        var minDist = Number.MAX_VALUE;
        var line, dist;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            line = lines[i];
            dist = Math.abs((line.top + line.bottom) / 2 - fixation.y);
            if (dist < minDist) {
                minDist = dist;
                result = line;
            }
        }

        return result;        
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

    root.GazeTargets.Models.Reading.LinePredictor = LinePredictor;

})(window);
