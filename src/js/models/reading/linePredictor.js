// Reading model: line predictor

(function (root) {

    'use strict';

    var LinePredictor = {

        init: function(_geomModel, _settings) {
            geomModel = _geomModel;

            _settings = _settings || {};
            currentLinePrefRate = _settings.currentLinePrefRate || 1.3;

            guessMaxDist = 3 * geomModel.lineSpacing;
            currentLineDefDist = 0.5 * geomModel.lineSpacing;
            currentLineMaxDist = 0.7 * geomModel.lineSpacing;
            newLineSaccadeLength = -0.7 * geomModel.lineWidth;

            logger = root.GazeTargets.Logger;
        },

        get: function(state, currentFixation, currentLine, offset) {
            var result = null;
            
            logger.closeBuffer();
            logger.push('[LP]');

            if (!state.isReading) {
                return null;
            }
            else if (currentFixation.previous && currentFixation.previous.saccade.newLine && !currentLine.fitEq) {
                result = checkAgainstCurrentLine( currentFixation, offset );
            }
            else if ((state.isReading && state.isSwitched) || currentFixation) {
                result = guessCurrentLine( currentFixation, currentLine, offset );
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
                result = guessCurrentLine( currentFixation, currentLine, offset );
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
                result = guessCurrentLine( currentFixation, currentLine, offset );
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

    var currentLinePrefRate;
    var guessMaxDist;
    var currentLineMaxDist;
    var currentLineDefDist;
    var newLineSaccadeLength;

    // TODO: penalize all lines but the current one - the current lline should get priority
    function guessCurrentLine(fixation, currentLine, offset) {

        var result = null;
        var perfectLineMatch = false;
        var minDiff = Number.MAX_VALUE;
        var minDiffAbs = Number.MAX_VALUE;
        var currentLineIndex = currentLine ? currentLine.index : -1;
        var x = fixation.x;
        var y = fixation.y;

        var lines = geomModel.lines;
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            var diff = line.fit( x, y );
            var diffAbs = Math.abs( diff );
            if (currentLineIndex === line.index) {          // current line has priority:
                if (diffAbs < currentLineDefDist) {     // it must be followed in case the current fixation follows it
                    result = line;
                    minDiffAbs = diffAbs;
                    perfectLineMatch = true;
                    logger.push( 'following the current line #', currentLineIndex );
                    break;
                }
                else {                                  // and also otherwise
                    diff /= currentLinePrefRate;
                    diffAbs = Math.abs( diff );
                    logger.push( '>>', Math.floor( diff ) );
                }
            }
            if (diffAbs < minDiffAbs) {
                minDiffAbs = diffAbs;
                minDiff = diff;
                result = line;
            }
        }

        if (!perfectLineMatch) {
            logger.push( 'diff =', Math.floor( minDiff ) );
        }

        // threshold must depend on the saccade type: long regressive is most likely belong to a new line, 
        // thus compare the diff against reduced threshold from the lower bound

        var threshold = fixation.saccade.x < newLineSaccadeLength ? currentLineDefDist : currentLineMaxDist;
        if (minDiffAbs < threshold ) {
            if (!perfectLineMatch) {
                logger.push( 'most likely:', result ? result.index : '---' );
            }
        }
        else if (currentLine) {     // maybe, this is a quick jump to some other line?
            logger.push( 'dist =', Math.floor( minDiff ) );
            var lineIndex = currentLineIndex + Math.round( minDiff / geomModel.lineSpacing );
            if (0 <= lineIndex && lineIndex < lines.length) {

                var acceptSupposedLine = true;
                // check which one fits better
                var supposedLine = lines[ lineIndex ];
                if (supposedLine.fitEq) {
                    var supposedLineDiff = Math.abs( supposedLine.fit( x, y ) );
                    logger.push( 'new dist =', Math.floor( supposedLineDiff ) );
                    if (supposedLineDiff >= minDiffAbs) {
                        acceptSupposedLine = false;
                        logger.push( 'keep the line #', result.index );
                    }
                }
                else if (supposedLine.index === currentLineIndex + 1) { // maybe, we should stay on the curretn line?
                    var avgOffset = 0;
                    var count = 0;
                    for (var li = 0; li < lines.length; ++li) {
                        var line = lines[ li ];
                        if (li === currentLineIndex || !line.fitEq) {
                            continue;
                        }

                        avgOffset += line.fit( x, y ) - (currentLineIndex - li) * geomModel.lineSpacing;
                        count++;
                    }

                    if (count) {
                        avgOffset /= count;
                        if (avgOffset < threshold) {
                            acceptSupposedLine = false;
                            result = currentLine;
                            logger.push( 'averaged... stay on line #', result.index );
                        }
                    }
                }

                if (acceptSupposedLine) {
                    result = supposedLine;
                    logger.push( 'guessed jump to line #', result.index );
                }
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
        var previousLine = null;
        var closestFixation = null;

        var fixation = currentFixation.previous;
        while (fixation) {

            if (fixation.word) {
                var line = fixation.word.line;
                if (!currentLine) {
                    currentLine = line;
                }
                if (line.index != currentLine.index) {
                    if (currentLine.index - line.index === 1) {
                        previousLine = line;
                    }
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

        // If recognized as not following but still not too far and recently jumped from the previous line,
        // then check whether it fits this previous line
        if (!result && previousLine && minDist < geomModel.lineSpacing) {
            var diff = Math.abs( previousLine.fit( currentFixation.x, currentFixation.y ) );
            if (diff < currentLineMaxDist) {
                result = previousLine;
                logger.push('back to the prev line');
            }
            else {
                result = currentLine;
                logger.push('still better fit than to the previous line');
            }
        }

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
