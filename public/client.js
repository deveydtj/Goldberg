import { Block, Ramp, Ball, Fan, Spring, Wall, pieceAlpha, setupResponsiveCanvas } from './ui.js';
import { updateBall } from './physics.js';
import { playBeep, startBackgroundMusic } from './sound.js';

// WebSocket connection to the server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
setupResponsiveCanvas(canvas);
const ctx = canvas.getContext('2d');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const leaderboardEl = document.getElementById('leaderboard');
const resetLevelBtn = document.getElementById('resetLevelBtn');
const emojiInput = document.getElementById('emojiInput');
const emojiBtn = document.getElementById('emojiBtn');
const palette = document.getElementById('palette');
const rotateBtn = document.getElementById('rotateBtn');

const otherCursors = new Map();
let draggingPiece = null;
let dragOffset = { x: 0, y: 0 };

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        socket.send(JSON.stringify({ type: 'chat', text: chatInput.value.trim() }));
        chatInput.value = '';
    }
});
if (resetLevelBtn) {
    resetLevelBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({ type: 'resetLevel' }));
    });
}

if (emojiBtn && emojiInput) {
    emojiBtn.addEventListener('click', () => {
        if (emojiInput.value.trim()) {
            myEmoji = emojiInput.value.trim();
            socket.send(JSON.stringify({ type: 'setEmoji', emoji: myEmoji }));
            emojiInput.value = '';
        }
    });
}

if (palette) {
    palette.addEventListener('click', (e) => {
        const item = e.target.closest('.palette-item');
        if (!item) return;
        selectedType = item.dataset.type;
        if (item.dataset.direction) {
            selectedDirection = item.dataset.direction;
        }
    });
}

if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
        selectedDirection = selectedDirection === 'right' ? 'left' : 'right';
        const rampItem = document.getElementById('rampItem');
        if (rampItem) {
            rampItem.dataset.direction = selectedDirection;
            rampItem.textContent = selectedDirection === 'right' ? 'Ramp ▶' : 'Ramp ◀';
        }
    });
}

let myEmoji = '❓';
let pieces = [];
let target = null;
let ball = null;
let selectedType = 'block';
let selectedDirection = 'right';
const HANDLE_RADIUS = 6;
let hover = { x: 0, y: 0 };
let hoveredPiece = null;

function pieceAt(x, y) {
    return pieces.find(p => {
        if (p.type === 'ball') return false;
        const hw = (p.width || 20) / 2;
        const hh = (p.height || 20) / 2;
        return Math.abs(p.x - x) <= hw && Math.abs(p.y - y) <= hh;
    });
}

function coordsFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function rotateHandlePos(p) {
    return { x: p.x + 12, y: p.y - 12 };
}

function handleForPoint(x, y) {
    const p = pieceAt(x, y);
    if (!p || p.owner !== myEmoji || p.type !== 'ramp') return null;
    const pos = rotateHandlePos(p);
    const dx = x - pos.x;
    const dy = y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) <= HANDLE_RADIUS ? p : null;
}

socket.addEventListener('open', () => {
    console.log('Connected to server');
    startBackgroundMusic();
});

socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'welcome':
            myEmoji = msg.emoji;
            pieces = (msg.pieces || []).filter(p => p.type !== 'ball');
            ball = (msg.pieces || []).find(p => p.type === 'ball') || null;
            target = msg.target;
            if (msg.leaderboard) {
                leaderboardEl.innerHTML = Object.entries(msg.leaderboard)
                    .sort((a,b) => b[1] - a[1])
                    .map(([emo,count]) => `${emo} ${count}`)
                    .join('<br>');
            }
            break;
        case 'emojiConfirmed':
            myEmoji = msg.emoji;
            break;
        case 'emojiChanged':
            if (otherCursors.has(msg.oldEmoji)) {
                const pos = otherCursors.get(msg.oldEmoji);
                otherCursors.delete(msg.oldEmoji);
                otherCursors.set(msg.newEmoji, pos);
            }
            if (myEmoji === msg.oldEmoji) {
                myEmoji = msg.newEmoji;
            }
            break;
        case 'addPiece':
            pieces.push(msg.piece);
            playBeep();
            break;
        case 'movePiece': {
            const p = pieces.find(p => p.id === msg.id);
            if (p) { p.x = msg.x; p.y = msg.y; }
            break;
        }
        case 'rotatePiece': {
            const p = pieces.find(p => p.id === msg.id);
            if (p) { p.direction = msg.direction; }
            break;
        }
        case 'removePiece':
            pieces = pieces.filter(p => p.id !== msg.id);
            playBeep(330);
            break;
        case 'ballUpdate':
            if (ball && msg.ball.id === ball.id) {
                Object.assign(ball, msg.ball);
            }
            break;
        case 'newPuzzle':
            pieces = [];
            ball = null;
            target = null;
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
            otherCursors.delete(msg.emoji);
            break;
        case 'chat':
            if (chatLog) {
                const div = document.createElement('div');
                div.textContent = `${msg.emoji}: ${msg.text}`;
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
            break;
        case 'cursor':
            otherCursors.set(msg.emoji, { x: msg.x, y: msg.y });
            break;
        case 'leaderboard':
            if (leaderboardEl) {
                leaderboardEl.innerHTML = Object.entries(msg.leaderboard)
                    .sort((a,b) => b[1] - a[1])
                    .map(([emo,count]) => `${emo} ${count}`)
                    .join('<br>');
            }
            break;
    }
});

canvas.addEventListener('mousedown', (e) => {
    const { x, y } = coordsFromEvent(e);
    if (e.button === 0) {
        const handlePiece = handleForPoint(x, y);
        if (handlePiece) {
            handlePiece.direction = handlePiece.direction === 'right' ? 'left' : 'right';
            socket.send(JSON.stringify({ type: 'rotatePiece', id: handlePiece.id, direction: handlePiece.direction }));
            playBeep();
            return;
        }
        const targetPiece = pieceAt(x, y);
        if (targetPiece && targetPiece.owner === myEmoji) {
            draggingPiece = targetPiece;
            dragOffset.x = x - targetPiece.x;
            dragOffset.y = y - targetPiece.y;
            hoveredPiece = targetPiece;
            return;
        }
        let piece;
        if (selectedType === 'ramp') {
            piece = new Ramp(Date.now(), x, y, selectedDirection);
        } else if (selectedType === 'fan') {
            piece = new Fan(Date.now(), x, y, 1);
        } else if (selectedType === 'spring') {
            piece = new Spring(Date.now(), x, y, 8);
        } else if (selectedType === 'wall') {
            piece = new Wall(Date.now(), x, y);
        } else {
            piece = e.shiftKey ? new Spring(Date.now(), x, y, 8) : new Block(Date.now(), x, y);
        }
        piece.owner = myEmoji;
        pieces.push(piece);
        socket.send(JSON.stringify({ type: 'addPiece', piece }));
        playBeep();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const { x, y } = coordsFromEvent(e);
    if (draggingPiece) {
        draggingPiece.x = x - dragOffset.x;
        draggingPiece.y = y - dragOffset.y;
        socket.send(JSON.stringify({ type: 'movePiece', id: draggingPiece.id, x: draggingPiece.x, y: draggingPiece.y }));
    } else {
        socket.send(JSON.stringify({ type: 'cursor', x, y }));
    }
    hover.x = x;
    hover.y = y;
    if (!draggingPiece) {
        hoveredPiece = pieceAt(x, y);
    }
});

canvas.addEventListener('mouseup', () => {
    draggingPiece = null;
    hoveredPiece = null;
});

canvas.addEventListener('touchstart', (e) => {
    const { x, y } = coordsFromEvent(e);
    const handlePiece = handleForPoint(x, y);
    if (handlePiece) {
        handlePiece.direction = handlePiece.direction === 'right' ? 'left' : 'right';
        socket.send(JSON.stringify({ type: 'rotatePiece', id: handlePiece.id, direction: handlePiece.direction }));
        playBeep();
        return;
    }
    const targetPiece = pieceAt(x, y);
    if (targetPiece && targetPiece.owner === myEmoji) {
        draggingPiece = targetPiece;
        dragOffset.x = x - targetPiece.x;
        dragOffset.y = y - targetPiece.y;
        hoveredPiece = targetPiece;
    } else {
        let piece;
        if (selectedType === 'ramp') {
            piece = new Ramp(Date.now(), x, y, selectedDirection);
        } else if (selectedType === 'fan') {
            piece = new Fan(Date.now(), x, y, 1);
        } else if (selectedType === 'spring') {
            piece = new Spring(Date.now(), x, y, 8);
        } else if (selectedType === 'wall') {
            piece = new Wall(Date.now(), x, y);
        } else {
            piece = new Block(Date.now(), x, y);
        }
        piece.owner = myEmoji;
        pieces.push(piece);
        socket.send(JSON.stringify({ type: 'addPiece', piece }));
        playBeep();
    }
});

canvas.addEventListener('touchmove', (e) => {
    const { x, y } = coordsFromEvent(e);
    if (draggingPiece) {
        draggingPiece.x = x - dragOffset.x;
        draggingPiece.y = y - dragOffset.y;
        socket.send(JSON.stringify({ type: 'movePiece', id: draggingPiece.id, x: draggingPiece.x, y: draggingPiece.y }));
    }
    hover.x = x;
    hover.y = y;
    if (!draggingPiece) {
        hoveredPiece = pieceAt(x, y);
    }
});

canvas.addEventListener('touchend', () => {
    draggingPiece = null;
    hoveredPiece = null;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { x, y } = coordsFromEvent(e);
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    const piece = new Ramp(Date.now(), x, y, direction);
    piece.owner = myEmoji;
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
    playBeep();
});

canvas.addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    const { x, y } = coordsFromEvent(e);
    const piece = new Fan(Date.now(), x, y, 1);
    piece.owner = myEmoji;
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
    playBeep();
});

