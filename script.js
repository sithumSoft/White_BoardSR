const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const downloadBtn = document.getElementById('downloadBtn');
const brushBtn = document.getElementById('brushBtn');
const bucketBtn = document.getElementById('bucketBtn');

let drawing = false;
let lastX = 0;
let lastY = 0;
let isErasing = false;
let drawingHistory = [];
let currentTool = 'brush';

function startDrawing(e) {
  drawing = true;
  [lastX, lastY] = getPointerPosition(e);
}

function stopDrawing() {
  drawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!drawing) return;
  if (currentTool === 'brush') {
    const [x, y] = getPointerPosition(e);
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  } else if (currentTool === 'eraser') {
    const [x, y] = getPointerPosition(e);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  }
}

function getPointerPosition(e) {
  const rect = canvas.getBoundingClientRect();
  let x, y;
  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  return [x, y];
}

function saveState() {
  drawingHistory.push(canvas.toDataURL());
  if (drawingHistory.length > 50) drawingHistory.shift(); // Limit history
}

function restoreState() {
  if (drawingHistory.length === 0) return;
  const img = new window.Image();
  img.src = drawingHistory.pop();
  img.onload = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function setEraserMode(on) {
  isErasing = on;
  if (isErasing) {
    canvas.style.cursor = 'cell';
  } else {
    canvas.style.cursor = 'crosshair';
  }
}

// Tool switching
brushBtn.addEventListener('click', () => {
  currentTool = 'brush';
  setEraserMode(false);
  brushBtn.classList.add('active-tool');
  eraserBtn.classList.remove('active-tool');
  bucketBtn.classList.remove('active-tool');
});

bucketBtn.addEventListener('click', () => {
  currentTool = 'bucket';
  setEraserMode(false);
  bucketBtn.classList.add('active-tool');
  brushBtn.classList.remove('active-tool');
  eraserBtn.classList.remove('active-tool');
});

// Update eraser button to set tool
eraserBtn.addEventListener('click', () => {
  currentTool = 'eraser';
  setEraserMode(true);
  eraserBtn.classList.add('active-tool');
  brushBtn.classList.remove('active-tool');
  bucketBtn.classList.remove('active-tool');
});

// Paint bucket tool (flood fill)
function hexToRgba(hex) {
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [num >> 16 & 255, num >> 8 & 255, num & 255, 255];
}

function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const stack = [[x, y]];
  const startIdx = (y * width + x) * 4;
  const startColor = data.slice(startIdx, startIdx + 4);
  if (colorMatch(startColor, fillColor)) return;
  while (stack.length) {
    const [cx, cy] = stack.pop();
    const idx = (cy * width + cx) * 4;
    const color = data.slice(idx, idx + 4);
    if (!colorMatch(color, startColor)) continue;
    data.set(fillColor, idx);
    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx < width - 1) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy < height - 1) stack.push([cx, cy + 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

canvas.addEventListener('click', function(e) {
  if (currentTool === 'bucket') {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    saveState();
    floodFill(x, y, hexToRgba(colorPicker.value));
  }
});

// Mouse events
canvas.addEventListener('mousedown', (e) => { saveState(); startDrawing(e); });
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', draw);

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => { saveState(); startDrawing(e); });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);
canvas.addEventListener('touchmove', function(e) {
  draw(e);
  e.preventDefault();
}, { passive: false });

undoBtn.addEventListener('click', restoreState);

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'whiteboard.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

colorPicker.addEventListener('change', () => setEraserMode(false));
sizePicker.addEventListener('change', () => setEraserMode(false));

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Highlight brush as default
window.addEventListener('DOMContentLoaded', () => {
  brushBtn.classList.add('active-tool');
});
