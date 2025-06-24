// Basic client setup connecting to the WebSocket server
const socket = new WebSocket(`ws://${location.host}`);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

socket.addEventListener('open', () => {
    console.log('Connected to server');
});

socket.addEventListener('message', event => {
    // Handle incoming messages (game state updates, etc.)
    console.log('Server:', event.data);
});

// Placeholder render loop
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw game objects here
    requestAnimationFrame(render);
}

render();
