import { Block } from './pieces.js';

// WebSocket connection to the server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let myEmoji = '❓';
let pieces = [];
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
            break;
        case 'addPiece':
            pieces.push(msg.piece);
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

window.addEventListener('keydown', (e) => {
    if (e.key === 'v') {
        sideView = !sideView;
    }
});

function drawPieces() {
    ctx.fillStyle = sideView ? '#4aa' : '#333';
    pieces.forEach(p => {
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPieces();

    // Display current player's emoji
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(myEmoji, 10, 30);

    requestAnimationFrame(render);
}

render();
