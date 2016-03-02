// Reading model: text geometry model creator
// Depends on:
//      libs/regression

(function (root) {

    'use strict';

    var Geometry = {

        init: function(_isTextFixed) {
            isTextFixed = _isTextFixed;

            logger = root.GazeTargets.Logger;
        },

        create: function (targets) {
            if (isTextFixed && lines.length > 0) {
                return null;
            }

            this.reset();
        
            compute(targets);

            return this.model();
        },

        reset: function () {
            // lines.forEach(function (line) {
            //     line.forEach(function (w) {
            //         logger.log('new Word({ left: ' + w.rect.left + 
            //             ', top: ' + w.rect.top + 
            //             ', right: ' + w.rect.right + 
            //             ', bottom: ' + w.rect.bottom + ' }),');
            //     });
            // });
            lines = [];
            lineSpacing = 0;
            lineHeight = 0;
            lineWidth = 0;
        },

        model: function () {
            return {
                lines: lines,
                lineSpacing: lineSpacing,
                lineHeight: lineHeight,
                lineWidth: lineWidth
            };
        }
    };

    // internal
    var isTextFixed;

    var lines = [];
    var lineSpacing;
    var lineHeight;
    var lineWidth;

    var logger;

    function compute(targets) {

        var lineY = 0;
        var currentLine = null;

        for (var i = 0; i < targets.length; ++i) {
            var target = targets[i];
            var rect = target.getBoundingClientRect();
            if (lineY < rect.top || !currentLine) {
                if (currentLine) {
                    lineSpacing += rect.top - currentLine.top;
                    lineHeight += currentLine.bottom - currentLine.top;
                    if (lineWidth < currentLine.right - currentLine.left) {
                        lineWidth = currentLine.right - currentLine.left;
                    }
                }
                currentLine = new Line(rect, target, lines.length, lines[lines.length - 1]);
                lines.push(currentLine);
                lineY = rect.top;
            }
            else {
                currentLine.add(rect, target);
            }
//                logger.log('{ left: ' + Math.round(rect.left) + ', top: ' + Math.round(rect.top) + ', right: ' + Math.round(rect.right) + ', bottom: ' + Math.round(rect.bottom) + ' }');
        }

        if (currentLine) {
            lineHeight += currentLine.bottom - currentLine.top;
            lineHeight /= lines.length;
            if (lineWidth < currentLine.right - currentLine.left) {
                lineWidth = currentLine.right - currentLine.left;
            }
        }

        if (lines.length > 1) {
            lineSpacing /= lines.length - 1;
        }
        else if (lines.length > 0) {
            var line = lines[0];
            lineSpacing = 2 * (line.bottom - line.top);
        }
        
        logger.log('geometry model created', lines.length);
    }

    // Line object
    function Line(word, dom, index, prevLine) {
        this.left = word.left;
        this.top = word.top;
        this.right = word.right;
        this.bottom = word.bottom;
        this.center = {
            x: (word.left + word.right) / 2,
            y: (word.top + word.bottom) / 2
        };

        this.words = [];
        this.words.push(new Word(word, dom, this));

        this.index = index;
        this.previous = prevLine;
        this.next = null;
        if (this.previous) {
            this.previous.next = this;
        }
        
        this.fixations = [];
        this.fitEq = null;
    }

    Line.prototype.add = function (word, dom) {

        this.right = word.right;
        if (this.bottom < word.bottom) {
            this.bottom = word.bottom;
        }

        this.words.push(new Word(word, dom, this));
    };

    Line.prototype.addFixation = function (fixation) {

        this.fixations.push( [fixation.x, fixation.y, fixation.saccade] );

        if (this.fixations.length > 1) {
            this.removeOldFixation();
            var type = this.fixations.length < 5 ? 'linear' : 'polynomial';
            var model = window.regression.model( type, this.fixations, 2 );
            this.fitEq = model.equation;
            logger.log( 'model update for line', this.index, ':', model.string );
        }
    };

    Line.prototype.removeOldFixation = function () {
        var lastIndex = this.fixations.length - 1;
        if (lastIndex < 5) {
            return;
        }

        var index = lastIndex;
        var fix;
        while (index > 0) {
            fix = this.fixations[ index ];
            if (index > 0 && fix[2].newLine) {       // the current line started here
                if (lastIndex - index + 1 > 3) {     // lets have at least 4 fixations
                    this.fixations = this.fixations.slice( index );
                    logger.log( '    line fixations: reduced' );
                }
                break;
            }
            index -= 1;
        }
    };

    // returns difference between model x and the actual x
    Line.prototype.fit = function (x, y) {
        if (this.fitEq) {
            var result = y - window.regression.fit( this.fitEq, x );
            logger.log( 'fitting', x, 'to line', this.index, ': error is ', result );
            return Math.abs( result );
        }
        return Number.MAX_VALUE;
    };

    // Word object
    function Word(rect, dom, line) {
        this.rect = rect;
        this.dom = dom;
        this.line = line;
        this.index = line.words.length;
    }

    Word.prototype.toString = function () {
        return this.rect.left + ',' + this.rect.top + ' / ' + this.line.index;
    };

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

    root.GazeTargets.Models.Reading.Geometry = Geometry;
    root.GazeTargets.Models.Reading.Geometry.Line = Line;
    root.GazeTargets.Models.Reading.Geometry.Word = Word;

})(window);