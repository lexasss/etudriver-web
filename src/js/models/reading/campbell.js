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
            settings = _settings;

            geometry = root.GazeTargets.Models.Reading.Geometry;
            geometry.init(_commons.fixedText);

            fixations = root.GazeTargets.Models.Reading.Fixations;
            fixations.init();

            zone = root.GazeTargets.Models.Reading.Zone;
            newLineDetector = root.GazeTargets.Models.Reading.NewLineDetector;
            linePredictor = root.GazeTargets.Models.Reading.LinePredictor;

            logger = root.GazeTargets.Logger;
        },

        feed: function (targets, x, y, fixationDuration) {

            createGeometry(targets);

            var mapped = lastMapped;

            var newFixation = fixations.feed(x, y + offset, fixationDuration);
            if (newFixation) {

                var newLine = classifySaccadeZone( newFixation );

                var switched = updateMode();
                currentLine = linePredictor.get( switched, newLine, newFixation);

                updateOffset( newFixation, currentLine );

                mapped = map( newFixation, currentLine );
                newFixation.word = mapped;

                if (switched.toReading && mapped) {
                    backtrackFixations( newFixation, mapped.line );
                }
                //logger.log('new fix: ' + dx + ',' + dy + ' = ' + saccade + ' : ' + (isReadingFixation ? 'reading' : '-'));
            }

            lastMapped = mapped;
            select( lastMapped );

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
            linePredictor.init(geomModel);
        }
    }

    function classifySaccadeZone(currentFixation) {
        
        var newLine = newLineDetector.search( currentFixation );

        var guessedZone;
        if (newLine) {
            guessedZone = zone.reading;
            currentFixation.saccade.newLine = true;
        }
        else {
            newLine = null;
            guessedZone = zone.match( currentFixation.saccade );
        }

        currentFixation.saccade.zone = guessedZone;
        updateScores(guessedZone);

        return newLine;
    }

    function updateScores(guessedZone) {
        switch (guessedZone) {
            case zone.reading:
                logger.log('in reading zone');
                scoreReading++;
                scoreNonReading -= settings.forgettingFactor;
                break;
            case zone.neutral:
                logger.log('in neutral zone');
                scoreNonReading++;
                break;
            default:
                logger.log('in nonreading zone');
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
        logger.log('change Mode', toReading);
        isReadingMode = toReading;
    }

    function updateOffset( fixation, line ) {
        offset = (line.bottom - line.top) / 2 - (fixation.y - offset);
    }

    function map(fixation, line) {

        if (!isReadingMode) {
            logger.log('map: none');
            return null;
        }

        if (!line) {
            logger.log(logger.Type.error, 'map: ???');
            return null;
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

        logger.log('map: search', minDist);
        return result;
    }

    function backtrackFixations( currentFixation, line ) {
        var fixation = currentFixation.previous;
        while (fixation && !fixation.saccade.newLine) {
            if (fixation.saccade.zone === zone.nonreading) {
                break;
            }
            fixation.word = map( fixation, line );
            fixation = fixation.previous;
        }
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