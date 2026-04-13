
const canvas = document.getElementById('ballCanvas');
const ctx = canvas.getContext('2d');

// Parametrai
const GROUND_Y = canvas.height - 50;
const BALL_RADIUS = 22;
let GRAVITY = 0.8;
let BOUNCE_DAMPING = 0.78;   // Realistiškas atšokimas (vis silpniau)
let ENERGY_LOSS = 0.995;      // Oro pasipriešinimas

// Būsena
let ball = {
  x: canvas.width / 2,
  y: GROUND_Y - BALL_RADIUS,
  vx: 0,
  vy: 0,
  isDragged: false
};

let animationId = null;
let dragOffsetX = 0, dragOffsetY = 0;

// ---- Pelės įvykiai ----
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX, clientY;

  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  let canvasX = (clientX - rect.left) * scaleX;
  let canvasY = (clientY - rect.top) * scaleY;
  canvasX = Math.min(Math.max(canvasX, BALL_RADIUS), canvas.width - BALL_RADIUS);
  canvasY = Math.min(Math.max(canvasY, BALL_RADIUS), GROUND_Y - BALL_RADIUS);
  return { x: canvasX, y: canvasY };
}

function onMouseDown(e) {
  e.preventDefault();
  const mouse = getMousePos(e);
  const dx = mouse.x - ball.x;
  const dy = mouse.y - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist < BALL_RADIUS + 10) {
    ball.isDragged = true;
    dragOffsetX = ball.x - mouse.x;
    dragOffsetY = ball.y - mouse.y;
    canvas.style.cursor = 'grabbing';
  }
}

function onMouseMove(e) {
  if (!ball.isDragged) return;
  e.preventDefault();
  const mouse = getMousePos(e);
  ball.x = mouse.x + dragOffsetX;
  ball.y = mouse.y + dragOffsetY;
  // Ribos
  ball.x = Math.min(Math.max(ball.x, BALL_RADIUS), canvas.width - BALL_RADIUS);
  ball.y = Math.min(Math.max(ball.y, BALL_RADIUS), GROUND_Y - BALL_RADIUS);
  ball.vx = 0;
  ball.vy = 0;
}

function onMouseUp(e) {
  if (!ball.isDragged) return;
  ball.isDragged = false;
  canvas.style.cursor = 'grab';
  // Šiek tiek pagreitėlio paleidimui (jei nori papildomo smagumo)
  // bet čia tiesiog paleidžiam su nuliniu greičiu (krenta žemyn)
}

// Reset funkcija
function resetBall() {
  ball.isDragged = false;
  ball.x = canvas.width / 2;
  ball.y = GROUND_Y - BALL_RADIUS;
  ball.vx = (Math.random() - 0.5) * 2;  // minimalus atsitiktinis šoninis
  ball.vy = 0;
  canvas.style.cursor = 'grab';
}

// ---- Fizikos atnaujinimas ----
function updatePhysics() {
  if (ball.isDragged) return;

  // Gravitacija
  ball.vy += GRAVITY;

  // Pritaikom greitį
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Šoninės sienos (atsimušimas)
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx = -ball.vx * BOUNCE_DAMPING;
  }
  if (ball.x + BALL_RADIUS > canvas.width) {
    ball.x = canvas.width - BALL_RADIUS;
    ball.vx = -ball.vx * BOUNCE_DAMPING;
  }

  // Grindų kolizija (žemė)
  if (ball.y + BALL_RADIUS >= GROUND_Y) {
    ball.y = GROUND_Y - BALL_RADIUS;
    ball.vy = -ball.vy * BOUNCE_DAMPING;

    // Jei šokinėja per silpnai – sustabdysime, kad nebūtų amžino micro judesio
    if (Math.abs(ball.vy) < 1.2 && ball.y + BALL_RADIUS >= GROUND_Y - 0.5) {
      ball.vy = 0;
      ball.y = GROUND_Y - BALL_RADIUS;
    }
  }

  // Viršutinė riba (lubos)
  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vy = -ball.vy * 0.5;
  }

  // Oro pasipriešinimas
  ball.vx *= ENERGY_LOSS;
  ball.vy *= ENERGY_LOSS;

  // Jei beveik sustojo – užfiksuojam
  if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05 && !ball.isDragged && ball.y + BALL_RADIUS >= GROUND_Y - 1) {
    ball.vx = 0;
    ball.vy = 0;
    ball.y = GROUND_Y - BALL_RADIUS;
  }
}

// ---- Piešimas ----
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Grindys (pilka juosta – atsakymas 2B)
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  // Grindų linija
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(0, GROUND_Y - 3, canvas.width, 4);

  // 2. Šešėlis (atsakymas 1A)
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // 3. Kamuolys (gradientas)
  const grad = ctx.createRadialGradient(ball.x - 6, ball.y - 6, 5, ball.x, ball.y, BALL_RADIUS);
  grad.addColorStop(0, '#ffdd77');
  grad.addColorStop(1, '#e67e22');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // 4. Paryškinimas (blizgesys)
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,200,0.55)';
  ctx.beginPath();
  ctx.arc(ball.x - 5, ball.y - 6, 6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Akcentas
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(ball.x - 8, ball.y - 9, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Animacijos ciklas ----
function animate() {
  updatePhysics();
  draw();
  animationId = requestAnimationFrame(animate);
}

// ---- Event Listeneriai ----
function initEvents() {
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onMouseDown);
  window.addEventListener('touchmove', onMouseMove);
  window.addEventListener('touchend', onMouseUp);
  document.getElementById('resetBtn').addEventListener('click', () => {
    resetBall();
  });
}

// ---- Paleidimas ----
function init() {
  initEvents();
  resetBall();
  animate();
}

init();
