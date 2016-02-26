// Reading model: line predictor

(function (root) {

    'use strict';

    var LinePredictor = {

        init: function(_geomModel) {
            geomModel = _geomModel;

            guessMaxDist = 3 * geomModel.lineSpacing;
            currentLineMaxDist = 0.5 * geomModel.lineSpacing;

            logger = root.GazeTargets.Logger;
        },

        get: function(switched, newLine, currentFixation, currentLine, offset) {
            var result = null;
            logger.log('[LP]');

            if (newLine) {
                result = newLine;
                logger.log('    current line is #', newLine.index);
            }
            else if (switched.toReading) {
                result = guessCurrentLine( currentFixation.x, currentFixation.y, currentLine );
            }
            else if (switched.toNonReading) {
                logger.log('    current line reset');
                return null;
            }
            else if (currentFixation.previous && currentFixation.previous.saccade.newLine) {
                    //currentFixation.previous.word && 
                    // currentFixation.previous.word.line.fixations.length < 3) {
                result = checkAgainstCurrentLine( currentFixation, offset );
            }
            else if (currentFixation) {
                result = guessCurrentLine( currentFixation.x, currentFixation.y, currentLine );
            }

            if (!result) {
                result = getClosestLine( currentFixation, offset );
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

    var currentLinePrefRate = 2;
    var guessMaxDist;
    var currentLineMaxDist;

    // TODO: penalize all lines but the current one - the current lline should get priority
    function guessCurrentLine(x, y, currentLine) {

        var result = null;
        var minDiff = Number.MAX_VALUE;
        var currentLineIndex = currentLine ? currentLine.index : -1;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            var diff = line.fit( x, y );
            if (currentLineIndex === line.index) {
                diff /= currentLinePrefRate;
            }
            if (diff < minDiff) {
                minDiff = diff;
                result = line;
            }
        }

        result = minDiff < guessMaxDist ? result : null;
        logger.log('    guessed line from prev fixations', result ? result.index : '---');

        return result;
    }

    function checkAgainstCurrentLine( currentFixation, offset ) {
        var minDist = Number.MAX_VALUE;
        var dist;
        var currentLine = null;
        var closestFixation = null;

        var fixation = currentFixation.previous;
        while (fixation) {

            if (fixation.word) {
                var line = fixation.word.line;
                if (!currentLine) {
                    currentLine = line;
                }
                if (line.index != currentLine.index) {
                    break;
                }
                dist = Math.abs( currentFixation.y + offset - currentLine.center.y );
                if (dist < minDist) {
                    minDist = dist;
                    closestFixation = fixation;
                }
            }

            fixation = fixation.previous;
        }

        var result = closestFixation && (minDist < currentLineMaxDist) ? currentLine : null;
        logger.log('    follows the current line:', result ? 'yes' : 'no');

        return result;
    }

    /*function guessNearestLineFromPreviousFixations( currentFixation, offset ) {
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
    }*/

    function getClosestLine( fixation, offset ) {

        var result = null;
        var minDist = Number.MAX_VALUE;
        var line, dist;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            line = lines[i];
            dist = Math.abs( fixation.y + offset - line.center.y );
            if (dist < minDist) {
                minDist = dist;
                result = line;
            }
        }

        logger.log('    just taking the closest line',  result.index);
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
