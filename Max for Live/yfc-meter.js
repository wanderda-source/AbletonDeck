/* AbletonDeck stereo meter. Max's built-in legacy js engine, no npm required.
 * K weighting uses the published BS.1770 filter design (see THIRD_PARTY.md).
 * I is a prototype: 400 ms audio windows sampled by a 100 ms control scheduler.
 */
autowatch = 1;
inlets = 1;
outlets = 2;
var histogramCount = [], histogramSum = [], totalCount = 0, totalEnergy = 0;
var peakHold = -120, clipped = 0, ticks = 0, previousTime = 0;
var frequencies = [63, 125, 250, 500, 1000, 2000, 4000, 8000];
var scopeBuffer = null, sampleRate = 48000;
var pitchSequence = 0;
var fftSequence = 0, fftPreviousTime = 0;
// Exactly representable in OSC float32; a new device/recompile gets a new session.
var fftSession = 1 + Math.floor(Math.random() * 16777214);
var statusPreviousTime = 0, scopeCalls = 0;

function loudness(energy) {
    return energy > 1e-12 ? -0.691 + 10 * Math.log(energy) / Math.LN10 : -120;
}
function amplitudeDb(value) {
    return value > 1e-6 ? 20 * Math.log(value) / Math.LN10 : -120;
}
function reset() {
    histogramCount = []; histogramSum = [];
    totalCount = 0; totalEnergy = 0; peakHold = -120; clipped = 0;
    ticks = 0; previousTime = 0;
}
function setObject(name, value) {
    var obj = this.patcher.getnamed(name);
    if (!obj) { post('AbletonDeck missing object: ' + name + '\n'); return; }
    if (value instanceof Array) obj.message.apply(obj, ['list'].concat(value));
    else obj.message(value);
}
function samplerate(rate) {
    if (rate < 22050 || rate > 192000) { post('AbletonDeck unsupported sample rate\n'); return; }
    var K = Math.tan(Math.PI * 1681.974450955533 / rate);
    var Q = 0.7071752369554196, Vh = Math.pow(10, 3.999843853973347 / 20);
    var Vb = Math.pow(Vh, 0.4996667741545416), norm = 1 + K / Q + K * K;
    var shelf = [(Vh + Vb * K / Q + K * K) / norm, 2 * (K*K - Vh) / norm,
        (Vh - Vb*K/Q + K*K) / norm, 2*(K*K - 1)/norm, (1 - K/Q + K*K)/norm];
    K = Math.tan(Math.PI * 38.13547087602444 / rate); Q = 0.5003270373238773;
    norm = 1 + K/Q + K*K;
    var highpass = [1, -2, 1, 2*(K*K - 1)/norm, (1 - K/Q + K*K)/norm];
    for (var c = 0; c < 2; c++) {
        setObject('shelf' + c, shelf); setObject('hp' + c, highpass);
        this.patcher.getnamed('shelf' + c).message('clear');
        this.patcher.getnamed('hp' + c).message('clear');
    }
    setObject('avg_m', Math.round(rate * 0.4)); setObject('avg_s', Math.round(rate * 3));
    for (var j = 0; j < frequencies.length; j++) {
        var omega = 2 * Math.PI * frequencies[j] / rate;
        var alpha = Math.sin(omega) / (2 * 1.2), a = 1 + alpha;
        var coeffs = [alpha/a, 0, -alpha/a, -2*Math.cos(omega)/a, (1-alpha)/a];
        for (c = 0; c < 2; c++) setObject('band' + j + '_' + c, coeffs);
        setObject('avg_band' + j, Math.round(rate * 0.08));
    }
    if (this.patcher.getnamed('panorama_trigger')) {
        for (j = 0; j < 60; j++) {
            var frequency = 25 * Math.pow(800, (j + 0.5) / 60);
            omega = 2 * Math.PI * frequency / rate;
            alpha = Math.sin(omega) / (2 * 8.97); a = 1 + alpha;
            coeffs = frequency < rate * 0.49 ? [alpha/a, 0, -alpha/a, -2*Math.cos(omega)/a, (1-alpha)/a] : [0,0,0,0,0];
            for (c = 0; c < 2; c++) setObject('pan' + j + '_' + c, coeffs);
            setObject('pan_avg' + j, Math.round(rate * 0.08));
        }
    }
    sampleRate = rate;
    setObject('avg_mid', Math.round(rate * 0.1)); setObject('avg_side', Math.round(rate * 0.1));
    var capture = this.patcher.getnamed('scope_buffer');
    if (capture) { capture.message('sr', rate); capture.message('setsize', 400, 2); }
    if (capture && typeof Buffer !== 'undefined') scopeBuffer = new Buffer('yfc_scope');
    reset();
}
function loadbang() {
    samplerate(48000);
    var dsp = this.patcher.getnamed('dsp');
    if (dsp) dsp.message('bang');
}
function integrated() {
    if (!totalCount) return -120;
    var threshold = Math.max(-70, loudness(totalEnergy/totalCount) - 10);
    var energy = 0, count = 0;
    // 0.1 LU bins; sums retain their actual energies.
    for (var j = 0; j < 1000; j++) {
        if (-70 + (j + 0.5) * 0.1 >= threshold && histogramCount[j]) {
            energy += histogramSum[j]; count += histogramCount[j];
        }
    }
    return count ? loudness(energy/count) : -120;
}
function spectrum() {
    var values = arrayfromargs(arguments);
    if (values.length !== 60) return;
    var packet = ['/yfc/spectrum'];
    for (var j = 0; j < 60; j++) {
        if (!isFinite(values[j]) || values[j] < 0) return;
        packet.push(values[j] > 1e-12 ? 10 * Math.log(values[j]) / Math.LN10 : -120);
    }
    outlet(0, packet);
}
function frame() {
    var args = arrayfromargs(arguments);
    if (args.length !== 12 && args.length !== 14) return;
    for (var k = 0; k < args.length; k++) if (!isFinite(args[k]) || args[k] < 0) return;
    var now = Date.now();
    if (previousTime && now - previousTime > 350) reset();
    previousTime = now;
    ticks++;
    var m = ticks >= 4 ? loudness(args[0]) : -120;
    var s = ticks >= 30 ? loudness(args[1]) : -120;
    if (m >= -70) {
        var bin = Math.max(0, Math.min(999, Math.floor((m + 70) * 10)));
        histogramCount[bin] = (histogramCount[bin] || 0) + 1;
        histogramSum[bin] = (histogramSum[bin] || 0) + args[0];
        totalCount++; totalEnergy += args[0];
    }
    var peak = amplitudeDb(Math.max(args[2], args[3]));
    peakHold = Math.max(peakHold, peak);
    if (peak >= 0) clipped = 1;
    var result = ['/yfc/meter', m, s, integrated(), peak, peakHold, clipped];
    for (k = 4; k < 12; k++) result.push(loudness(args[k]) + 0.691);
    if (args.length === 14) { result.push(args[12]); result.push(args[13]); }
    if(Date.now()-statusPreviousTime>=2000){statusPreviousTime=Date.now();meterstatus();}
    outlet(0, result);
    outlet(1, ['set', 'M: ' + (m > -100 ? m.toFixed(1) : '--') +
        '    S: ' + (s > -100 ? s.toFixed(1) : '--') + ' LUFS    Peak: ' + peak.toFixed(1) + ' dBFS']);
}

