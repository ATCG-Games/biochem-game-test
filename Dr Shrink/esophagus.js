// Esophagus Mini-game Logic
class EsophagusGame {
    constructor() {
        this.canvas = document.getElementById('esophagus-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.paused = false;
        
        this.laneWidth = 0;
        this.lanes = [0, 1, 2]; // Left, Center, Right
        this.playerLane = 1;
        this.targetLane = 1;
        this.laneTransition = 1; // 0 to 1
        
        this.lives = 3;
        this.ringsTotal = 30;
        this.ringsPassed = 0;
        this.rings = [];
        
        this.spawnTimer = 0;
        this.spawnIntervalBase = 1.2; 
        this.spawnInterval = 1.2; 
        this.ringSpeedBase = 800;
        this.ringSpeed = 800; 
        
        this.lastSafeLane = -1;
        
        this.playerRadius = 25;
        this.ringHeight = 40;
        
        this.lastTime = 0;
        this.mousePos = { x: 0, y: 0 };
        this.pauseHoverIdx = -1;
        
        this.pauseButtons = [
            { label: 'Resume', action: 'resume', color: '#66ff99' },
            { label: 'Skip Stage', action: 'skip', color: '#ffcc00' },
            { label: 'Exit to Menu', action: 'exit', color: '#ff3366' }
        ];
        
        // Bind input
        window.addEventListener('keydown', (e) => this.handleInput(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    }

    handleInput(e) {
        if (!this.running) return;
        
        if (e.key === 'Escape') {
            this.paused = !this.paused;
            return;
        }

        if (this.paused) return;

        if (e.key === 'a' || e.key === 'ArrowLeft') {
            if (this.targetLane > 0) {
                this.targetLane--;
                this.laneTransition = 0;
            }
        }
        if (e.key === 'd' || e.key === 'ArrowRight') {
            if (this.targetLane < 2) {
                this.targetLane++;
                this.laneTransition = 0;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.running || !this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        // Check button hover
        const W = this.canvas.width;
        const H = this.canvas.height;
        const pw = 300, ph = 40 + this.pauseButtons.length * 60;
        const px = W/2 - pw/2, py = H/2 - ph/2;
        
        this.pauseHoverIdx = -1;
        this.pauseButtons.forEach((btn, i) => {
            const bx = px + 20, by = py + 60 + i * 60;
            const bw = pw - 40, bh = 45;
            if (this.mousePos.x > bx && this.mousePos.x < bx + bw &&
                this.mousePos.y > by && this.mousePos.y < by + bh) {
                this.pauseHoverIdx = i;
            }
        });
    }

    handleMouseDown(e) {
        if (!this.running || !this.paused || e.button !== 0) return;
        
        if (this.pauseHoverIdx !== -1) {
            const action = this.pauseButtons[this.pauseHoverIdx].action;
            if (action === 'resume') this.paused = false;
            if (action === 'skip') this.onWin();
            if (action === 'exit') {
                this.stop();
                if (window.switchView && window.gameView) window.switchView(window.gameView);
            }
        }
    }

    start() {
        this.resize();
        this.running = true;
        this.paused = false;
        this.lives = 3;
        this.ringsPassed = 0;
        this.rings = [];
        this.spawnTimer = 0;
        this.playerLane = 1;
        this.targetLane = 1;
        this.laneTransition = 1;
        this.lastTime = performance.now();
        
        document.getElementById('eso-game-over').classList.add('hidden');
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.laneWidth = this.canvas.width / 3;
    }

    spawnRing() {
        if (this.ringsPassed + this.rings.length >= this.ringsTotal) return;
        
        let safeLane;
        do {
            safeLane = Math.floor(Math.random() * 3);
        } while (safeLane === this.lastSafeLane);
        
        this.lastSafeLane = safeLane;
        
        this.rings.push({
            y: -50,
            safeLane: safeLane
        });
    }

    update(dt) {
        if (!this.running || this.paused) return;

        // Smooth lane movement
        if (this.laneTransition < 1) {
            this.laneTransition += dt * 10;
            if (this.laneTransition > 1) {
                this.laneTransition = 1;
                this.playerLane = this.targetLane;
            }
        }

        // Extreme difficulty scaling
        const progressFactor = this.ringsPassed / this.ringsTotal;
        this.ringSpeed = this.ringSpeedBase + (progressFactor * 400); // Up to 1200px/s
        this.spawnInterval = this.spawnIntervalBase - (progressFactor * 0.8); // Down to 0.4s

        // Spawn rings
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRing();
        }

        // Update rings
        const playerY = this.canvas.height * 0.75;
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            const prevY = ring.y;
            ring.y += this.ringSpeed * dt;

            // Collision Check
            if (prevY < playerY && ring.y >= playerY) {
                const currentPlayerX = this.getLerpedPlayerX();
                const playerLaneIdx = Math.floor(currentPlayerX / this.laneWidth);
                
                if (playerLaneIdx !== ring.safeLane) {
                    this.onHit();
                }
            }

            if (ring.y > this.canvas.height + 100) {
                this.rings.splice(i, 1);
                this.ringsPassed++;
                if (this.ringsPassed >= this.ringsTotal) {
                    this.onWin();
                }
            }
        }
        
        // Update UI
        const esoLives = document.getElementById('eso-lives');
        const esoProgress = document.getElementById('eso-progress');
        if (esoLives) esoLives.textContent = '❤️'.repeat(this.lives);
        if (esoProgress) esoProgress.textContent = `Rings: ${this.ringsPassed}/${this.ringsTotal}`;
    }

    getLerpedPlayerX() {
        const startX = (this.playerLane + 0.5) * this.laneWidth;
        const endX = (this.targetLane + 0.5) * this.laneWidth;
        return startX + (endX - startX) * this.laneTransition;
    }

    onHit() {
        this.lives--;
        const flash = document.getElementById('eso-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 200);
        }
        
        if (this.lives <= 0) {
            this.onGameOver();
        }
    }

    onWin() {
        this.running = false;
        if (window.onEsophagusComplete) {
            window.onEsophagusComplete();
        }
    }

    onGameOver() {
        this.running = false;
        document.getElementById('eso-game-over').classList.remove('hidden');
    }

    draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Draw background
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, '#4a0e0e');
        grad.addColorStop(0.5, '#8a1c1c');
        grad.addColorStop(1, '#4a0e0e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Draw lane markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.laneWidth, 0);
            ctx.lineTo(i * this.laneWidth, H);
            ctx.stroke();
        }

        // Draw rings
        this.rings.forEach(ring => {
            ctx.save();
            ctx.fillStyle = '#ff4d4d';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0000';
            
            for (let l = 0; l < 3; l++) {
                if (l !== ring.safeLane) {
                    ctx.fillRect(l * this.laneWidth, ring.y - this.ringHeight/2, this.laneWidth, this.ringHeight);
                } else {
                    ctx.fillStyle = 'rgba(102, 255, 102, 0.2)';
                    ctx.fillRect(l * this.laneWidth, ring.y - this.ringHeight/2, this.laneWidth, this.ringHeight);
                    ctx.fillStyle = '#ff4d4d'; 
                }
            }
            ctx.restore();
        });

        // Draw player
        const playerX = this.getLerpedPlayerX();
        const playerY = H * 0.75;
        
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#66ff66';
        ctx.fillStyle = 'rgba(102, 255, 102, 0.3)';
        ctx.beginPath();
        ctx.arc(playerX, playerY, this.playerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#66ff66';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('NANO', playerX, playerY + 7);
        ctx.restore();

        if (this.paused) {
            this.drawPauseMenu();
        }
    }

    drawPauseMenu() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        
        const pw = 300, ph = 40 + this.pauseButtons.length * 60;
        const px = W/2 - pw/2, py = H/2 - ph/2;
        
        ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, px, py, pw, ph, 15);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', W/2, py + 40);
        
        this.pauseButtons.forEach((btn, i) => {
            const bx = px + 20, by = py + 60 + i * 60;
            const bw = pw - 40, bh = 45;
            const hovered = (this.pauseHoverIdx === i);
            
            ctx.fillStyle = hovered ? btn.color + '33' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = btn.color;
            this.roundRect(ctx, bx, by, bw, bh, 8);
            ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = btn.color;
            ctx.font = 'bold 18px Inter';
            ctx.fillText(btn.label, W/2, by + 28);
        });
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
        ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
    }

    loop(timestamp) {
        if (!this.running) return;
        
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.EsophagusGame = new EsophagusGame();
window.addEventListener('resize', () => {
    if (window.EsophagusGame) window.EsophagusGame.resize();
});
