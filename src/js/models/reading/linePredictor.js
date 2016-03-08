// Reading model: line predictor

(function (root) {

    'use strict';

    var LinePredictor = {

        init: function(_geomModel) {
            geomModel = _geomModel;

            guessMaxDist = 3 * geomModel.lineSpacing;
            currentLineMaxDist = 0.7 * geomModel.lineSpacing;
            definiteFollowingThreshold = 0.5 * geomModel.lineSpacing;

            logger = root.GazeTargets.Logger;
        },

        get: function(state, currentFixation, currentLine, offset) {
            var result = null;
            
            logger.closeBuffer();
            logger.push('[LP]');

            if (!state.isReading) {
                return null;
            }
            else if (currentFixation.previous && currentFixation.previous.saccade.newLine) {
                result = checkAgainstCurrentLine( currentFixation, offset );
            }
            else if ((state.isReading && state.isSwitched) || currentFixation) {
                result = guessCurrentLine( currentFixation.x, currentFixation.y, currentLine, offset );
            }

            if (!result) {
                result = getClosestLine( currentFixation, offset );
            }

            if (result && (!currentLine || result.index !== currentLine.index)) {
                currentFixation.saccade.newLine = true;
            }

            logger.closeBuffer();
            return result;
        },

        getAlways: function(state, newLine, currentFixation, currentLine, offset) {
            var result = null;

            logger.closeBuffer();
            logger.push('[LP]');

            if (newLine) {
                result = newLine;
                logger.push('current line is #', newLine.index);
            }
            else if (!state.isReading) {
                result = getClosestLine( currentFixation, offset );
            }
            else if (state.isReading && state.isSwitched) {
                result = guessCurrentLine( currentFixation.x, currentFixation.y, currentLine, offset );
            }
            // else if (switched.toNonReading) {
            //     logger.log('    current line reset');
            //     return null;
            // }
            else if (currentFixation.previous && currentFixation.previous.saccade.newLine) {
                    //currentFixation.previous.word && 
                    // currentFixation.previous.word.line.fixations.length < 3) {
                result = checkAgainstCurrentLine( currentFixation, offset );
            }
            else if (currentFixation) {
                result = guessCurrentLine( currentFixation.x, currentFixation.y, currentLine, offset );
            }

            if (!result) {
                result = getClosestLine( currentFixation, offset );
            }

            if (result && (!currentLine || result.index !== currentLine.index)) {
                currentFixation.saccade.newLine = true;
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

    var currentLinePrefRate = 1.3;
    var guessMaxDist;
    var currentLineMaxDist;
    var definiteFollowingThreshold;

    // TODO: penalize all lines but the current one - the current lline should get priority
    function guessCurrentLine(x, y, currentLine, offset) {

        var result = null;
        var minDiff = Number.MAX_VALUE;
        var currentLineIndex = currentLine ? currentLine.index : -1;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            var diff = Math.abs( line.fit( x, y ) );
            if (currentLineIndex === line.index) {          // current line has priority:
                if (diff < definiteFollowingThreshold) {     // it must be followed in case the current fixation follows it
                    result = line;
                    minDiff = diff;
                    logger.push( 'following the current line' );
                    break;
                }
                else {                                  // and also otherwise
                    diff /= currentLinePrefRate;
                    logger.push( '>>', Math.floor( diff ) );
                }
            }
            if (diff < minDiff) {
                minDiff = diff;
                result = line;
            }
        }

        logger.push( 'diff =', Math.floor( minDiff ) );
        if (minDiff < currentLineMaxDist ) {
            logger.push( 'most likely:', result ? result.index : '---' );
        }
        else if (currentLine) {     // maybe, this is a quick jump to some other line?
            //minDiff = (y + offset) - currentLine.center.y;
            logger.push( 'dist =', Math.floor( minDiff ) );
            var lineIndex = currentLineIndex + Math.round( minDiff / geomModel.lineSpacing );
            if (0 <= lineIndex && lineIndex < lines.length) {   // yes, the gaze point lands on some line
                result = lines[ lineIndex ];
                logger.push( 'guessed jump to line #', result.index );
            }
            else {
                result = null;
            }
        }
        else {
            result = null;
        }

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

        logger.push('dist :', minDist);
        var result = closestFixation && (minDist < currentLineMaxDist) ? currentLine : null;
        logger.push('follows the current line:', result ? 'yes' : 'no');

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

        logger.push('just taking the closest line',  result.index);
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
