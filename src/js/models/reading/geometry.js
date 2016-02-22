// Reading model: text geometry model creator

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
            lines.forEach(function (line) {
                line.forEach(function (w) {
                    logger.log('new Word({ left: ' + w.rect.left + 
                        ', top: ' + w.rect.top + 
                        ', right: ' + w.rect.right + 
                        ', bottom: ' + w.rect.bottom + ' }),');
                });
            });
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
                currentLine = new Line(rect, target);
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
    function Line(word, dom) {
        this.left = word.left;
        this.top = word.top;
        this.right = word.right;
        this.bottom = word.bottom;

        this.words = [];
        this.words.push(new Word(word, dom, this));
    }

    Line.prototype.add = function (word, dom) {

        this.right = word.right;
        if (this.bottom < word.bottom) {
            this.bottom = word.bottom;
        }

        this.words.push(new Word(word, dom, this));
    };

    // Word object
    function Word(rect, dom, line) {
        this.rect = rect;
        this.dom = dom;
        this.line = line;
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

    root.GazeTargets.Models.Reading.Geometry = Geometry;
    root.GazeTargets.Models.Reading.Geometry.Line = Line;
    root.GazeTargets.Models.Reading.Geometry.Word = Word;

})(window);