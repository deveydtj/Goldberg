import { Block, Ramp } from './pieces.js';

// WebSocket connection to the server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let myEmoji = '❓';
let pieces = [];
let target = null;
let sideView = false;

socket.addEventListener('open', () => {
    console.log('Connected to server');
});

socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'welcome':
            myEmoji = msg.emoji;
            pieces = msg.pieces || [];
            target = msg.target;
            break;
        case 'addPiece':
            pieces.push(msg.piece);
            break;
        case 'newPuzzle':
            pieces = msg.pieces || [];
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

window.addEventListener('keydown', (e) => {
    if (e.key === 'v') {
        sideView = !sideView;
    }
});

function drawBlock(p) {
    ctx.fillStyle = sideView ? '#4aa' : '#333';
    if (sideView) {
        ctx.fillRect(p.x - 10, p.y - 20, 20, 20);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(p.x - 10, p.y, 20, 5);
    } else {
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    }
}

function drawRamp(p) {
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
        }
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTarget();
    drawPieces();

    // Display current player's emoji
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(myEmoji, 10, 30);

    requestAnimationFrame(render);
}

render();