canvas.addEventListener('dblclick', (e) => {
    const { x, y } = coordsFromEvent(e);
    const p = pieceAt(x, y);
    if (p && p.owner === myEmoji) {
        pieces = pieces.filter(q => q.id !== p.id);
        socket.send(JSON.stringify({ type: 'removePiece', id: p.id }));
        playBeep(330);
    }
});


window.addEventListener('keydown', (e) => {
    if (e.key === 'r') {
        socket.send(JSON.stringify({ type: 'resetPuzzle' }));
    }
});

function drawBlock(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = '#4aa';
    // draw centered on p.x, p.y so physics & UI coordinates match
    ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x - 10, p.y + 10, 20, 5);
    ctx.restore();
}

function drawRamp(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = '#aa4';
    ctx.beginPath();
    if (p.direction === 'right') {
        ctx.moveTo(p.x - 10, p.y + 10);
        ctx.lineTo(p.x + 10, p.y + 10);
        ctx.lineTo(p.x + 10, p.y - 10);
    } else {
        ctx.moveTo(p.x + 10, p.y + 10);
        ctx.lineTo(p.x - 10, p.y + 10);
        ctx.lineTo(p.x - 10, p.y - 10);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (p.owner === myEmoji && hoveredPiece === p) {
        drawRotateHandle(p);
    }
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

function drawSpring(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.strokeStyle = '#090';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.moveTo(p.x - 6, p.y + 6);
    ctx.lineTo(p.x + 6, p.y - 6);
    ctx.stroke();
    ctx.restore();
}

function drawRotateHandle(p) {
    const pos = rotateHandlePos(p);
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawWall(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = '#844';
    ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x - p.width / 2, p.y + p.height / 2, p.width, 5);
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
        } else if (p.type === 'spring') {
            drawSpring(p);
        } else if (p.type === 'wall') {
            drawWall(p);
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

    otherCursors.forEach((pos, emoji) => {
        ctx.fillText(emoji, pos.x, pos.y);
    });

    requestAnimationFrame(render);
}

render();
