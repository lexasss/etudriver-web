if (window.QUnit) {
    var req = document.getElementById('req');
    req.style.display = 'none';

    function Word(rect) {
        this.left = rect.left;
        this.top = rect.top;
        this.right = rect.right;
        this.bottom = rect.bottom;
    }

    Word.prototype.getBoundingClientRect = function () {
        return this;
    };

    var GeomLine = window.GazeTargets.Models.Reading.Geometry.Line;
    var GeomWord = window.GazeTargets.Models.Reading.Geometry.Word;
    var Fixations = window.GazeTargets.Models.Reading.Fixations;
    var Fixation = window.GazeTargets.Models.Reading.Fixation;
    var Saccade = window.GazeTargets.Models.Reading.Saccade;

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function createProperLayot(layout) {
        var line = null;
        var lineIndex = 0;
        var words = layout.map( function(word) {
            if (!line) {
                line = new GeomLine( word, null, lineIndex++, null );
            }

            if (line.top != word.top) {
                line = new GeomLine( word, null, lineIndex++, line );
            }
            else {
                line.add(word);
            }

            return line.words[line.words.length - 1];
        });
        return words;
    }

    function createProperFixations(fixations) {
        var lastFix = new Fixation(-10000, -10000, 250);
        lastFix.saccade = new Saccade(0, 0);
        var newFixations = fixations.map( function (fix, data, index) {
            var result = new Fixation(
                fix.x + randomInRange(-10, 10),
                fix.y + randomInRange(-10, 10) + randomInRange(0.05, 0.05)  * fix.x,
                250);
            result.previous = index > 0 ? data[index - 1] : null;
            result.saccade = new Saccade(result.x - lastFix.x, result.y - lastFix.y);
            lastFix = result;
            return result;
        });
        return newFixations;
    }

    var layout = [
        new Word({ left: 67, top: 151, right: 99, bottom: 179 }),
        new Word({ left: 105, top: 151, right: 155, bottom: 179 }),
        new Word({ left: 161, top: 151, right: 215, bottom: 179 }),
        new Word({ left: 222, top: 151, right: 284, bottom: 179 }),
        new Word({ left: 290, top: 151, right: 328, bottom: 179 }),
        new Word({ left: 334, top: 151, right: 384, bottom: 179 }),
        new Word({ left: 390, top: 151, right: 425, bottom: 179 }),
        new Word({ left: 432, top: 151, right: 469, bottom: 179 }),
        new Word({ left: 476, top: 151, right: 511, bottom: 179 }),
        new Word({ left: 518, top: 151, right: 578, bottom: 179 }),
        new Word({ left: 585, top: 151, right: 657, bottom: 179 }),
        new Word({ left: 663, top: 151, right: 696, bottom: 179 }),
        new Word({ left: 702, top: 151, right: 798, bottom: 179 }),
        new Word({ left: 805, top: 151, right: 888, bottom: 179 }),
        new Word({ left: 894, top: 151, right: 933, bottom: 179 }),
        new Word({ left: 939, top: 151, right: 1008, bottom: 179 }),
        new Word({ left: 1015, top: 151, right: 1063, bottom: 179 }),
        new Word({ left: 1070, top: 151, right: 1104, bottom: 179 }),
        new Word({ left: 67, top: 199, right: 172, bottom: 227 }),
        new Word({ left: 179, top: 199, right: 214, bottom: 227 }),
        new Word({ left: 221, top: 199, right: 277, bottom: 227 }),
        new Word({ left: 283, top: 199, right: 318, bottom: 227 }),
        new Word({ left: 324, top: 199, right: 408, bottom: 227 }),
        new Word({ left: 414, top: 199, right: 453, bottom: 227 }),
        new Word({ left: 459, top: 199, right: 531, bottom: 227 }),
        new Word({ left: 538, top: 199, right: 587, bottom: 227 }),
        new Word({ left: 594, top: 199, right: 629, bottom: 227 }),
        new Word({ left: 635, top: 199, right: 664, bottom: 227 }),
        new Word({ left: 671, top: 199, right: 729, bottom: 227 }),
        new Word({ left: 736, top: 199, right: 786, bottom: 227 }),
        new Word({ left: 793, top: 199, right: 844, bottom: 227 }),
        new Word({ left: 850, top: 199, right: 916, bottom: 227 }),
        new Word({ left: 922, top: 199, right: 944, bottom: 227 }),
        new Word({ left: 950, top: 199, right: 986, bottom: 227 }),
        new Word({ left: 993, top: 199, right: 1037, bottom: 227 }),
        new Word({ left: 1043, top: 199, right: 1081, bottom: 227 }),
        new Word({ left: 67, top: 247, right: 146, bottom: 275 }),
        new Word({ left: 152, top: 247, right: 201, bottom: 275 }),
        new Word({ left: 207, top: 247, right: 242, bottom: 275 }),
        new Word({ left: 248, top: 247, right: 352, bottom: 275 }),
        new Word({ left: 358, top: 247, right: 408, bottom: 275 }),
        new Word({ left: 414, top: 247, right: 449, bottom: 275 }),
        new Word({ left: 455, top: 247, right: 583, bottom: 275 }),
        new Word({ left: 589, top: 247, right: 630, bottom: 275 }),
        new Word({ left: 636, top: 247, right: 663, bottom: 275 }),
        new Word({ left: 670, top: 247, right: 731, bottom: 275 }),
        new Word({ left: 738, top: 247, right: 794, bottom: 275 }),
        new Word({ left: 800, top: 247, right: 835, bottom: 275 }),
        new Word({ left: 841, top: 247, right: 911, bottom: 275 }),
        new Word({ left: 917, top: 247, right: 1014, bottom: 275 }),
        new Word({ left: 1020, top: 247, right: 1082, bottom: 275 }),
        new Word({ left: 67, top: 295, right: 108, bottom: 323 }),
        new Word({ left: 114, top: 295, right: 168, bottom: 323 }),
        new Word({ left: 175, top: 295, right: 231, bottom: 323 }),
        new Word({ left: 237, top: 295, right: 263, bottom: 323 }),
        new Word({ left: 269, top: 295, right: 299, bottom: 323 }),
        new Word({ left: 305, top: 295, right: 347, bottom: 323 }),
        new Word({ left: 354, top: 295, right: 399, bottom: 323 }),
        new Word({ left: 406, top: 295, right: 446, bottom: 323 }),
        new Word({ left: 453, top: 295, right: 530, bottom: 323 }),
        new Word({ left: 536, top: 295, right: 558, bottom: 323 }),
        new Word({ left: 564, top: 295, right: 607, bottom: 323 }),
        new Word({ left: 613, top: 295, right: 636, bottom: 323 }),
        new Word({ left: 642, top: 295, right: 678, bottom: 323 }),
        new Word({ left: 685, top: 295, right: 740, bottom: 323 }),
        new Word({ left: 747, top: 295, right: 754, bottom: 323 }),
        new Word({ left: 761, top: 295, right: 816, bottom: 323 }),
        new Word({ left: 822, top: 295, right: 850, bottom: 323 }),
        new Word({ left: 856, top: 295, right: 927, bottom: 323 }),
        new Word({ left: 934, top: 295, right: 956, bottom: 323 }),
        new Word({ left: 962, top: 295, right: 1004, bottom: 323 }),
        new Word({ left: 1011, top: 295, right: 1034, bottom: 323 }),
        new Word({ left: 1040, top: 295, right: 1098, bottom: 323 }),
        new Word({ left: 1104, top: 295, right: 1112, bottom: 323 }),
        new Word({ left: 67, top: 343, right: 122, bottom: 371 }),
        new Word({ left: 128, top: 343, right: 156, bottom: 371 }),
        new Word({ left: 162, top: 343, right: 269, bottom: 371 }),
        new Word({ left: 276, top: 343, right: 322, bottom: 371 }),
        new Word({ left: 329, top: 343, right: 356, bottom: 371 }),
        new Word({ left: 363, top: 343, right: 378, bottom: 371 }),
        new Word({ left: 385, top: 343, right: 426, bottom: 371 }),
        new Word({ left: 432, top: 343, right: 460, bottom: 371 }),
        new Word({ left: 466, top: 343, right: 492, bottom: 371 }),
        new Word({ left: 498, top: 343, right: 514, bottom: 371 }),
        new Word({ left: 520, top: 343, right: 548, bottom: 371 }),
        new Word({ left: 554, top: 343, right: 590, bottom: 371 }),
        new Word({ left: 597, top: 343, right: 652, bottom: 371 }),
        new Word({ left: 659, top: 343, right: 700, bottom: 371 }),
        new Word({ left: 707, top: 343, right: 734, bottom: 371 }),
        new Word({ left: 740, top: 343, right: 841, bottom: 371 }),
        new Word({ left: 848, top: 343, right: 909, bottom: 371 }),
        new Word({ left: 916, top: 343, right: 959, bottom: 371 }),
        new Word({ left: 965, top: 343, right: 1015, bottom: 371 }),
        new Word({ left: 1021, top: 343, right: 1042, bottom: 371 }),
        new Word({ left: 1048, top: 343, right: 1084, bottom: 371 }),
        new Word({ left: 67, top: 391, right: 106, bottom: 419 }),
        new Word({ left: 113, top: 391, right: 134, bottom: 419 }),
        new Word({ left: 140, top: 391, right: 263, bottom: 419 }),
        new Word({ left: 269, top: 391, right: 320, bottom: 419 }),
        new Word({ left: 326, top: 391, right: 376, bottom: 419 }),
        new Word({ left: 382, top: 391, right: 423, bottom: 419 }),
        new Word({ left: 430, top: 391, right: 484, bottom: 419 }),
        new Word({ left: 490, top: 391, right: 546, bottom: 419 }),
        new Word({ left: 553, top: 391, right: 597, bottom: 419 }),
        new Word({ left: 603, top: 391, right: 643, bottom: 419 }),
        new Word({ left: 650, top: 391, right: 721, bottom: 419 }),
        new Word({ left: 728, top: 391, right: 774, bottom: 419 }),
        new Word({ left: 781, top: 391, right: 842, bottom: 419 }),
        new Word({ left: 849, top: 391, right: 901, bottom: 419 }),
        new Word({ left: 907, top: 391, right: 987, bottom: 419 }),
        new Word({ left: 993, top: 391, right: 1014, bottom: 419 }),
        new Word({ left: 67, top: 439, right: 184, bottom: 467 }),
        new Word({ left: 190, top: 439, right: 249, bottom: 467 }),
        new Word({ left: 256, top: 439, right: 346, bottom: 467 }),
        new Word({ left: 353, top: 439, right: 380, bottom: 467 }),
        new Word({ left: 387, top: 439, right: 487, bottom: 467 }),
        new Word({ left: 494, top: 439, right: 537, bottom: 467 }),
        new Word({ left: 543, top: 439, right: 585, bottom: 467 }),
        new Word({ left: 591, top: 439, right: 619, bottom: 467 }),
        new Word({ left: 625, top: 439, right: 711, bottom: 467 }),
        new Word({ left: 718, top: 439, right: 762, bottom: 467 }),
        new Word({ left: 768, top: 439, right: 811, bottom: 467 }),
        new Word({ left: 817, top: 439, right: 872, bottom: 467 }),
        new Word({ left: 878, top: 439, right: 954, bottom: 467 }),
        new Word({ left: 960, top: 439, right: 1015, bottom: 467 }),
        new Word({ left: 1021, top: 439, right: 1065, bottom: 467 }),
        new Word({ left: 1071, top: 439, right: 1113, bottom: 467 }),
        new Word({ left: 67, top: 487, right: 146, bottom: 515 }),
        new Word({ left: 152, top: 487, right: 179, bottom: 515 }),
        new Word({ left: 186, top: 487, right: 222, bottom: 515 }),
        new Word({ left: 228, top: 487, right: 301, bottom: 515 }),
        new Word({ left: 308, top: 487, right: 352, bottom: 515 }),
        new Word({ left: 358, top: 487, right: 399, bottom: 515 }),
        new Word({ left: 406, top: 487, right: 461, bottom: 515 }),
        new Word({ left: 467, top: 487, right: 490, bottom: 515 }),
        new Word({ left: 497, top: 487, right: 561, bottom: 515 }),
        new Word({ left: 567, top: 487, right: 617, bottom: 515 }),
        new Word({ left: 623, top: 487, right: 664, bottom: 515 }),
        new Word({ left: 671, top: 487, right: 718, bottom: 515 }),
        new Word({ left: 724, top: 487, right: 767, bottom: 515 }),
        new Word({ left: 773, top: 487, right: 815, bottom: 515 }),
        new Word({ left: 821, top: 487, right: 947, bottom: 515 }),
        new Word({ left: 953, top: 487, right: 1010, bottom: 515 }),
        new Word({ left: 1016, top: 487, right: 1069, bottom: 515 }),
        new Word({ left: 67, top: 535, right: 162, bottom: 563 }),
        new Word({ left: 168, top: 535, right: 202, bottom: 563 }),
        new Word({ left: 209, top: 535, right: 241, bottom: 563 }),
        new Word({ left: 247, top: 535, right: 291, bottom: 563 }),
        new Word({ left: 298, top: 535, right: 414, bottom: 563 }),
        new Word({ left: 421, top: 535, right: 436, bottom: 563 }),
        new Word({ left: 443, top: 535, right: 484, bottom: 563 }),
        new Word({ left: 490, top: 535, right: 518, bottom: 563 }),
        new Word({ left: 524, top: 535, right: 550, bottom: 563 }),
        new Word({ left: 556, top: 535, right: 578, bottom: 563 }),
        new Word({ left: 585, top: 535, right: 607, bottom: 563 }),
        new Word({ left: 613, top: 535, right: 674, bottom: 563 }),
        new Word({ left: 680, top: 535, right: 703, bottom: 563 }),
        new Word({ left: 709, top: 535, right: 745, bottom: 563 }),
        new Word({ left: 751, top: 535, right: 814, bottom: 563 }),
        new Word({ left: 820, top: 535, right: 828, bottom: 563 }),
        new Word({ left: 834, top: 535, right: 876, bottom: 563 }),
        new Word({ left: 883, top: 535, right: 946, bottom: 563 }),
        new Word({ left: 952, top: 535, right: 995, bottom: 563 }),
        new Word({ left: 1002, top: 535, right: 1015, bottom: 563 }),
        new Word({ left: 1021, top: 535, right: 1079, bottom: 563 }),
        new Word({ left: 67, top: 583, right: 155, bottom: 611 }),
        new Word({ left: 161, top: 583, right: 184, bottom: 611 }),
        new Word({ left: 190, top: 583, right: 242, bottom: 611 }),
        new Word({ left: 248, top: 583, right: 303, bottom: 611 }),
        new Word({ left: 310, top: 583, right: 354, bottom: 611 }),
        new Word({ left: 360, top: 583, right: 420, bottom: 611 }),
        new Word({ left: 426, top: 583, right: 475, bottom: 611 }),
        new Word({ left: 481, top: 583, right: 504, bottom: 611 }),
        new Word({ left: 510, top: 583, right: 581, bottom: 611 })
    ];

    var simulated = [
        { x: 67, y: 151 },
        { x: 105, y: 151 },
        { x: 161, y: 151 },
        { x: 222, y: 151 },
        { x: 290, y: 151 },
        { x: 334, y: 151 },
        { x: 390, y: 151 },
        { x: 432, y: 151 },
        { x: 476, y: 151 },
        { x: 518, y: 151 },
        { x: 585, y: 151 },
        { x: 663, y: 151 },
        { x: 702, y: 151 },
        { x: 805, y: 151 },
        { x: 894, y: 151 },
        { x: 939, y: 151 },
        { x: 1015, y: 151 },
        { x: 1070, y: 151 },
        { x: 67, y: 199 },
        { x: 179, y: 199 },
        { x: 221, y: 199 },
        { x: 283, y: 199 },
        { x: 324, y: 199 },
        { x: 414, y: 199 },
        { x: 459, y: 199 }
    ];

    var mouse = [
        { x: 53, y: 108 },
        { x: 157, y: 101 },
        { x: 243, y: 92 },
        { x: 357, y: 106 },
        { x: 564, y: 85 },
        { x: 639, y: 90 },
        { x: 729, y: 80 },
        { x: 855, y: 75 },
        { x: 943, y: 91 },
        { x: 1005, y: 85 },
        { x: 1081, y: 65 },
        { x: 1177, y: 75 },
        { x: 233, y: 116 },
        { x: 320, y: 130 },
        { x: 408, y: 140 },
        { x: 507, y: 131 },
        { x: 583, y: 144 },
        { x: 671, y: 143 },
        { x: 723, y: 139 },
        { x: 790, y: 139 },
        { x: 919, y: 147 },
        { x: 1013, y: 107 },
        { x: 1172, y: 119 },
        { x: 47, y: 207 },
        { x: 232, y: 172 },
        { x: 300, y: 219 },
        { x: 420, y: 191 },
        { x: 484, y: 162 },
        { x: 667, y: 149 },
        { x: 760, y: 200 },
        { x: 833, y: 170 },
        { x: 961, y: 149 },
        { x: 1105, y: 200 },
    ];

    var nonreading = [
        { x: 170, y: 194, d: 833 },
        { x: 238, y: 75, d: 400 },
        { x: 322, y: 237, d: 400 },
        { x: 327, y: 224, d: 52 },
        { x: 376, y: -16, d: 267 },
        { x: 459, y: -27, d: 500 },
        { x: 524, y: 78, d: 200 },
    ];

    var layout2 = [
        new Word({ left: 66.66667175292969, top: 76, right: 97.33332824707031, bottom: 104 }),
        new Word({ left: 103.33332824707031, top: 76, right: 147.3333282470703, bottom: 104 }),
        new Word({ left: 153.3333282470703, top: 76, right: 201.3333282470703, bottom: 104 }),
        new Word({ left: 207.3333282470703, top: 76, right: 262.6499938964844, bottom: 104 }),
        new Word({ left: 268.6499938964844, top: 76, right: 303.3500061035156, bottom: 104 }),
        new Word({ left: 309.3500061035156, top: 76, right: 353.3500061035156, bottom: 104 }),
        new Word({ left: 359.3500061035156, top: 76, right: 392.21665954589844, bottom: 104 }),
        new Word({ left: 398.2166748046875, top: 76, right: 431.5666809082031, bottom: 104 }),
        new Word({ left: 437.566650390625, top: 76, right: 469.566650390625, bottom: 104 }),
        new Word({ left: 475.566650390625, top: 76, right: 527.5499877929688, bottom: 104 }),
        new Word({ left: 533.5499877929688, top: 76, right: 596.2499847412109, bottom: 104 }),
        new Word({ left: 602.25, top: 76, right: 632.8999938964844, bottom: 104 }),
        new Word({ left: 638.9000244140625, top: 76, right: 727.7833709716797, bottom: 104 }),
        new Word({ left: 733.7833251953125, top: 76, right: 806.4499816894531, bottom: 104 }),
        new Word({ left: 812.4500122070312, top: 76, right: 849.7666778564453, bottom: 104 }),
        new Word({ left: 66.66667175292969, top: 124, right: 124.64999389648438, bottom: 152 }),
        new Word({ left: 130.64999389648438, top: 124, right: 173.3333282470703, bottom: 152 }),
        new Word({ left: 179.3333282470703, top: 124, right: 212.1999969482422, bottom: 152 }),
        new Word({ left: 218.1999969482422, top: 124, right: 314.8000030517578, bottom: 152 }),
        new Word({ left: 320.79998779296875, top: 124, right: 352.79998779296875, bottom: 152 }),
        new Word({ left: 358.79998779296875, top: 124, right: 408.1166534423828, bottom: 152 }),
        new Word({ left: 414.1166687011719, top: 124, right: 446.98333740234375, bottom: 152 }),
        new Word({ left: 452.98333740234375, top: 124, right: 524.3333282470703, bottom: 152 }),
        new Word({ left: 530.3333129882812, top: 124, right: 567.6499786376953, bottom: 152 }),
        new Word({ left: 573.6500244140625, top: 124, right: 637.6333618164062, bottom: 152 }),
        new Word({ left: 643.63330078125, top: 124, right: 687.63330078125, bottom: 152 }),
        new Word({ left: 693.63330078125, top: 124, right: 726.4999694824219, bottom: 152 }),
        new Word({ left: 732.5, top: 124, right: 757.8500061035156, bottom: 152 }),
        new Word({ left: 763.8499755859375, top: 124, right: 816.7166290283203, bottom: 152 }),
        new Word({ left: 822.7166748046875, top: 124, right: 869.4166870117188, bottom: 152 }),
        new Word({ left: 66.66667175292969, top: 172, right: 113.31666564941406, bottom: 200 }),
        new Word({ left: 119.31666564941406, top: 172, right: 175.3333282470703, bottom: 200 }),
        new Word({ left: 181.3333282470703, top: 172, right: 201.35000610351562, bottom: 200 }),
        new Word({ left: 207.35000610351562, top: 172, right: 239.35000610351562, bottom: 200 }),
        new Word({ left: 245.35000610351562, top: 172, right: 284.71665954589844, bottom: 200 }),
        new Word({ left: 290.7166748046875, top: 172, right: 328.0333557128906, bottom: 200 }),
        new Word({ left: 334.0333251953125, top: 172, right: 404.0166473388672, bottom: 200 }),
        new Word({ left: 410.01666259765625, top: 172, right: 452.6999969482422, bottom: 200 }),
        new Word({ left: 458.70001220703125, top: 172, right: 491.5666809082031, bottom: 200 }),
        new Word({ left: 497.566650390625, top: 172, right: 587.5499877929688, bottom: 200 }),
        new Word({ left: 593.5499877929688, top: 172, right: 637.5499877929688, bottom: 200 }),
        new Word({ left: 643.5499877929688, top: 172, right: 676.4166564941406, bottom: 200 }),
        new Word({ left: 682.4166870117188, top: 172, right: 795.9833526611328, bottom: 200 }),
        new Word({ left: 801.9833374023438, top: 172, right: 839.3333282470703, bottom: 200 }),
        new Word({ left: 845.3333129882812, top: 172, right: 870.6666564941406, bottom: 200 }),
        new Word({ left: 66.66667175292969, top: 220, right: 118.64999389648438, bottom: 248 }),
        new Word({ left: 124.64999389648438, top: 220, right: 173.96665954589844, bottom: 248 }),
        new Word({ left: 179.96665954589844, top: 220, right: 212.8333282470703, bottom: 248 }),
        new Word({ left: 218.8333282470703, top: 220, right: 279.5, bottom: 248 }),
        new Word({ left: 285.5, top: 220, right: 373.53334045410156, bottom: 248 }),
        new Word({ left: 379.5333251953125, top: 220, right: 434.1999816894531, bottom: 248 }),
        new Word({ left: 440.20001220703125, top: 220, right: 477.5333557128906, bottom: 248 }),
        new Word({ left: 483.5333251953125, top: 220, right: 531.5333251953125, bottom: 248 }),
        new Word({ left: 537.5333251953125, top: 220, right: 586.8499908447266, bottom: 248 }),
        new Word({ left: 592.8499755859375, top: 220, right: 614.1833038330078, bottom: 248 }),
        new Word({ left: 620.183349609375, top: 220, right: 645.5333557128906, bottom: 248 }),
        new Word({ left: 651.5333251953125, top: 220, right: 687.5333251953125, bottom: 248 }),
        new Word({ left: 693.5333251953125, top: 220, right: 730.8333129882812, bottom: 248 }),
        new Word({ left: 736.8333129882812, top: 220, right: 771.5166473388672, bottom: 248 }),
        new Word({ left: 777.5166625976562, top: 220, right: 847.5166625976562, bottom: 248 }),
        new Word({ left: 853.5166625976562, top: 220, right: 876.1999969482422, bottom: 248 }),
        new Word({ left: 66.66667175292969, top: 268, right: 102.66667175292969, bottom: 296 }),
        new Word({ left: 108.66667175292969, top: 268, right: 128.6666717529297, bottom: 296 }),
        new Word({ left: 134.6666717529297, top: 268, right: 166.6666717529297, bottom: 296 }),
        new Word({ left: 172.6666717529297, top: 268, right: 221.98333740234375, bottom: 296 }),
        new Word({ left: 227.98333740234375, top: 268, right: 237.31666564941406, bottom: 296 }),
        new Word({ left: 243.31666564941406, top: 268, right: 291.3333282470703, bottom: 296 }),
        new Word({ left: 297.33331298828125, top: 268, right: 321.33331298828125, bottom: 296 }),
        new Word({ left: 327.33331298828125, top: 268, right: 390.6833190917969, bottom: 296 }),
        new Word({ left: 396.683349609375, top: 268, right: 419.36668395996094, bottom: 296 }),
        new Word({ left: 425.3666687011719, top: 268, right: 461.3666687011719, bottom: 296 }),
        new Word({ left: 467.3666687011719, top: 268, right: 487.3666687011719, bottom: 296 }),
        new Word({ left: 493.3666687011719, top: 268, right: 545.3666687011719, bottom: 296 }),
        new Word({ left: 551.36669921875, top: 268, right: 560.7000274658203, bottom: 296 }),
        new Word({ left: 566.7000122070312, top: 268, right: 614.7166748046875, bottom: 296 }),
        new Word({ left: 620.7166748046875, top: 268, right: 644.7166748046875, bottom: 296 }),
        new Word({ left: 650.7166748046875, top: 268, right: 746.1000213623047, bottom: 296 }),
        new Word({ left: 752.0999755859375, top: 268, right: 796.13330078125, bottom: 296 }),
        new Word({ left: 802.13330078125, top: 268, right: 823.4666290283203, bottom: 296 }),
        new Word({ left: 829.4666748046875, top: 268, right: 844.1333465576172, bottom: 296 }),
        new Word({ left: 66.66667175292969, top: 316, right: 104, bottom: 344 }),
        new Word({ left: 110, top: 316, right: 134, bottom: 344 }),
        new Word({ left: 140, top: 316, right: 161.3333282470703, bottom: 344 }),
        new Word({ left: 167.3333282470703, top: 316, right: 182, bottom: 344 }),
        new Word({ left: 188, top: 316, right: 213.3333282470703, bottom: 344 }),
        new Word({ left: 219.3333282470703, top: 316, right: 251.3333282470703, bottom: 344 }),
        new Word({ left: 257.33331298828125, top: 316, right: 306.6499786376953, bottom: 344 }),
        new Word({ left: 312.6499938964844, top: 316, right: 349.98333740234375, bottom: 344 }),
        new Word({ left: 355.98333740234375, top: 316, right: 379.98333740234375, bottom: 344 }),
        new Word({ left: 385.98333740234375, top: 316, right: 475.3666687011719, bottom: 344 }),
        new Word({ left: 481.3666687011719, top: 316, right: 536.0500030517578, bottom: 344 }),
        new Word({ left: 542.0499877929688, top: 316, right: 579.3999786376953, bottom: 344 }),
        new Word({ left: 585.4000244140625, top: 316, right: 629.4167022705078, bottom: 344 }),
        new Word({ left: 635.4166870117188, top: 316, right: 655.4166870117188, bottom: 344 }),
        new Word({ left: 661.4166870117188, top: 316, right: 693.4166870117188, bottom: 344 }),
        new Word({ left: 699.4166870117188, top: 316, right: 734.1000213623047, bottom: 344 }),
        new Word({ left: 740.0999755859375, top: 316, right: 760.0999755859375, bottom: 344 }),
        new Word({ left: 766.0999755859375, top: 316, right: 877.4833068847656, bottom: 344 }),
        new Word({ left: 66.66667175292969, top: 364, right: 110.68333435058594, bottom: 392 }),
        new Word({ left: 116.68333435058594, top: 364, right: 160.03334045410156, bottom: 392 }),
        new Word({ left: 166.03334045410156, top: 364, right: 203.36666870117188, bottom: 392 }),
        new Word({ left: 209.36666870117188, top: 364, right: 257.3666687011719, bottom: 392 }),
        new Word({ left: 263.3666687011719, top: 364, right: 312.68333435058594, bottom: 392 }),
        new Word({ left: 318.683349609375, top: 364, right: 360.0333557128906, bottom: 392 }),
        new Word({ left: 366.0333251953125, top: 364, right: 402.0333251953125, bottom: 392 }),
        new Word({ left: 408.0333251953125, top: 364, right: 473.3999786376953, bottom: 392 }),
        new Word({ left: 479.3999938964844, top: 364, right: 523.4333343505859, bottom: 392 }),
        new Word({ left: 529.433349609375, top: 364, right: 584.1166839599609, bottom: 392 }),
        new Word({ left: 590.11669921875, top: 364, right: 638.11669921875, bottom: 392 }),
        new Word({ left: 644.11669921875, top: 364, right: 715.6500244140625, bottom: 392 }),
        new Word({ left: 721.6500244140625, top: 364, right: 737.6500244140625, bottom: 392 }),
        new Word({ left: 743.6500244140625, top: 364, right: 848.9500274658203, bottom: 392 }),
        new Word({ left: 66.66667175292969, top: 412, right: 119.98333740234375, bottom: 440 }),
        new Word({ left: 125.98333740234375, top: 412, right: 200.64999389648438, bottom: 440 }),
        new Word({ left: 206.64999389648438, top: 412, right: 231.98333740234375, bottom: 440 }),
        new Word({ left: 237.98333740234375, top: 412, right: 326.8500061035156, bottom: 440 }),
        new Word({ left: 332.8500061035156, top: 412, right: 370.1999969482422, bottom: 440 }),
        new Word({ left: 376.20001220703125, top: 412, right: 413.5333557128906, bottom: 440 }),
        new Word({ left: 419.5333251953125, top: 412, right: 443.5333251953125, bottom: 440 }),
        new Word({ left: 449.5333251953125, top: 412, right: 525.5333251953125, bottom: 440 }),
        new Word({ left: 531.5333251953125, top: 412, right: 572.8833160400391, bottom: 440 }),
        new Word({ left: 578.88330078125, top: 412, right: 616.2333068847656, bottom: 440 }),
        new Word({ left: 622.2333374023438, top: 412, right: 670.2333374023438, bottom: 440 }),
        new Word({ left: 676.2333374023438, top: 412, right: 745.6166687011719, bottom: 440 }),
        new Word({ left: 751.61669921875, top: 412, right: 800.2666931152344, bottom: 440 }),
        new Word({ left: 806.2666625976562, top: 412, right: 846.2833404541016, bottom: 440 }),
        new Word({ left: 66.66667175292969, top: 460, right: 104, bottom: 488 }),
        new Word({ left: 110, top: 460, right: 179.3333282470703, bottom: 488 }),
        new Word({ left: 185.3333282470703, top: 460, right: 209.3333282470703, bottom: 488 }),
        new Word({ left: 215.3333282470703, top: 460, right: 247.3333282470703, bottom: 488 }),
        new Word({ left: 253.3333282470703, top: 460, right: 322, bottom: 488 }),
        new Word({ left: 328, top: 460, right: 368.01666259765625, bottom: 488 }),
        new Word({ left: 374.01666259765625, top: 460, right: 411.3500061035156, bottom: 488 }),
        new Word({ left: 417.3500061035156, top: 460, right: 468.03334045410156, bottom: 488 }),
        new Word({ left: 474.0333251953125, top: 460, right: 494.0333251953125, bottom: 488 }),
        new Word({ left: 500.0333251953125, top: 460, right: 557.3999786376953, bottom: 488 }),
        new Word({ left: 563.4000244140625, top: 460, right: 608.7500305175781, bottom: 488 }),
        new Word({ left: 614.75, top: 460, right: 651.3999938964844, bottom: 488 }),
        new Word({ left: 657.4000244140625, top: 460, right: 701.4333648681641, bottom: 488 }),
        new Word({ left: 707.433349609375, top: 460, right: 744.7833557128906, bottom: 488 }),
        new Word({ left: 750.7833251953125, top: 460, right: 788.1166534423828, bottom: 488 }),
        new Word({ left: 66.66667175292969, top: 508, right: 173.3000030517578, bottom: 536 }),
        new Word({ left: 179.3000030517578, top: 508, right: 228.64999389648438, bottom: 536 }),
        new Word({ left: 234.64999389648438, top: 508, right: 282.6499938964844, bottom: 536 }),
        new Word({ left: 288.6499938964844, top: 508, right: 373.3500061035156, bottom: 536 }),
        new Word({ left: 379.3500061035156, top: 508, right: 406.68333435058594, bottom: 536 }),
        new Word({ left: 412.683349609375, top: 508, right: 443.3333435058594, bottom: 536 }),
        new Word({ left: 449.33331298828125, top: 508, right: 490.6833190917969, bottom: 536 }),
        new Word({ left: 496.683349609375, top: 508, right: 600.9000091552734, bottom: 536 }),
        new Word({ left: 606.9000244140625, top: 508, right: 624.2333679199219, bottom: 536 }),
        new Word({ left: 630.2333374023438, top: 508, right: 667.5666656494141, bottom: 536 }),
        new Word({ left: 673.566650390625, top: 508, right: 697.566650390625, bottom: 536 }),
        new Word({ left: 703.566650390625, top: 508, right: 724.8999786376953, bottom: 536 }),
        new Word({ left: 730.9000244140625, top: 508, right: 751.5666961669922, bottom: 536 }),
        new Word({ left: 757.566650390625, top: 508, right: 777.5833129882812, bottom: 536 }),
        new Word({ left: 783.5833129882812, top: 508, right: 836.8999786376953, bottom: 536 }),
        new Word({ left: 842.9000244140625, top: 508, right: 862.9000244140625, bottom: 536 }),
        new Word({ left: 66.66667175292969, top: 556, right: 98.66667175292969, bottom: 584 }),
        new Word({ left: 104.66667175292969, top: 556, right: 159.98333740234375, bottom: 584 }),
        new Word({ left: 165.98333740234375, top: 556, right: 175.31666564941406, bottom: 584 }),
        new Word({ left: 181.31666564941406, top: 556, right: 220.01666259765625, bottom: 584 }),
        new Word({ left: 226.01666259765625, top: 556, right: 280.68333435058594, bottom: 584 }),
        new Word({ left: 286.683349609375, top: 556, right: 324.0333557128906, bottom: 584 }),
        new Word({ left: 330.0333251953125, top: 556, right: 342.0333251953125, bottom: 584 }),
        new Word({ left: 348.0333251953125, top: 556, right: 400.8999786376953, bottom: 584 }),
        new Word({ left: 406.8999938964844, top: 556, right: 488.25, bottom: 584 }),
        new Word({ left: 494.25, top: 556, right: 514.25, bottom: 584 }),
        new Word({ left: 520.25, top: 556, right: 566.8999938964844, bottom: 584 }),
        new Word({ left: 572.9000244140625, top: 556, right: 619.5666961669922, bottom: 584 }),
        new Word({ left: 625.566650390625, top: 556, right: 666.9166564941406, bottom: 584 }),
        new Word({ left: 672.9166870117188, top: 556, right: 727.6000213623047, bottom: 584 }),
        new Word({ left: 733.5999755859375, top: 556, right: 776.2833099365234, bottom: 584 }),
        new Word({ left: 782.2833251953125, top: 556, right: 802.2833251953125, bottom: 584 }),
        new Word({ left: 808.2833251953125, top: 556, right: 871.6499786376953, bottom: 584 }),
    ];

    var fix_progressive = [
        { x: -62, y: -9, d: 701 },
        { x: 117, y: -13, d: 167 },
        { x: 123, y: -6, d: 733 },
        { x: 185, y: -2, d: 634 },
        { x: 293, y: 0, d: 601 },
        { x: 399, y: -2, d: 534 },
        { x: 458, y: -1, d: 499 },
        { x: 542, y: -9, d: 466 },
        { x: 664, y: -4, d: 433 },
        { x: -62, y: -181, d: 400 },
//        { x: 671, y: 188, d: 133 },
        { x: 734, y: -21, d: 367 },
        { x: 800, y: -29, d: 433 },
        { x: 107, y: 38, d: 566 },
        { x: 175, y: 56, d: 500 },
        { x: 295, y: 76, d: 533 },
        { x: 357, y: 65, d: 666 },
        { x: 461, y: 59, d: 766 },
        { x: -62, y: -238, d: 100 },
//        { x: 483, y: 267, d: 267 },
        { x: 562, y: 49, d: 533 },
        { x: -62, y: -206, d: 381 },
//        { x: 581, y: 253, d: 100 },
        { x: 661, y: 62, d: 634 },
        { x: 691, y: 78, d: 252 },
        { x: 791, y: 95, d: 667 },
        { x: 63, y: 135, d: 500 },
        { x: 146, y: 145, d: 800 },
        { x: 270, y: 120, d: 200 },
        { x: 337, y: 137, d: 633 },
        { x: 449, y: 113, d: 334 },
        { x: 511, y: 131, d: 519 },
        { x: 616, y: 120, d: 267 },
        { x: 688, y: 101, d: 467 },
        { x: 794, y: 117, d: 800 },
        { x: 94, y: 203, d: 467 },
        { x: 170, y: 218, d: 300 },
        { x: 236, y: 211, d: 718 },
        { x: 331, y: 207, d: 266 },
        { x: 393, y: 213, d: 666 },
        { x: 464, y: 223, d: 635 },
        { x: -62, y: -312, d: 100 },
//        { x: 532, y: 342, d: 133 },
        { x: 612, y: 208, d: 401 },
        { x: -62, y: -308, d: 233 },
//        { x: 628, y: 338, d: 401 },
        { x: 695, y: 210, d: 501 },
        { x: 802, y: 214, d: 167 },
        { x: -62, y: -306, d: 305 },
//        { x: 802, y: 334, d: 433 },
    ];

    var fix_regressive = [
        { x: -62, y: -99, d: 634 },
        //{ x: 139, y: 217, d: 132 },
        { x: 96, y: -14, d: 301 },
        { x: 130, y: 69, d: 466 },
        { x: 207, y: 18, d: 466 },
        { x: 307, y: 15, d: 466 },
        { x: 414, y: 4, d: 799 },
        { x: 475, y: -19, d: 500 },
        { x: 600, y: -7, d: 433 },
        { x: 701, y: -3, d: 166 },
        { x: -62, y: -140, d: 134 },
        { x: 707, y: 16, d: 100 },
        { x: -62, y: -138, d: 399 },
        { x: 803, y: 14, d: 267 },
        { x: -62, y: -126, d: 367 },
        { x: 807, y: 18, d: 265 },
        { x: 195, y: 14, d: 567 },
        { x: 243, y: 22, d: 667 },
        { x: 316, y: 13, d: 267 },
        { x: 371, y: 15, d: 429 },
        { x: 484, y: 13, d: 400 },
        { x: 542, y: 17, d: 399 },
        { x: 633, y: -4, d: 500 },
        { x: 746, y: -2, d: 265 },
        { x: -62, y: -156, d: 200 },
        { x: -62, y: 14, d: 334 },
        { x: 749, y: 19, d: 300 },
        { x: 141, y: 17, d: 701 },
        { x: 208, y: 47, d: 567 },
        { x: 309, y: 15, d: 432 },
        { x: 429, y: 25, d: 233 },
        { x: 446, y: 48, d: 500 },
        { x: 556, y: 26, d: 165 },
        { x: 672, y: 14, d: 433 },
        { x: 777, y: -5, d: 700 },
    ];

    var fix_lineup = [
        { x: -62, y: -99, d: 500 },
        { x: 164, y: 19, d: 467 },
        { x: 252, y: 25, d: 300 },
        { x: 319, y: 0, d: 534 },
        { x: 440, y: 9, d: 733 },
        { x: 540, y: 40, d: 733 },
        { x: 646, y: 11, d: 233 },
        { x: 736, y: 10, d: 1001 },
        { x: 170, y: 64, d: 833 },
        { x: 238, y: 75, d: 400 },
        { x: -62, y: -227, d: 300 },
        //{ x: 322, y: 237, d: 400 },
        { x: -62, y: -209, d: 267 },
        //{ x: 327, y: 224, d: 52 },
        { x: 376, y: 86, d: 267 },
        { x: 459, y: 77, d: 500 },
        { x: -62, y: -125, d: 66 },
        { x: 524, y: 88, d: 200 },
        { x: 660, y: 39, d: 600 },
        { x: 732, y: 29, d: 401 },
        { x: 812, y: 2, d: 434 },
        { x: -62, y: -138, d: 99 },
        //{ x: 75, y: 224, d: 257 },
        { x: 227, y: 14, d: 533 },
        { x: 222, y: 9, d: 100 },
        { x: 239, y: 16, d: 233 },
        { x: 265, y: -5, d: 162 },
        { x: 291, y: 6, d: 68 },
        { x: 380, y: 17, d: 700 },
        { x: 448, y: -5, d: 136 },
    ];

    var fix_linedown = [
        { x: 237, y: -6, d: 133 },
        { x: 595, y: 43, d: 367 },
        { x: 586, y: 33, d: 567 },
        { x: 658, y: 20, d: 500 },
        { x: 749, y: 2, d: 300 },
        { x: 803, y: -33, d: 533 },
        { x: -62, y: -228, d: 167 },
        { x: -62, y: 14, d: 167 },
        { x: 234, y: 275, d: 300 },
        { x: -62, y: -247, d: 34 },
        { x: 260, y: 274, d: 267 },
        //{ x: 321, y: -4, d: 233 },
        { x: -62, y: -228, d: 134 },
        { x: 329, y: 254, d: 100 },
        { x: -62, y: -226, d: 200 },
        { x: -62, y: 14, d: 1033 },
        { x: 452, y: 248, d: 167 },
        //{ x: 594, y: 1, d: 153 },
        { x: -62, y: -207, d: 233 },
        { x: 602, y: 238, d: 134 },
        //{ x: 704, y: 6, d: 433 },
        { x: -62, y: -195, d: 415 },
        { x: 710, y: 218, d: 267 },
        { x: -62, y: -190, d: 167 },
        { x: -62, y: 14, d: 34 },
        { x: 725, y: 204, d: 67 },
    ];

    QUnit.module( 'Regression module', {
        beforeEach: function() {
            console.log('################### Regression ##################');
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Regression', function( assert ) {
        var data = [
            [-10, -738],
            [-9, -520],
            [-8, -350],
            [-7, -222],
            [-6, -130],
            [-5, -68],
            [-4, -30],
            [-3, -10],
            [-2, -2],
            [-1, 0],
            [0, 2],
            [1, 10],
            [2, 30],
            [3, 68],
            [4, 130],
            [5, 222],
            [6, 350],
            [7, 520],
            [8, 738],
            [9, 1010],
            [10, 1342]
        ];
        
        var model = window.regression.model('polynomial', data, 3);
        console.log(model.string);

        var y = window.regression.fit(model.equation, -6);  

        assert.ok( y === model.points[4][1], 'regression' );
    });

    QUnit.module( 'Logger module', {
        beforeEach: function() {
            this.logger = window.GazeTargets.Logger;
            console.log('################### Logger ##################');
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Logger', function( assert ) {
        var level = this.logger.level( this.logger.Level.debug );
        this.logger.level( this.logger.Level.debug );
        assert.ok( this.logger.log('just debugging'), 'simple debug' );
        assert.ok( this.logger.log( this.logger.Type.error, 'this is error'), 'error' );
        this.logger.level( this.logger.Level.silent );
        assert.notOk( this.logger.log('hidden text'), 'no logging' );
        this.logger.level( level );
    });

    QUnit.module( 'Fixations module', {
        beforeEach: function() {
            this.logger = window.GazeTargets.Logger;
            this.fixations = window.GazeTargets.Models.Reading.Fixations;
            this.fixations.init();
            this.run = function (data) {
                
                var result = true;

                this.fixations.reset();
                console.log('################### Fixations ##################');

                for (var i = 0; i < data.length; i++) {
                    
                    var point = data[i];
                    var fix = {
                        x: point.x,
                        y: point.y,
                        duration: 0,
                        saccade: {
                            dx: 12,
                            dy: 15
                        }
                    }

                    for (j = 1; j <= 8; ++j) {
                        fix.duration = 33 * j;
                        var fixation = this.fixations.feed( fix );
                        result = result && (j === 3 ? !!fixation : !fixation);
                    }
                }

                return result;
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Fixations', function( assert ) {
        this.logger.level( this.logger.Level.debug );
        
        assert.ok( this.run( simulated ), 'test 1' );
        assert.ok( this.run( mouse ), 'test 2' );

        this.logger.level( this.logger.Level.silent );
    });

    QUnit.module( 'Geometry module', {
        beforeEach: function() {
            this.geometry = window.GazeTargets.Models.Reading.Geometry;
            this.geometry.reset();
            this.run = function (data, isFixed) {
                
                this.geometry.init( isFixed );
                console.log('################### Geometry ##################');

                var currentModel = this.geometry.model();
                var newModel = this.geometry.create( data );

                console.log(currentModel);

                if (isFixed) {
                    if (currentModel.lines.length) {
                        return newModel === null;
                    }
                    else {
                        return newModel && newModel.lines.length === 10;
                    }
                }
                else {
                    return newModel && newModel.lines.length === 10;
              }
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Geometry', function( assert ) {
        assert.ok( this.run( layout, false ), 'model does not exist yet, text is not static' );
        this.geometry.reset();
        assert.ok( this.run( layout, true ), 'model does not exist yet, text is static' );
        assert.ok( this.run( layout, true ), 'model exists already, text is static' );
    });

    QUnit.module( 'Zone module', {
        beforeEach: function() {
            this.zone = window.GazeTargets.Models.Reading.Zone;
            this.run = function (data, converter, mode) {
                
                var result = mode == 'all' ? true : false;
                this.zone.init({
                    progressiveLeft: -1,
                    progressiveRight: 10,
                    readingMarginY: 1,
                    neutralMarginY: 2,
                    slope: 0.15
                }, {
                    lineSpacing: 48,
                    lineHeight: 28,
                    lineWidth: 1100
                });
                this.zone.reset();
                console.log('################### Zone ##################');

                var lastFix = { x: -10000, y: -10000 };
                for (var i = 0; i < data.length; ++i) {
                    var word = data[i];

                    var fixation = { x: word.left + 1, y: word.top + 1};
                    if (converter) {
                        fixation = converter(fixation, word.rect);
                    }

                    if (lastFix.x < -1000) {
                        fixation.zone = 0;
                    }
                    else {
                        fixation.zone = 3;
                    }

                    var saccade = { x: fixation.x - lastFix.x, y : fixation.y - lastFix.y };
                    lastFix = fixation;

                    if (i === 0) {
                        continue;
                    }

                    var matchResult = this.zone.match(saccade);
                    
                    console.log(matchResult);

                    if (mode == 'all') {
                        result = result && ((matchResult === lastFix.zone) || (matchResult & lastFix.zone) > 0);
                    }
                    else {
                        result = result || ((matchResult === lastFix.zone) || (matchResult & lastFix.zone) > 0);
                        if (result) {
                            console.log(saccade, word.rect);
                        };
                    }
                }

                return result;
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Zone', function( assert ) {
        assert.ok( this.run( layout, undefined, 'all' ), 'just following word left-top rect location' );
        assert.notOk( this.run( layout, function (fix, word) { 
            return { 
                x: fix.x,
                y: fix.y + 5 * fix.x
            }; 
        }, 'any'), 'just following word left-top rect location' );
    });

    QUnit.module( 'NewLineDetector module', {
        beforeEach: function() {
            this.logger = window.GazeTargets.Logger;
            this.newLineDetector = window.GazeTargets.Models.Reading.NewLineDetector;
            this.newLineDetector.reset();
            this.run = function (data, converter) {
                
                var result = 0;
                this.newLineDetector.init({
                    minMarginY: 0.3,
                    maxMarginY: 1.3,
                    slope: 0.2
                }, {
                    lineSpacing: 48,
                    lineHeight: 28,
                    lineWidth: 1100
                });
                console.log('################### NewLineDetector ##################');

                var lastFix = { 
                    x: -10000, 
                    y: -10000,
                    previous: null,
                    saccade: {
                        x: 0,
                        y: 0,
                        zone: 0
                    },
                    word: null
                };
                
                for (var i = 0; i < data.length; ++i) {
                    var word = data[i];

                    var fixation = { 
                        x: word.rect.left + 1, 
                        y: word.rect.top + 1,
                        previous: lastFix
                    };

                    if (converter) {
                        fixation = converter(fixation, word.rect);
                    }

                    if (lastFix.x < -1000) {
                        fixation.zone = 0;
                    }
                    else {
                        fixation.zone = 3;
                    }

                    var saccade = { 
                        x: fixation.x - lastFix.x, 
                        y : fixation.y - lastFix.y
                    };

                    fixation.saccade = saccade;
                    fixation.word = word;

                    if (i === 0) {
                        continue;
                    }

                    if (this.newLineDetector.search(fixation, 0)) {
                        //console.log('new line');
                        result++;
                    }

                    lastFix = fixation;
                }

                return result;
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'NewLineDetector', function( assert ) {
        assert.equal( this.run( createProperLayot( layout ) ), 9, 'just following word left-top rect location' );
        assert.equal( this.run( createProperLayot( layout ), function (fix, word) {
            fix.x += randomInRange(-10, 10);
            fix.y += randomInRange(-10, 10) + randomInRange(-0.05, 0.05)  * fix.x;
            return fix; 
        } ), 9, 'twisted + randomized' );
    });

    QUnit.module( 'LinePredictor module', {
        beforeEach: function() {
            this.geometry = window.GazeTargets.Models.Reading.Geometry;
            this.geometry.reset();
            this.linePredictor = window.GazeTargets.Models.Reading.LinePredictor;
            this.linePredictor.reset();
            this.run = function (geomModel, switched, newLine, fixation ) {
                
                var result = 0;
                this.linePredictor.init( geomModel );
                console.log('################### LinePredictor ##################');

                return this.linePredictor.getAlways( switched, newLine, fixation, null, 0 );
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'LinePredictor', function( assert ) {
        this.geometry.init(true);
        var geomModel = this.geometry.create( layout );
        Fixations.init();

        var fixations = createProperFixations( simulated );
        var result;

        // test 1
        var fixIndex = 5;
        var fixOnReadingStart = fixations[ fixIndex ];
        result = this.run( geomModel, { toReading: true, toNonReading: false}, null, fixOnReadingStart);
        assert.equal( result.index, geomModel.lines[0].index, 'reading starts' );

        var fix = fixations[ fixIndex ];
        while (fix) {
            fix.word = geomModel.lines[0].words[ fixIndex ];
            fix = fix.previous;
            fixIndex--;
        }
        
        // test 2
        fixIndex = 6;
        var fixNext = fixations[ fixIndex ];
        result = this.run( geomModel, { toReading: false,  toNonReading: false }, null, fixNext);
        assert.equal( result.index, geomModel.lines[0].index, 'reading continues' );

        fixNext.word = geomModel.lines[0].words[ fixIndex ];
        fix = fixations[ 17 ];
        while (fix && fix != fixNext) {
            fix.word = geomModel.lines[0].words[ fixIndex ];
            fix = fix.previous;
            fixIndex--;
        }

        // test 3
        fixIndex = 18;
        var fixFirstOnSecondLine = fixations[ fixIndex ];
        result = this.run( geomModel, { toReading: false, toNonReading: true }, geomModel.lines[1], fixFirstOnSecondLine);
        assert.equal( result.index, geomModel.lines[1].index, 'reading next line' );

        fixFirstOnSecondLine.word = geomModel.lines[1].words[ 0 ];

        // test 4
        fixIndex = 19;
        var fixSecondOnSecondLine = fixations[ fixIndex ];
        result = this.run( geomModel, { toReading: false, toNonReading: true }, null, fixSecondOnSecondLine);
        assert.equal( result.index, geomModel.lines[1].index, 'reading ends' );

        // test 5
        fixIndex = 23;
        var fixSecondReadingStart = fixations[ fixIndex ];
        result = this.run( geomModel, { toReading: true,  toNonReading: false }, null, fixSecondReadingStart)
        assert.equal( result.index, geomModel.lines[1].index, 'reading starts agains' );
    });

    QUnit.module( 'Campbell module', {
        beforeEach: function() {
            this.logger = window.GazeTargets.Logger;
            this.campbell = window.GazeTargets.Models.Reading.Campbell;
            this.campbell.init({
                forgettingFactor: 0.2,
                readingThreshold: 4,        // number of fixations
                nonreadingThreshold: 2,     // number of fixations
                slope: 0.15,
                progressiveLeft: -1,        // em
                progressiveRight: 9,        // em
                readingZoneMarginY: 1,      // em
                neutralZoneMarginY: 2       // em
            }, {
                fixedText: true
            });
            this.run = function (layout, fixations, converter, title, callback ) {
                
                this.campbell.reset();
                console.log('################### Campbell ' + (title ? title + ' ' : '') + '##################');

                for (var i = 0; i < fixations.length; i++) {
                    
                    var fixation = fixations[i];

                    if (fixation.x < -30) {
                        continue;
                    }
                    console.log('---');
                    
                    if (converter) {
                        fixation = converter(fixation);
                    }

                    for (j = 1; j <= 8; ++j) {
                        fixation.duration = 33 * j;
                        this.campbell.feed(layout, fixation);
                    }

                    var mappedWord = this.campbell.currentWord();

                    if (callback) {
                        callback( mappedWord );
                    }
                }
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'Campbell', function( assert ) {
        
        // test 1
        var mapped = 0;
        var notMapped = 0;
        this.run( layout, simulated, null, 'simulated', function (word) {
            if (word) {
                mapped++;
            } else {
                notMapped++;
            }
        });
        assert.ok( mapped === 21 && notMapped === 4, 'simulated data' );
        
        // test 2
        mapped = 0;
        notMapped = 0;
        this.run( layout, simulated, function (fix) { return { x: fix.x, y: fix.y }; }, 'mouse', function (word) {
            if (word) {
                mapped++;
            } else {
                notMapped++;
            }
        });
        assert.ok( mapped === 21 && notMapped === 4, 'mouse-collected data' );

        var words = layout2;

        // test 3: Progressive reading
        var lines = [];
        var noLine = 0;
        for (var i = 0; i < 11; i++) { lines.push(0); }
        this.run( words, fix_progressive, null, 'progressive', function (word) {
            var line = word ? word.line : null;
            if (line) {
                lines[line.index]++;
            } else {
                noLine++;
            }
        });
        lines.forEach( function(item, index) { console.log(index, item); } );
        console.log('none', noLine);
        assert.ok( lines[0] === 6 && lines[1] === 9 && lines[2] === 9 && lines[3] === 9 && noLine === 4, 'real: progressive' );

        // test 4: Regressive reading
        lines = [];
        noLine = 0;
        for (var i = 0; i < 11; i++) { lines.push(0); }
        this.run( words, fix_regressive, null, 'regressive', function (word) {
            var line = word ? word.line : null;
            if (line) {
                lines[line.index]++;
            } else {
                noLine++;
            }
        });
        lines.forEach( function(item, index) { console.log(index, item); } );
        console.log('none', noLine);
        assert.ok( lines[0] === 22 && noLine === 6, 'real: regressive' );
        
        // test 5: line up
        lines = [];
        noLine = 0;
        for (var i = 0; i < 11; i++) { lines.push(0); }
        this.run( words, fix_lineup, null, 'lineup', function (word) {
            var line = word ? word.line : null;
            if (line) {
                lines[line.index]++;
            } else {
                noLine++;
            }
        });
        lines.forEach( function(item, index) { console.log(index, item); } );
        console.log('none', noLine);
        assert.ok( lines[0] === 13 && lines[1] === 5 && noLine === 4, 'real: lineup' );
        
        // test 5: line down
        this.logger.level( this.logger.Level.debug );
        lines = [];
        noLine = 0;
        for (var i = 0; i < 11; i++) { lines.push(0); }
        this.run( words, fix_linedown, null, 'linedown', function (word) {
            var line = word ? word.line : null;
            if (line) {
                lines[line.index]++;
            } else {
                noLine++;
            }
        });
        lines.forEach( function(item, index) { console.log(index, item); } );
        console.log('none', noLine);
        assert.ok( lines[0] === 1 && lines[6] === 3 && noLine === 9, 'real: linedown' );
        this.logger.level( this.logger.Level.silent );
    });
}