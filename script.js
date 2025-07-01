const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const downloadBtn = document.getElementById('downloadBtn');

let drawing = false;
let lastX = 0;
let lastY = 0;
let isErasing = false;
let drawingHistory = [];

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
  const [x, y] = getPointerPosition(e);
  ctx.strokeStyle = isErasing ? '#fff' : colorPicker.value;
  ctx.lineWidth = sizePicker.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  [lastX, lastY] = [x, y];
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

eraserBtn.addEventListener('click', () => {
  setEraserMode(!isErasing);
  eraserBtn.textContent = isErasing ? 'Eraser On' : 'Eraser';
});

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
