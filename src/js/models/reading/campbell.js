// Model for reading
// 
// Require objects in GazeTargets:
//        none

(function (root) {

    'use strict';

    var Campbell = {

        // Initializes the model
        // Arguments:
        //  _settings
        //      forgettingFactor        relative number 0.1..0.5
        //      readingThreshold        number of fixations
        //      nonreadingThreshold     number of fixations
        //      slope                   0.1..0.2
        //      progressiveLeft         em
        //      progressiveRight        em
        //      readingZoneMarginY      em
        //      neutralZoneMarginY      em
        init: function (_settings, _commons) {
            _settings = _settings || {};
            _commons = _commons || {};

            settings = {
                forgettingFactor: _settings.forgettingFactor || 0.2,
                readingThreshold: _settings.readingThreshold || 3,
                nonreadingThreshold: _settings.nonreadingThreshold || 2,
                slope: _settings.slope || 0.15,
                progressiveLeft: _settings.progressiveLeft || -1,
                progressiveRight: _settings.progressiveRight || 9,
                readingZoneMarginY: _settings.readingZoneMarginY || 1,
                neutralZoneMarginY: _settings.neutralZoneMarginY || 2
            };

            if (_commons.fixedText === undefined) _commons.fixedText = true;

            geometry = root.GazeTargets.Models.Reading.Geometry;
            geometry.init(_commons.fixedText);

            fixations = root.GazeTargets.Models.Reading.Fixations;
            fixations.init();

            zone = root.GazeTargets.Models.Reading.Zone;
            newLineDetector = root.GazeTargets.Models.Reading.NewLineDetector;
            linePredictor = root.GazeTargets.Models.Reading.LinePredictor;

            logger = root.GazeTargets.Logger;
        },

        feed: function (targets, data1, data2) {

            createGeometry(targets);

            var mapped = lastMapped;

            var newFixation = fixations.feed(data1, data2);
            if (newFixation) {

                logger.log( newFixation.toString() );

                // new line searcfh disabled -->
                //var newLine = classifySaccadeZone( newFixation );
                var guessedZone = scoreReading === 0 && newFixation.saccade.x < 0 ?
                    zone.nonreading :
                    zone.match( newFixation.saccade );

                logger.push( 'zone', guessedZone );
                newFixation.saccade.zone = guessedZone;
                updateScores( guessedZone );
                // --> replacement

                var switched = updateMode();
                var state = {
                    isReading: isReadingMode,
                    isSwitched: switched.toReading || switched.toNonReading
                };
                currentLine = linePredictor.get( state, newFixation, currentLine, offset );
                //currentLine = linePredictor.getAlways( state, newLine, newFixation, currentLine, offset );

                updateOffset( newFixation, currentLine );

                mapped = map( newFixation, currentLine );
                newFixation.word = mapped;

                if (switched.toReading && mapped) {
                    backtrackFixations( newFixation, mapped.line );
                }
                else if (isReadingMode && mapped) {
                    var outlier = searchOutlier( newFixation, mapped.line.index );
                    if (outlier) {
                        logger.log('outlier is backtracked: line #', mapped.line.index);
                        map(outlier, mapped.line, true);
                    }
                }
                //logger.log('new fix: ' + dx + ',' + dy + ' = ' + saccade + ' : ' + (isReadingFixation ? 'reading' : '-'));
                
                lastMapped = mapped;
            }

            lastFixation = newFixation;
            //select( lastMapped );

            logger.closeBuffer();

            return mapped ? mapped.dom : null;
        },

        reset: function () {

            geometry.reset();
            fixations.reset();
            zone.reset();
            newLineDetector.reset();
            linePredictor.reset();

            isReadingMode = false;
            scoreReading = 0;
            scoreNonReading = 0;
            
            offset = 0;
            currentLine = null;
            lastMapped = null;
            lastFixation = null;
        },

        currentWord: function () {
            return lastMapped;
        },

        mappedFix: function () {
            return lastFixation;
        }
    };

    // internal
    var settings;

    var geometry;
    var fixations;
    var zone;
    var newLineDetector;
    var linePredictor;

    var isReadingMode;
    var scoreReading;
    var scoreNonReading;

    var offset;
    var currentLine;
    var lastMapped;
    var lastFixation;

    var logger;

    function createGeometry(targets) {
        var geomModel = geometry.create(targets);
        if (geomModel) {
            zone.init({
                progressiveLeft: settings.progressiveLeft,
                progressiveRight: settings.progressiveRight,
                readingMarginY: settings.readingZoneMarginY,
                neutralMarginY: settings.neutralZoneMarginY,
                slope: settings.slope
            }, geomModel);
            newLineDetector.init({
                minMarginY: 0.3,
                maxMarginY: 1.3,
                slope: settings.slope
            }, geomModel);
            linePredictor.init( geomModel );
        }
    }

    // function classifySaccadeZone(currentFixation) {
        
    //     var newLine = newLineDetector.search( currentFixation );

    //     var guessedZone;
    //     if (newLine) {
    //         guessedZone = zone.reading;
    //         currentFixation.saccade.newLine = true;
    //     }
    //     else {
    //         guessedZone = zone.match( currentFixation.saccade );
    //     }

    //     logger.log( 'zone', guessedZone );
    //     currentFixation.saccade.zone = guessedZone;
    //     updateScores( guessedZone );

    //     return newLine;
    // }

    function updateScores(guessedZone) {
        switch (guessedZone) {
            case zone.reading:
                logger.push('in reading zone');
                scoreReading++;
                scoreNonReading -= settings.forgettingFactor;
                break;
            case zone.neutral:
                logger.push('in neutral zone');
                //scoreNonReading++;
                break;
            default:
                logger.push('in nonreading zone');
                scoreNonReading = settings.nonreadingThreshold;
                scoreReading = 0;
        }

        scoreReading = scoreReading < settings.readingThreshold ? scoreReading : settings.readingThreshold;
        scoreReading = scoreReading > 0 ? scoreReading : 0;
        scoreNonReading = scoreNonReading < settings.nonreadingThreshold ? scoreNonReading : settings.nonreadingThreshold;
        scoreNonReading = scoreNonReading > 0 ? scoreNonReading : 0;
    }

    function updateMode() {
        var result = {
            toReading: false,
            toNonReading: false
        };

        if (!isReadingMode && scoreReading === settings.readingThreshold) {
            changeMode(true);
            result.toReading = true;
        }
        else if (isReadingMode && scoreNonReading === settings.nonreadingThreshold) {
            changeMode(false);
            result.toNonReading = true;
        }

        return result;
    }

    function changeMode(toReading) {
        logger.push('change Mode', toReading);
        isReadingMode = toReading;
    }

    function updateOffset( fixation, line ) {
        if (isReadingMode && line) {
            offset = line.center.y - fixation.y;
            logger.push('offset', offset);
        }
    }

    function map(fixation, line, skipFix) {

        logger.closeBuffer();
        logger.push('[MAP]');
        // if (!isReadingMode) {
        //     logger.log('    none');
        //     return null;
        // }

        if (!line) {
            //logger.log(logger.Type.error, '    ???');
            return null;
        }

        if (isReadingMode && !skipFix) {
            line.addFixation( fixation );
        }
        
        var x = fixation.x;
        var result = null;
        var minDist = Number.MAX_VALUE;

        var words = line.words;
        for (var i = 0; i < words.length; ++i) {
            var word = words[i];
            var rect = word.rect;
                
            var dist = x < rect.left ? (rect.left - x) : (x > rect.right ? x - rect.right : 0);
            if (dist < minDist) {
                result = word;
                minDist = dist;
                if (dist === 0) {
                    break;
                }
            }
        }

        logger.push('[d=', Math.floor( minDist ), ']', result ? result.line.index + ',' + result.index : '' );
        return result;
    }

    function backtrackFixations( currentFixation, line ) {
        logger.log( '------ backtrack ------' );    
        var isReadingZone = true;
        var fixation = currentFixation.previous;
        while (fixation && !fixation.saccade.newLine) {
            if (fixation.saccade.zone === zone.nonreading) {
                fixation.word = map( fixation, line, true );
                break;
            }
            if (!isReadingZone && fixation.saccade.zone !== zone.reading) {
                break;
            }
            fixation.word = map( fixation, line );
            isReadingZone = fixation.saccade.zone === zone.reading;
            fixation = fixation.previous;
        }
        logger.log( '------ ///////// ------' );
    }

    function searchOutlier( fixation, lineIndex ) {
        var candidate = null;
        var pattern = [true, false, true];
        var matched = 0;
        var index = 0;

        while (index < 3 && fixation) {
            if (!fixation.word) {
                break;
            }

            var isOnCurrentLine = lineIndex === fixation.word.line.index;
            if (isOnCurrentLine === pattern[ index ]) {
                ++matched;
            }
            if (index === 1) {
                candidate = fixation;
            }

            fixation = fixation.previous;
            ++index;
        }
                
        return matched === pattern.length ? candidate : null;
    }
    
    function select(word) {
        if (word) {
            // var rect = word.dom.getBoundingClientRect();
            // offsetX = (rect.top + rect.height / 2) - lastY;
            // offsetY = (rect.top + rect.height / 2) - lastY;
        }
        else {
            // offsetY = 0;
        }
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

    root.GazeTargets.Models.Reading.Campbell = Campbell;

})(window);