import { Block, Ramp, Ball, Fan, sideView, toggleView, pieceAlpha } from './ui.js';
import { updateBall } from './physics.js';

// WebSocket connection to the server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let myEmoji = '❓';
let pieces = [];
let target = null;
let ball = null;

socket.addEventListener('open', () => {
    console.log('Connected to server');
});

socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'welcome':
            myEmoji = msg.emoji;
            pieces = (msg.pieces || []).filter(p => p.type !== 'ball');
            ball = (msg.pieces || []).find(p => p.type === 'ball') || null;
            target = msg.target;
            break;
        case 'addPiece':
            pieces.push(msg.piece);
            break;
        case 'ballUpdate':
            if (ball && msg.ball.id === ball.id) {
                Object.assign(ball, msg.ball);
            }
            break;
        case 'newPuzzle':
            pieces = (msg.pieces || []).filter(p => p.type !== 'ball');
            ball = (msg.pieces || []).find(p => p.type === 'ball') || null;
            target = msg.target;
            break;
        case 'puzzleComplete':
            console.log(`Puzzle solved by ${msg.emoji}`);
            break;
        case 'playerJoined':
            console.log(`${msg.emoji} joined`);
            break;
        case 'playerLeft':
            console.log(`${msg.emoji} left`);
            break;
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const piece = new Block(Date.now(), x, y);
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    const piece = new Ramp(Date.now(), x, y, direction);
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
});

canvas.addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const piece = new Fan(Date.now(), x, y, 1);
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'v') {
        toggleView();
    }
});

function drawBlock(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = sideView ? '#4aa' : '#333';
    if (sideView) {
        ctx.fillRect(p.x - 10, p.y - 20, 20, 20);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(p.x - 10, p.y, 20, 5);
    } else {
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    }
    ctx.restore();
}

function drawRamp(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = sideView ? '#aa4' : '#555';
    ctx.beginPath();
    if (sideView) {
        if (p.direction === 'right') {
            ctx.moveTo(p.x - 10, p.y);
            ctx.lineTo(p.x + 10, p.y);
            ctx.lineTo(p.x + 10, p.y - 20);
        } else {
            ctx.moveTo(p.x + 10, p.y);
            ctx.lineTo(p.x - 10, p.y);
            ctx.lineTo(p.x - 10, p.y - 20);
        }
    } else {
        if (p.direction === 'right') {
            ctx.moveTo(p.x - 10, p.y + 10);
            ctx.lineTo(p.x + 10, p.y + 10);
            ctx.lineTo(p.x - 10, p.y - 10);
        } else {
            ctx.moveTo(p.x + 10, p.y + 10);
            ctx.lineTo(p.x - 10, p.y + 10);
            ctx.lineTo(p.x + 10, p.y - 10);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawFan(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = '#88c';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - 15);
    ctx.strokeStyle = '#88c';
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}

function drawTarget() {
    if (!target) return;
    ctx.fillStyle = '#e33';
    ctx.beginPath();
    ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawPieces() {
    pieces.forEach(p => {
        if (p.type === 'block') {
            drawBlock(p);
        } else if (p.type === 'ramp') {
            drawRamp(p);
        } else if (p.type === 'fan') {
            drawFan(p);
        }
    });
}

function drawBallPiece() {
    if (!ball) return;
    ctx.save();
    ctx.globalAlpha = pieceAlpha(ball);
    ctx.fillStyle = '#f90';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTarget();
    drawPieces();
    if (ball) {
        updateBall(ball, pieces, 1);
        socket.send(JSON.stringify({ type: 'ballUpdate', ball }));
        drawBallPiece();
        if (target) {
            const dx = ball.x - target.x;
            const dy = ball.y - target.y;
            if (Math.sqrt(dx * dx + dy * dy) < ball.radius + 8) {
                socket.send(JSON.stringify({ type: 'ballUpdate', ball }));
            }
        }
    }

    // Display current player's emoji
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(myEmoji, 10, 30);

    requestAnimationFrame(render);
}

render();
