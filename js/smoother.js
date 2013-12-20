    function Smoother() {
        this.x = -1.0;
        this.y = -1.0;
        this.t = 0;
        this.interval = 0;

        this.buffer = [];

        this.init = function () {
            this.x = -1.0;
            this.y = -1.0;
            this.t = 0;
            this.buffer = [];
        };
        
        this.smooth = function (ts, x, y) {
            var params = settings.pointer.smoothing;
            if (this.x < 0 && this.y < 0 && this.t === 0) {
                this.x = x;
                this.y = y;
                this.t = params.low;
            }

            var i;
            var avgXB = 0,
                avgYB = 0,
                avgXA = 0,
                avgYA = 0,
                ptsBeforeCount = 0,
                ptsAfterCount = 0,
                validFilter = false;

            this.buffer.push({ts: ts, x: x, y: y});

            for (i = 0; i < this.buffer.length; i += 1) {
                var smp = this.buffer[i];
                var dt = ts - smp.ts;
                if (dt > (2 * params.timeWindow)) {
                    this.buffer.shift();
                    validFilter = true;
                }
                else if (dt > params.timeWindow) {
                    avgXB += smp.x;
                    avgYB += smp.y;
                    ptsBeforeCount++;
                }
                else {
                    avgXA += smp.x;
                    avgYA += smp.y;
                    ptsAfterCount++;
                }
            }

            if (ptsBeforeCount && ptsAfterCount) {
                avgXB = avgXB / ptsBeforeCount;
                avgYB = avgYB / ptsBeforeCount;
                avgXA = avgXA / ptsAfterCount;
                avgYA = avgYA / ptsAfterCount;

                var dx = avgXB - avgXA;
                var dy = avgYB - avgYA;
                var dist = Math.sqrt(dx*dx + dy*dy);

                this.t = dist > params.threshold ? params.high : params.low;
            }

            if (validFilter && !this.interval && this.buffer.length > 1) {
                var avgDT = 0;
                for (i = 1; i < this.buffer.length; i += 1) {
                    avgDT += this.buffer[i].ts - this.buffer[i - 1].ts;
                }

                this.interval = avgDT / (this.buffer.length - 1);
            }

            if (this.interval) {
                var alfa = this.t / this.interval;
                this.x = (x + alfa * this.x) / (1.0 + alfa);
                this.y = (y + alfa * this.y) / (1.0 + alfa);
            }

            return {x: this.x, y: this.y};
        };
    }