function scope(position) {
    scopeCalls++;
    if(!scopeBuffer||scopeBuffer.framecount()<128||scopeBuffer.channelcount()<2){
        var capture=this.patcher.getnamed('scope_buffer');
        if(capture){capture.message('setsize',400,2);scopeBuffer=new Buffer('yfc_scope');}
    }
    if (!scopeBuffer || !isFinite(position)) return;
    var size = scopeBuffer.framecount();
    if (size < 128 || scopeBuffer.channelcount() < 2) return;
    var count = Math.min(size, Math.round(sampleRate * 0.02));
    // Leave a small margin behind the writer for the asynchronous JS read.
    var end = (Math.floor(Math.max(0, Math.min(0.999999, position)) * size) - 128 + size) % size;
    var start = (end - count + size) % size;
    function read(channel) {
        var first = Math.min(count, size - start);
        var a = scopeBuffer.peek(channel, start, first);
        if (typeof a === 'number') a = [a];
        if (first < count) {
            var b = scopeBuffer.peek(channel, 0, count - first);
            if (typeof b === 'number') b = [b];
            a = a.concat(b);
        }
        return a;
    }
    var left = read(1), right = read(2);
    if (left.length !== count || right.length !== count) return;
    var packet = ['/yfc/scope', count * 1000 / sampleRate];
    for (var n = 0; n < 128; n++) {
        var index = Math.min(count - 1, Math.floor(n * count / 128));
        packet.push(left[index]); packet.push(right[index]);
    }
    // Min/max envelopes preserve brief transients between drawing points.
    for (n = 0; n < 64; n++) {
        var begin = Math.floor(n * count / 64), finish = Math.max(begin + 1, Math.floor((n + 1) * count / 64));
        var minL = Infinity, maxL = -Infinity, minR = Infinity, maxR = -Infinity;
        for (var j = begin; j < finish; j++) {
            if (!isFinite(left[j]) || !isFinite(right[j])) return;
            minL = Math.min(minL, left[j]); maxL = Math.max(maxL, left[j]);
            minR = Math.min(minR, right[j]); maxR = Math.max(maxR, right[j]);
        }
        packet.push(minL); packet.push(maxL); packet.push(minR); packet.push(maxR);
    }
    // Full trigger window on every scope tick. Node limits YIN separately to 10 Hz.
    pitchcapture(position);
    outlet(0, packet);
    if(Date.now()-fftPreviousTime>=100){fftPreviousTime=Date.now();fftcapture(position);}
}
// Raw L/R for FFT in Node: a full overlapping window, preserving sample spacing.
// No decimation, no mono cancellation, no DSP work on Max's scheduler thread.
function fftcapture(position){
    if(!scopeBuffer||!isFinite(position))return;
    var size=scopeBuffer.framecount(),count=8192;
    while(count<sampleRate*.34)count*=2;
    if(size<count+128||scopeBuffer.channelcount()<2)return;
    var end=(Math.floor(Math.max(0,Math.min(.999999,position))*size)-128+size)%size;
    var start=(end-count+size)%size;
    function read(channel){
        var first=Math.min(count,size-start),a=scopeBuffer.peek(channel,start,first);
        if(typeof a==='number')a=[a];
        if(first<count){var b=scopeBuffer.peek(channel,0,count-first);if(typeof b==='number')b=[b];a=a.concat(b);}
        return a;
    }
    var left=read(1),right=read(2);
    if(left.length!==count||right.length!==count)return;
    for(var j=0;j<count;j++)if(!isFinite(left[j])||!isFinite(right[j]))return;
    fftSequence=(fftSequence+1)%1000000;
    for(var begin=0;begin<count;begin+=300){
        var packet=['/yfc/fftchunk2',fftSession,fftSequence,sampleRate,begin*2,count];
        for(j=begin;j<Math.min(count,begin+300);j++){packet.push(left[j]);packet.push(right[j]);}
        outlet(0,packet);
    }
}

