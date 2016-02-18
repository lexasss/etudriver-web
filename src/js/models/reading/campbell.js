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
        },

        feed: function (targets, x, y, fixationDuration) {

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
            }

            var mapped = lastMapped;

            var newFixation = fixations.feed(x, y, fixationDuration);
            if (newFixation) {

                updateMode( newFixation );

                mapped = map( newFixation );
                newFixation.word = mapped;

                //console.log("new fix: " + dx + "," + dy + " = " + saccade + " : " + (isReadingFixation ? "reading" : "-"));
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

            lastMapped = null;
            isReadingMode = false;
            scoreReading = 0;
            scoreNonReading = 0;
        }
    };

    // internal
    var settings;

    var geometry;
    var fixations;
    var zone;
    var newLineDetector;

    var lastMapped;
    var isReadingMode;
    var scoreReading;
    var scoreNonReading;

    function updateMode(currentFixation) {
        
        var guessedZone;
        var lineCompleted = newLineDetector.search(currentFixation);

        if (lineCompleted) {
            guessedZone = zone.reading;
            currentFixation.saccade.newLine = true;
            calcOffset(currentFixation, lineCompleted);
        }
        else {
            guessedZone = zone.match(currentFixation.saccade);
        }

        currentFixation.saccade.zone = guessedZone;

        switch (guessedZone) {
            case zone.reading:
                console.log('in reading zone');
                scoreReading++;
                scoreNonReading -= settings.forgettingFactor;
                break;
            case zone.neutral:
                console.log('in neutral zone');
                scoreNonReading++;
                break;
            default:
                console.log('in nonreading zone');
                scoreNonReading = settings.nonreadingThreshold;
                scoreReading = 0;
        }

        scoreReading = scoreReading < settings.readingThreshold ? scoreReading : settings.readingThreshold;
        scoreReading = scoreReading > 0 ? scoreReading : 0;
        scoreNonReading = scoreNonReading < settings.nonreadingThreshold ? scoreNonReading : settings.nonreadingThreshold;
        scoreNonReading = scoreNonReading > 0 ? scoreNonReading : 0;
        
        if (!isReadingMode && scoreReading === settings.readingThreshold) {
            changeMode(true);
        }
        else if (isReadingMode && scoreNonReading === settings.nonreadingThreshold) {
            changeMode(false);
        }
    }

    function calcOffset

    function getWordOnSameLine( line, fixation, saccade ) {

    }

    function changeMode(toReading) {
        console.log('change Mode', toReading);
        isReadingMode = toReading;
        if (isReadingMode) {
            guessCurrentLine();
        }
        else {
            //currentLine = null;
        }
    }

    function guessCurrentLine() {
        var result = null;
        
        // first search the fixations already mapped
        result = getNearestLineFromPrevFixations();

        // then just map lines naively
        if (!result) {
            result = getClosestLine();
        }

        console.log('guessed line', result.top);
        offsetY = (result.top + result.bottom) / 2 - lastY;

        return result;
    }

    function getNearestLineFromPrevFixations() {
        var minDist = 1000000;
        var closestFix = null;
        var fix, dist;
        var minFixIndex = Math.max( 0, fixations.length - 40);
        for (var i = fixations.length - 1; i >= minFixIndex; --i) {
            fix = fixations[i];
            dist = Math.abs(fix.x - lastY);
            if (dist < minDist) {
                minDist = dist;
                closestFix = fix;
            }
        }

        return (minDist < lineSpacing / 2) && closestFix.word ? closestFix.word.line : null;
    }

    function getClosestLine() {
        var minDist = 1000000;
        var closestLine = null;
        var line, dist;
        for (var i = 0; i < lines.length; ++i) {
            line = lines[i];
            dist = Math.abs(line.top - lastY);
            if (dist < minDist) {
                minDist = dist;
                closestLine = line;
            }
            dist = Math.abs(line.bottom - lastY);
            if (dist < minDist) {
                minDist = dist;
                closestLine = line;
            }
        }

        return closestLine;        
    }

    function map(fix) {

        if (!isReadingMode) {
            console.log('map: none');
            return null;
        }

        if (fix.word) {
            console.log('map: fix.word');
            return fix.word;
        }

        var result = null;
        var minDist = Number.MAX_VALUE;

        for (var i = 0; i < lines.length; ++i) {
            var words = lines[i].words;
            for (var j = 0; j < words.length; ++j) {
                var word = words[j];
                var rect = word.rect;
                
                var dx = fix.x < rect.left ? rect.left - fix.x : (fix.x > rect.right ? fix.x - rect.right : 0);
                var dy = fix.y < rect.top ? rect.top - fix.y : (fix.y > rect.bottom ? fix.y - rect.bottom : 0);
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    result = word;
                    minDist = dist;
                    if (dist === 0) {
                        i = lines.length;
                        break;
                    }
                }
            }
        }

        console.log('map: search', minDist < lineSpacing, minDist);
        return minDist < lineSpacing ? result : null;
    }

    function select(word) {
        if (word) {
            var rect = word.dom.getBoundingClientRect();
            offsetX = (rect.top + rect.height / 2) - lastY;
            offsetY = (rect.top + rect.height / 2) - lastY;
        }
        else {
            offsetY = 0;
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