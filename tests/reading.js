if (window.QUnit) {
    var req = document.getElementById('req');
    req.style.display = 'none';

    function Word(_rect) {
        this.rect = _rect;
    }

    Word.prototype.getBoundingClientRect = function () {
        return this.rect;
    }

    QUnit.module( 'Reading', {
        beforeEach: function() {
            this.reading = window.GazeTargets.Models.Reading;
            this.reading.init({
                maxSaccadeLength: 120,		// pixels
                maxSaccadeAngleRatio: 1
            });
            this.run = function (layout, fixations) {
                
                this.reading.setTargets(layout);
                
                var i, fixation;

                this.reading.reset();
                console.log('---- testing --------');
                for (i = 0; i < fixations.length; i++) {
                    fixation = fixations[i];
                    this.reading.feed(fixation.x, fixation.y);
                }

                return true;
            };
        },
        afterEach: function() {
        }
    });

    QUnit.test( 'reset, feed', function( assert ) {
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

        var fixations = [
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

        assert.ok( this.run(layout, fixations), 'done' );
    });
}