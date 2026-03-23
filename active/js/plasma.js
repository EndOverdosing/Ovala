const CHARS = ' .:-=+*#%@';
const FONT_SIZE = 50;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
const CW = Math.ceil(ctx.measureText('M').width);
const CH = FONT_SIZE + 2;

let cols, rows, t = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / CW) + 1;
    rows = Math.ceil(canvas.height / CH) + 1;
    ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
    ctx.textBaseline = 'top';
}

window.addEventListener('resize', resize);
resize();

function plasma(cx, cy, t) {
    const x = cx + Math.sin(cy * 3 + t * 0.7) * 0.07;
    const y = cy + Math.cos(cx * 3 + t * 0.5) * 0.07;
    let v = Math.sin(x * 10 + t)
        + Math.sin(y * 10 + t)
        + Math.sin((x + y) * 7 + t)
        + Math.sin(Math.sqrt(x * x + y * y) * 12 - t * 1.2)
        + Math.sin(x * 6 - t * 0.8)
        + Math.sin(y * 8 + t * 0.9);
    return (v / 6 + 1) / 2;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.03;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const v = plasma(col / cols, row / rows, t);
            const brightness = Math.round(v * 255);
            const charIdx = Math.floor(v * (CHARS.length - 0.001));
            const ch = CHARS[charIdx];

            ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
            ctx.fillText(ch, col * CW, row * CH);
        }
    }

    requestAnimationFrame(render);
}

render();