// Minimal sending indicator. A heartbeat means a packet was emitted, not that
// Stream Deck acknowledged it. Silent audio still generates these packets.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
var lastPacket = null;
var pulseStart = 0;
var refreshTask = new Task(refresh, this);
refreshTask.interval = 50;

function refresh() { mgraphics.redraw(); }
function loadbang() {
    refreshTask.cancel();
    refreshTask.repeat();
    refresh();
}
function freebang() { refreshTask.cancel(); }
function bang() {
    var now = Date.now();
    if (lastPacket === null || now - lastPacket > 800) pulseStart = now;
    lastPacket = now;
}
function sending(now) { return lastPacket !== null && now - lastPacket <= 800; }
function paint() {
    var now = Date.now();
    var active = sending(now);
    var glow = active ? 0.28 + 0.72 * (0.5 - 0.5 * Math.cos((now - pulseStart) * Math.PI * 2 / 1400)) : 1;
    mgraphics.set_source_rgba(0, 0, 0, 1);
    mgraphics.rectangle(0, 0, 150, 169);
    mgraphics.fill();
    mgraphics.select_font_face('Arial', 'normal', 'normal');
    mgraphics.set_font_size(23);
    mgraphics.set_source_rgba(0.96, 0.96, 0.96, 1);
    mgraphics.move_to(18, 66);
    mgraphics.show_text(active ? 'Sending' : 'Idle');
    mgraphics.set_font_size(11);
    mgraphics.set_source_rgba(0.58, 0.58, 0.58, 1);
    mgraphics.move_to(18, 88);
    mgraphics.show_text('to Stream Deck');
    if (active) mgraphics.set_source_rgba(242 / 255, 86 / 255, 35 / 255, glow);
    else mgraphics.set_source_rgba(0.3, 0.3, 0.3, 1);
    mgraphics.ellipse(128, 55, 6, 6);
    mgraphics.fill();
    if (active) mgraphics.set_source_rgba(242 / 255, 86 / 255, 35 / 255, 0.8);
    else mgraphics.set_source_rgba(0.3, 0.3, 0.3, 1);
    mgraphics.rectangle(18, 114, 19, 1);
    mgraphics.fill();
}
loadbang();
