// Reading model: mathes reading zone

(function (root) {

    'use strict';

    var NewLineDetector = {

        init: function (settings, geomModel) {
            lineMaxWidth = geomModel.lineWidth;
            minMarginY = (settings.minMarginY || 0.3) * geomModel.lineSpacing;
            maxMarginY = (settings.maxMarginY || 1.3) * geomModel.lineSpacing;
            slope = settings.slope || 0.1;

            zones = root.GazeTargets.Models.Reading.Zone;
        },

        search: function (currentFixation) {

            if (!isInZone(currentFixation.saccade)) {
                return null;
            }

            console.log('new line? compare against the current line');
            var result = compareAgainstCurrentLine(currentFixation);
            return result;
        },

        reset: function () {
        }
    };

    // internal
    var lineMaxWidth;
    var minMarginY;
    var maxMarginY;
    var slope;

    var zones;

    function isInZone(saccade) {
        var heightDelta = -saccade.x * slope;
        var left = -lineMaxWidth;
        var top = minMarginY - heightDelta;
        var bottom = maxMarginY + heightDelta;
        return left < saccade.x && saccade.x < 0 && 
               top < saccade.y && saccade.y < bottom;
    }

    function compareAgainstCurrentLine(currentFixation) {
        
        var firstLineFixation = getFirstFixationOnItsLine(currentFixation);    

        if (!firstLineFixation) {
            console.log('    cannot do it');
            return null;
        }

        var verticalJump = currentFixation.y - firstLineFixation.y;
        if ( minMarginY < verticalJump && verticalJump < maxMarginY) {
            console.log('    is below the current', verticalJump);
            return firstLineFixation.word.line;
        }

        return null;
    }

    function getFirstFixationOnItsLine(currentFixation) {

        var previousFixation = currentFixation.previous;
        if (!previousFixation || !previousFixation.word) {
            return null;
        }

        var currentLine = previousFixation.word.line;
        var fixation = previousFixation;
        var result = previousFixation;

        while (fixation) {
            if (fixation.word) {                // the fixation was mapped onto a word, lets test its line
                if (fixation.word.line === currentLine) {   // same line, continue moving backward
                    result = fixation;
                    if (result.x < currentFixation.x) {     // no need to search further for more  
                        break;
                    }
                }
                else if (fixation.word.line) {  // the fixation mapped onto another line, break
                    break;
                }
            }
            else if (fixation.saccade.zone === zones.nonreading) {   // 
                break;
            }

            fixation = fixation.previous;
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

    root.GazeTargets.Models.Reading.NewLineDetector = NewLineDetector;

})(window);