// Longer raw window for pitch detection. Select the stronger channel so
// opposite-polarity stereo never cancels. YIN runs in Stream Deck's Node process.
function meterstatus(){
    outlet(0,['/yfc/status',312,sampleRate,scopeBuffer?scopeBuffer.framecount():0,scopeBuffer?scopeBuffer.channelcount():0,scopeCalls]);
}
function pitchcapture(position) {
    if (!scopeBuffer || !isFinite(position)) return;
    var size = scopeBuffer.framecount(), count = Math.floor(sampleRate * 0.09);
    if (size < count + 128 || scopeBuffer.channelcount() < 2) return;
    var end = (Math.floor(Math.max(0, Math.min(0.999999, position)) * size) - 128 + size) % size;
    var start = (end - count + size) % size;
    function read(channel) {
        var first = Math.min(count, size - start), a = scopeBuffer.peek(channel, start, first);
        if (typeof a === 'number') a = [a];
        if (first < count) {
            var b = scopeBuffer.peek(channel, 0, count - first);
            if (typeof b === 'number') b = [b];
            a = a.concat(b);
        }
        return a;
    }
    var left = read(1), right = read(2), energyL = 0, energyR = 0;
    if (left.length !== count || right.length !== count) return;
    for (var j = 0; j < count; j++) {
        if (!isFinite(left[j]) || !isFinite(right[j])) return;
        energyL += left[j] * left[j]; energyR += right[j] * right[j];
    }
    var source = energyL >= energyR ? left : right;
    var step = Math.ceil(sampleRate / 12000);
    var samples = [];
    // Box low-pass before decimation; bounded to about 1080 samples per packet.
    for (j = 0; j + step <= count; j += step) {
        var sum = 0;
        for (var k = 0; k < step; k++) sum += source[j + k];
        samples.push(sum / step);
    }
    // Max udpsend defaults to 5096 bytes: keep every OSC message below 3100.
    pitchSequence = (pitchSequence + 1) % 1000000;
    for (var offset = 0; offset < samples.length; offset += 600) {
        outlet(0, ['/yfc/pitchchunk', pitchSequence, sampleRate / step, offset, samples.length].concat(samples.slice(offset, offset + 600)));
    }
}
