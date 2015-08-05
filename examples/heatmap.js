$(function (){

    // Interface
    var images = [$('#image1'), $('#image2')];
    var canvas = $('#heatmap');
    var controls = $('#controls');
    var imgIdx = -1;
    var debug = false;

    var loadNewImage = function (elem) {
        var imgIndex = Math.floor(Math.random() * 90) + 10;
        elem.css({backgroundImage: 'url(http://wallpaperstock.net/wallpapers/thumbs1/492' + imgIndex + 'wide.jpg)'});
    };
    
    try {
        var heatmap = createWebGLHeatmap({canvas: canvas[0]});
    }
    catch(error) {
        $('<div class="error"></div>').text(error).appendTo('body');
        return;
    }

    // Heatmap
    
    var setupSlider = function(name, onChange){
        var input = $(name).find('input');
        var span = $(name).find('span');
        input.change(function(){
            var value = parseInt(input.val(), 10);
            span.text(value);
            onChange(value);
        });
        var startValue = parseInt(input.val(), 10);
        span.text(startValue);
        return startValue;
    }
        
    var count = 1;
    var size = setupSlider('#heatmap-size', function (value) {size = value;});
    var intensity = setupSlider('#heatmap-intensity', function (value) {intensity = value;});
    var spread = 0;
    var decay = 0;

    if (debug) {
        var raf = (
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.oRequestAnimationFrame
        );
        var update = function(){
            heatmap.update(); // adds the buffered points
            heatmap.display(); // draws the heatmap to the canvas
            raf(update);
        };
        raf(update);
        
        canvas.removeClass('hidden');
    }
    
    heatmap.adjustSize();
    loadNewImage(images[0]);

    // Tracking
    GazeTargets.init({
        etudPanel: {
            show: true
        },
        pointer: {
            show: true
        }
    }, {
        state: function (state) {
            if (state.isStopped) {
                if (!debug)  {
                    canvas.removeClass('hidden');
                    controls.removeClass('hidden');
                    heatmap.adjustSize();
                    heatmap.update();
                    heatmap.display();
                }
                loadNewImage(images[1 - imgIdx])
            } else if (state.isTracking) {
                heatmap.clear();
                if (!debug)  {
                    canvas.addClass('hidden');
                    controls.addClass('hidden');
                }
                if (imgIdx < 0) {
                    imgIdx = 0;
                } else {
                    images[imgIdx].addClass('invisible');
                    imgIdx = 1 - imgIdx;
                }
                images[imgIdx].removeClass('invisible');
            }
        },
        
        sample: function (ts, x, y, pupil, ec) {
            heatmap.addPoint(x, y, size, intensity/1000);
        }
    });
});
