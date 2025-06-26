import { Block, Ramp, Ball, Fan, Spring, Wall, pieceAlpha, setupResponsiveCanvas } from './ui.js';
import { updateBall } from './physics.js';
import { playBeep, startBackgroundMusic, setMasterVolume, masterVolume } from './sound.js';
import { generatePuzzle } from './levelGenerator.js';

// WebSocket connection to the server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
setupResponsiveCanvas(canvas);
const ctx = canvas.getContext('2d');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const leaderboardEl = document.getElementById('leaderboard');
const pieceCountersEl = document.getElementById('pieceCounters');
const scoreValueEl = document.getElementById('scoreValue');
const resetLevelBtn = document.getElementById('resetLevelBtn');
const emojiInput = document.getElementById('emojiInput');
const emojiBtn = document.getElementById('emojiBtn');
const palette = document.getElementById('palette');
const rotateBtn = document.getElementById('rotateBtn');
const tutorialEl = document.getElementById('tutorial');
const skipTutorialBtn = document.getElementById('skipTutorialBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const volumeSlider = document.getElementById('volumeSlider');
const colorBlindToggle = document.getElementById('colorBlindToggle');

const otherCursors = new Map();
let draggingPiece = null;
let dragOffset = { x: 0, y: 0 };

const normalPalette = {
    block: '#4aa',
    ramp: '#aa4',
    fan: '#88c',
    spring: '#090',
    wall: '#844',
    ball: '#f90',
    target: '#e33'
};

const cbPalette = {
    block: '#377eb8',
    ramp: '#984ea3',
    fan: '#4daf4a',
    spring: '#e41a1c',
    wall: '#ff7f00',
    ball: '#ffff33',
    target: '#a65628'
};

let paletteColors = normalPalette;

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        socket.send(JSON.stringify({ type: 'chat', text: chatInput.value.trim() }));
        chatInput.value = '';
    }
});
if (resetLevelBtn) {
    resetLevelBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({ type: 'resetLevel' }));
        resets++;
        updateHud();
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

if (skipTutorialBtn) {
    skipTutorialBtn.addEventListener('click', () => {
        tutorialEl.classList.add('hidden');
        canvas.focus();
    });
}

if (settingsBtn && settingsModal && closeSettingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        if (volumeSlider) volumeSlider.value = masterVolume;
        if (colorBlindToggle) colorBlindToggle.checked = paletteColors === cbPalette;
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        canvas.focus();
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
        setMasterVolume(parseFloat(volumeSlider.value));
    });
}

if (colorBlindToggle) {
    colorBlindToggle.addEventListener('change', () => {
        paletteColors = colorBlindToggle.checked ? cbPalette : normalPalette;
    });
}

let myEmoji = '❓';
let pieces = [];
let target = null;
let ball = null;
let selectedType = 'block';
let selectedDirection = 'right';
let puzzleStartTime = Date.now();
let resets = 0;
let isRunning = false;
let ballInitial = null;
const HANDLE_RADIUS = 6;
let hover = { x: 0, y: 0 };
let hoveredPiece = null;
updateHud();

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

function updateHud() {
    if (!pieceCountersEl || !scoreValueEl) return;
    const counts = { block: 0, wall: 0, ramp: 0, fan: 0, spring: 0 };
    pieces.forEach(p => {
        if (counts[p.type] !== undefined) counts[p.type]++;
    });
    pieceCountersEl.innerHTML = Object.entries(counts)
        .map(([t, c]) => `${t}: ${c}`)
        .join('<br>');
    const elapsedMinutes = (Date.now() - puzzleStartTime) / 60000;
    const base = 100;
    const score = Math.max(0, Math.round(base - pieces.length - resets * 5 - elapsedMinutes * 2));
    scoreValueEl.textContent = score;
}

socket.addEventListener('open', () => {
    console.log('Connected to server');
    startBackgroundMusic();
    setInterval(updateHud, 1000);
});

socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'welcome':
            myEmoji = msg.emoji;
            if (msg.seed) {
                const puzzle = generatePuzzle(msg.difficulty, msg.seed);
                pieces = puzzle.pieces.filter(p => p.type !== 'ball');
                ball = puzzle.pieces.find(p => p.type === 'ball') || null;
                target = puzzle.target;
            } else {
                pieces = (msg.pieces || []).filter(p => p.type !== 'ball');
                ball = (msg.pieces || []).find(p => p.type === 'ball') || null;
                target = msg.target;
            }
            ballInitial = ball ? { ...ball } : null;
            isRunning = false;
            puzzleStartTime = Date.now();
            resets = 0;
            updateHud();
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
            updateHud();
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
            updateHud();
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
            if (msg.seed) {
                const puzzle = generatePuzzle(msg.difficulty, msg.seed);
                pieces = puzzle.pieces.filter(p => p.type !== 'ball');
                ball = puzzle.pieces.find(p => p.type === 'ball') || null;
                target = puzzle.target;
            } else {
                pieces = (msg.pieces || []).filter(p => p.type !== 'ball');
                ball = (msg.pieces || []).find(p => p.type === 'ball') || null;
                target = msg.target;
            }
            ballInitial = ball ? { ...ball } : null;
            isRunning = false;
            resets = 0;
            puzzleStartTime = Date.now();
            updateHud();
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
        updateHud();
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
        updateHud();
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
    updateHud();
});

canvas.addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    const { x, y } = coordsFromEvent(e);
    const piece = new Fan(Date.now(), x, y, 1);
    piece.owner = myEmoji;
    pieces.push(piece);
    socket.send(JSON.stringify({ type: 'addPiece', piece }));
    playBeep();
    updateHud();
});

canvas.addEventListener('dblclick', (e) => {
    const { x, y } = coordsFromEvent(e);
    const p = pieceAt(x, y);
    if (p && p.owner === myEmoji) {
        pieces = pieces.filter(q => q.id !== p.id);
        socket.send(JSON.stringify({ type: 'removePiece', id: p.id }));
        playBeep(330);
        updateHud();
    }
});


window.addEventListener('keydown', (e) => {
    if (tutorialEl && !tutorialEl.classList.contains('hidden')) return;
    if (e.key === 'r') {
        socket.send(JSON.stringify({ type: 'resetPuzzle' }));
        resets++;
        updateHud();
    } else if (e.key === 'R') {
        if (hoveredPiece && hoveredPiece.type === 'ramp' && hoveredPiece.owner === myEmoji) {
            hoveredPiece.direction = 'right';
            socket.send(JSON.stringify({ type: 'rotatePiece', id: hoveredPiece.id, direction: 'right' }));
            playBeep();
        }
    } else if (e.key === 'f' || e.key === 'F') {
        if (hoveredPiece && hoveredPiece.type === 'ramp' && hoveredPiece.owner === myEmoji) {
            hoveredPiece.direction = 'left';
            socket.send(JSON.stringify({ type: 'rotatePiece', id: hoveredPiece.id, direction: 'left' }));
            playBeep();
        }
    } else if (e.key === 'Delete') {
        if (hoveredPiece && hoveredPiece.owner === myEmoji) {
            pieces = pieces.filter(p => p.id !== hoveredPiece.id);
            socket.send(JSON.stringify({ type: 'removePiece', id: hoveredPiece.id }));
            playBeep(330);
            hoveredPiece = null;
            updateHud();
        }
    } else if (e.code === 'Space') {
        isRunning = !isRunning;
        if (ballInitial) {
            ball = { ...ballInitial };
        }
        e.preventDefault();
    }
});

function drawBlock(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = paletteColors.block;
    // draw centered on p.x, p.y so physics & UI coordinates match
    ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x - 10, p.y + 10, 20, 5);
    ctx.restore();
}

function drawRamp(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.fillStyle = paletteColors.ramp;
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
    ctx.fillStyle = paletteColors.fan;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - 15);
    ctx.strokeStyle = paletteColors.fan;
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}

function drawSpring(p) {
    ctx.save();
    ctx.globalAlpha = pieceAlpha(p);
    ctx.strokeStyle = paletteColors.spring;
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
    ctx.fillStyle = paletteColors.wall;
    ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x - p.width / 2, p.y + p.height / 2, p.width, 5);
    ctx.restore();
}

function drawTarget() {
    if (!target) return;
    ctx.fillStyle = paletteColors.target;
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
    ctx.fillStyle = paletteColors.ball;
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
        if (isRunning) {
            updateBall(ball, pieces, 1);
            socket.send(JSON.stringify({ type: 'ballUpdate', ball }));
            if (target) {
                const dx = ball.x - target.x;
                const dy = ball.y - target.y;
                if (Math.sqrt(dx * dx + dy * dy) < ball.radius + 8) {
                    socket.send(JSON.stringify({ type: 'ballUpdate', ball }));
                }
            }
        }
        drawBallPiece();
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
