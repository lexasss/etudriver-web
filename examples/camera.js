$(function (){

    // Vars
    
    var canvas = $('#heatmap');
    var controls = $('#controls');
    var screenshot = $('#screenshot');
    var screenshotImage = $('#screenshot-img');
    var liveHeatmap = true;

    // Video
    
    navigator.getUserMedia  = navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia;

    var video = document.querySelector('video');

    var vgaConstraints = {
      video: true
    };

    var onError = function (error) {
        $('<div class="error"></div>').text('Cannot use a webcam: ' + (error.name ? error.name : error)).appendTo('body');
    };
    
    if (navigator.userAgent.indexOf('WebKit') > 0) {
        onError('Google Chrome blocks the camera if a page is loaded from the local machine (protocol file://)');
        return;
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(vgaConstraints, function(stream) {
            if (navigator.mozGetUserMedia) {
                video.mozSrcObject = stream;
            } else {
                var vendorURL = window.URL || window.webkitURL;
                video.src = vendorURL.createObjectURL(stream);
            }
      }, onError);
    } else {
      onError('User Media is not supported');
    }
    
    // Heatmap
    
    try {
        var heatmap = createWebGLHeatmap({canvas: canvas[0]});
    }
    catch (error) {
        onError(error);
        return;
    }

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
    var decay = setupSlider('#heatmap-decay', function (value) {decay = value;});

    if (liveHeatmap) {
        var raf = (
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.oRequestAnimationFrame
        );
        var update = function(){
            heatmap.update(); // adds the buffered points
            heatmap.multiply(1 - decay/(100*100));
            heatmap.display(); // draws the heatmap to the canvas
            //heatmap.blur();
            //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it

            raf(update);
        };
        raf(update);
        
        canvas.removeClass('invisible');
        video.classList.remove('invisible');
    }
    
    heatmap.adjustSize();
    
    // Tracking
    
    $.etudriver.init({
        panel: {
            show: true
        },
        pointer: {
            show: true
        }
    }, {
        state: function (state) {
            if (state.isStopped) {
                if (!liveHeatmap)  {
                    screenshot[0].width = video.videoWidth;
                    screenshot[0].height = video.videoHeight;
                    screenshot.css({left: (window.innerWidth - video.videoWidth) / 2 + 'px',
                                    top: (window.innerHeight - video.videoHeight) / 2 + 'px'});
                    screenshot.removeClass('invisible');
                    var ctx = screenshot[0].getContext('2d');
                    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    screenshot.addClass('invisible');
                    
                    var ratioVideo = video.videoWidth / video.videoHeight;
                    var ratioClient = window.innerWidth / window.innerHeight;
                    var imgWidth = ratioClient > ratioVideo ? window.innerHeight * ratioVideo : window.innerWidth;
                    var imgHeight = ratioClient > ratioVideo ? window.innerHeight : window.innerWidth / ratioVideo;
                    screenshotImage.css({left: (window.innerWidth - imgWidth) / 2 + 'px',
                                         top: (window.innerHeight - imgHeight) / 2 + 'px',
                                         width: imgWidth,
                                         height: imgHeight
                                       });
                    screenshotImage.removeClass('invisible');
                    screenshotImage[0].src = screenshot[0].toDataURL('image/png');
                    
                    video.classList.add('invisible');
                    canvas.removeClass('invisible');
                    controls.removeClass('invisible');
                    heatmap.adjustSize();
                    heatmap.update();
                    heatmap.display();
                }
            } else if (state.isTracking) {
                heatmap.clear();
                if (!liveHeatmap)  {
                    canvas.addClass('invisible');
                    controls.addClass('invisible');
                    screenshotImage.addClass('invisible');
                    video.classList.remove('invisible');
                }
            }
        },
        sample: function (ts, x, y, pupil, ec) {
            heatmap.addPoint(x, y, size, intensity/1000);
        }
    });
});
