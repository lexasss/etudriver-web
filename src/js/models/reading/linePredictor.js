// Reading model: line predictor

(function (root) {

    'use strict';

    var LinePredictor = {

        init: function(_geomModel) {
            geomModel = _geomModel;

            logger = root.GazeTargets.Logger;
        },

        get: function(switched, newLine, currentFixation, offset) {
            var result = null;
            if (newLine) {
                result = newLine;
                logger.log('current line is the new line (' + newLine.index + ')');
            }
            else if (switched.toReading) {
                result = guessCurrentLine( currentFixation, offset );
            }
            else if (switched.toNonReading) {
                result = null;
                logger.log('current line reset');
            }
            else {
                var previousFixation = currentFixation.previous;
                result = previousFixation && previousFixation.word ? 
                    previousFixation.word.line : 
                    getClosestLine( currentFixation, offset );
                logger.log('previous fixation line? ' + (result ? result.index : 'no'));
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

    function guessCurrentLine(currentFixation, offset) {
        var result = null;
        
        // first search the fixations already mapped
        if (currentFixation) {
            result = guessNearestLineFromPreviousFixations( currentFixation, offset );
            logger.log('guessed line from prev fixation', result);
        }

        // then just map lines naively
        if (!result) {
            result = getClosestLine( currentFixation, offset );
            logger.log('just taking the closest line', result.index);
        }

        return result;
    }

    function guessNearestLineFromPreviousFixations( currentFixation, offset ) {
        var minDist = Number.MAX_VALUE;
        var dist, closestFixation = null;

        var fixation = currentFixation.previous;
        while (fixation) {

            if (fixation.word) {
                dist = Math.abs( currentFixation.y + offset - fixation.word.line.top );
                if (dist < minDist) {
                    minDist = dist;
                    closestFixation = fixation;
                }
            }

            fixation = fixation.previous;
        }

        return closestFixation && (minDist < geomModel.lineSpacing / 2) ? closestFixation.word.line : null;
    }

    function getClosestLine( fixation, offset ) {

        var result = null;
        var minDist = Number.MAX_VALUE;
        var line, dist;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            line = lines[i];
            dist = Math.abs( fixation.y + offset - (line.top + line.bottom) / 2 );
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
