// Game Engine - Stage System
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let isMouseDown = false;
const mousePos = { x: 0, y: 0 };

function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
}

canvas.addEventListener('mousemove', updateMousePos);
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (e.button === 0) { isMouseDown = true; updateMousePos(e); }
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) isMouseDown = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

let animationFrameId = null;
let gameRunning = false;

const gameState = { levelName: '', lastTime: 0 };

const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

// ---- PAUSE STATE ----
let isPaused = false;
let pauseMenuVisible = false;
const PAUSE_BTNS = [
    { label: 'Resume',           action: 'resume',      color: '#66ff99' },
    { label: 'Skip Stage',       action: 'skip_stage',  color: '#ffcc00' },
    { label: 'Skip All Stages',  action: 'skip_all',    color: '#ff6633' },
    { label: 'Exit to Main Menu',action: 'exit',        color: '#ff3366' },
];
let pauseHoverIdx = -1;

function drawPauseMenu() {
    if (!pauseMenuVisible) return;
    const W = canvas.width, H = canvas.height;
    // Dim overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    // Panel
    const pw = 400, ph = 60 + PAUSE_BTNS.length * 68;
    const px = W/2 - pw/2, py = H/2 - ph/2;
    ctx.fillStyle = 'rgba(14,20,30,0.95)';
    ctx.strokeStyle = 'rgba(100,200,255,0.25)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px, py, pw, ph, 18);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter';
    ctx.fillStyle = '#e6edf3';
    ctx.shadowBlur = 0;
    ctx.fillText('PAUSED', W/2, py + 46);

    // Buttons
    PAUSE_BTNS.forEach((btn, i) => {
        const bx = px + 30, by = py + 70 + i * 68;
        const bw = pw - 60, bh = 52;
        const hovered = (pauseHoverIdx === i);
        ctx.fillStyle = hovered ? btn.color + '22' : 'rgba(255,255,255,0.04)';
        ctx.strokeStyle = btn.color;
        ctx.lineWidth = hovered ? 2 : 1;
        roundRect(ctx, bx, by, bw, bh, 10);
        ctx.fill(); ctx.stroke();
        ctx.font = `${hovered ? 'bold ' : ''}20px Inter`;
        ctx.fillStyle = btn.color;
        ctx.shadowBlur = hovered ? 12 : 0;
        ctx.shadowColor = btn.color;
        ctx.fillText(btn.label, W/2, by + bh/2 + 7);
    });
    ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
    c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    c.lineTo(x+r, y+h); c.quadraticCurveTo(x, y+h, x, y+h-r);
    c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
    c.closePath();
}

function getPauseBtnAt(mx, my) {
    const W = canvas.width, H = canvas.height;
    const pw = 400, ph = 60 + PAUSE_BTNS.length * 68;
    const px = W/2 - pw/2, py = H/2 - ph/2;
    for (let i = 0; i < PAUSE_BTNS.length; i++) {
        const bx = px+30, by = py+70+i*68, bw = pw-60, bh = 52;
        if (mx >= bx && mx <= bx+bw && my >= by && my <= by+bh) return i;
    }
    return -1;
}

function openPause() {
    isPaused = true;
    pauseMenuVisible = true;
    window.isGamePaused = true;
    // Force a draw of pause menu immediately
    draw();
    drawPauseMenu();
}

function closePause() {
    isPaused = false;
    pauseMenuVisible = false;
    window.isGamePaused = false;
    gameState.lastTime = performance.now();
}

function handlePauseAction(action) {
    if (action === 'resume') {
        closePause();
    } else if (action === 'skip_stage') {
        closePause();
        window.skipCurrentStage();
    } else if (action === 'skip_all') {
        closePause();
        window.skipAllStages();
    } else if (action === 'exit') {
        closePause();
        gameRunning = false;
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        // Return to game map view
        document.getElementById('level-view').classList.replace('active', 'hidden');
        document.getElementById('game-view').classList.replace('hidden', 'active');
    }
}

let currentStage = 0;
let stageEnemiesRemaining = 0;
let stageTransitioning = false;
let stageMessageTimer = 0;
let stageMessageText = '';
let stageMessageSub = '';
let bossSpawnPending = false;

const STAGE_CONFIG = [
    null,
    { // Stage 1
        label: 'Stage 1',
        sub: 'Eliminate all pathogens!',
        enemyCount: 18,
        spawnInterval: 1.2,
        enemyLevel: 2,
        shooterChance: 0,
        color: '#66ff99'
    },
    { // Stage 2
        label: 'Stage 2',
        sub: 'Stronger pathogens inbound!',
        enemyCount: 22,
        spawnInterval: 0.8,
        enemyLevel: 5,
        shooterChance: 0.55,
        color: '#ffaa33'
    },
    { // Stage 3 - Boss
        label: 'Stage 3',
        sub: 'FINAL BOSS',
        enemyCount: 1,
        spawnInterval: 999,
        enemyLevel: 5,
        shooterChance: 0,
        color: '#ff3366',
        isBoss: true
    }
];

let enemiesToSpawn = 0;
let spawnTimer = 0;
let nextSpawnInterval = 1.5;

// ---- CLASSES ----
class Projectile {
    constructor(x, y, targetX, targetY, speed = 800, radius = 6, color = '#66ff66') {
        this.x = x; this.y = y;
        this.speed = speed; this.radius = radius; this.color = color;
        const dx = targetX - x, dy = targetY - y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        this.vx = (dx/len)*speed; this.vy = (dy/len)*speed;
        this.active = true;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.x < -50 || this.x > canvas.width+50 || this.y < -50 || this.y > canvas.height+50)
            this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

class EnemyProjectile extends Projectile {
    constructor(x, y, tx, ty, speed = 380) { super(x, y, tx, ty, speed, 5, '#ff4444'); }
}

class Enemy {
    constructor(x, y, level) {
        this.x = x; this.y = y;
        const bonus = Math.floor(Math.random() * level);
        this.maxHp = Math.floor(Math.random() * 4) + 2 + bonus;
        this.hp = this.maxHp;
        this.radius = 12 + this.maxHp * 3;
        this.speed = Math.max(70, 160 - this.maxHp * 8 + level * 12);
        this.color = '#ff3333';
        this.active = true;
        this.isBoss = false;
        this.throwTimer = 0;
        this.throwVx = 0;
        this.throwVy = 0;
    }
    update(dt, player) {
        if (this.throwTimer > 0) {
            this.throwTimer -= dt;
            this.x += this.throwVx * dt;
            this.y += this.throwVy * dt;
            // Add some drag to the throw
            this.throwVx *= Math.pow(0.1, dt);
            this.throwVy *= Math.pow(0.1, dt);
        } else {
            const dx = player.x - this.x, dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            this.x += (dx/dist)*this.speed*dt;
            this.y += (dy/dist)*this.speed*dt;
        }
        
        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        if (dist < this.radius + player.width/2 && player.invulnerable <= 0) {
            player.hp -= 10; player.invulnerable = 1.0;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8; ctx.shadowColor = this.color;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i/12)*Math.PI*2;
            const r = i % 2 === 0 ? this.radius + 6 : this.radius;
            const sx = this.x + Math.cos(angle)*r, sy = this.y + Math.sin(angle)*r;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#500000';
            ctx.fillRect(this.x - 12, this.y - this.radius - 14, 24, 5);
            ctx.fillStyle = '#00ff44';
            ctx.fillRect(this.x - 12, this.y - this.radius - 14, 24*(this.hp/this.maxHp), 5);
        }
    }
}

class ShootingEnemy extends Enemy {
    constructor(x, y, level) {
        super(x, y, level);
        this.color = '#cc33ff';
        this.fireTimer = Math.random() * 1.5; // stagger initial shots
        this.fireRate = 1.2;
        this.stopDistance = 320;
        this.leadFactor = 0.7; // predictive aim factor
    }
    update(dt, player) {
        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        if (dist > this.stopDistance) {
            this.x += (dx/dist)*this.speed*dt;
            this.y += (dy/dist)*this.speed*dt;
        } else {
            // Strafe sideways while shooting
            const perpX = -dy/dist, perpY = dx/dist;
            this.x += perpX * this.speed * 0.4 * dt;
            this.y += perpY * this.speed * 0.4 * dt;
            this.fireTimer += dt;
            if (this.fireTimer >= this.fireRate) {
                this.fireTimer = 0;
                // Predictive aim: lead the player based on bullet travel time
                const bulletSpeed = 420;
                const travelTime = dist / bulletSpeed;
                // Estimate player future pos (use keys direction as hint, fallback to current pos)
                const aimX = player.x + (player.vx||0) * travelTime * this.leadFactor;
                const aimY = player.y + (player.vy||0) * travelTime * this.leadFactor;
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, aimX, aimY, 420));
            }
        }
        if (dist < this.radius + player.width/2 && player.invulnerable <= 0) {
            player.hp -= 12; player.invulnerable = 1.0;
        }
    }
}

class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 10);
        this.maxHp = 300; this.hp = 300;
        this.radius = 65;
        this.speed = 60;
        this.color = '#ff0055';
        this.isBoss = true;
        this.fireTimer = 0; this.fireRate = 1.2;
        this.spawnTimer = 0; this.spawnRate = 4.0;
        this.angle = 0;
        this.pulseT = 0;
    }
    update(dt, player) {
        this.pulseT += dt;
        this.angle += dt * 0.8;
        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        // Move slowly toward player
        if (dist > 200) {
            this.x += (dx/dist)*this.speed*dt;
            this.y += (dy/dist)*this.speed*dt;
        }
        // Shoot bullets in spread
        this.fireTimer += dt;
        if (this.fireTimer >= this.fireRate) {
            this.fireTimer = 0;
            for (let i = -2; i <= 2; i++) {
                const spread = i * 0.25;
                const baseAngle = Math.atan2(player.y - this.y, player.x - this.x) + spread;
                const p = new EnemyProjectile(this.x, this.y, 
                    this.x + Math.cos(baseAngle)*100, 
                    this.y + Math.sin(baseAngle)*100);
                enemyProjectiles.push(p);
            }
        }
        // Spawn minions by throwing them from the boss
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            for (let i = 0; i < 2; i++) {
                const minion = new Enemy(this.x, this.y, 2);
                minion.color = '#ff6699';
                minion.maxHp = 3; minion.hp = 3; minion.radius = 14;
                
                // Throw them in a random direction
                const throwAngle = Math.random() * Math.PI * 2;
                const throwSpeed = 400 + Math.random() * 200;
                minion.throwTimer = 0.8; // Takes 0.8s to land
                minion.throwVx = Math.cos(throwAngle) * throwSpeed;
                minion.throwVy = Math.sin(throwAngle) * throwSpeed;
                
                enemies.push(minion);
            }
        }
        if (dist < this.radius + player.width/2 && player.invulnerable <= 0) {
            player.hp -= 20; player.invulnerable = 1.5;
        }
    }
    draw(ctx) {
        const pulse = Math.sin(this.pulseT * 3) * 5;
        ctx.save();
        // Outer glow rings
        for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + pulse + r*12, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255, 0, 85, ${0.15 - r*0.04})`;
            ctx.lineWidth = 6;
            ctx.stroke();
        }
        // Rotating spikes
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 30; ctx.shadowColor = '#ff0055';
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const a = (i/16)*Math.PI*2;
            const r = i % 2 === 0 ? this.radius + 18 + pulse : this.radius;
            const sx = Math.cos(a)*r, sy = Math.sin(a)*r;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath(); ctx.fill();
        // Core
        ctx.fillStyle = '#cc0044';
        ctx.beginPath(); ctx.arc(0, 0, this.radius - 10, 0, Math.PI*2); ctx.fill();
        // Eye
        ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.arc(0, -10, 18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, -10, 9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(4, -14, 4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // HP bar
        const barW = this.radius * 3;
        ctx.fillStyle = '#300010';
        ctx.fillRect(this.x - barW/2, this.y - this.radius - 22, barW, 10);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(this.x - barW/2, this.y - this.radius - 22, barW*(this.hp/this.maxHp), 10);
        ctx.strokeStyle = '#ff6699';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barW/2, this.y - this.radius - 22, barW, 10);
        // BOSS label
        ctx.fillStyle = '#ff6699';
        ctx.font = 'bold 13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('FINAL BOSS', this.x, this.y - this.radius - 28);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameRunning) {
        e.preventDefault();
        if (pauseMenuVisible) closePause(); else openPause();
        return;
    }
    if (!isPaused) {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
        if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    updateMousePos(e);
    if (pauseMenuVisible) {
        pauseHoverIdx = getPauseBtnAt(mousePos.x, mousePos.y);
        draw(); drawPauseMenu();
    }
});

canvas.addEventListener('click', (e) => {
    if (!pauseMenuVisible) return;
    const idx = getPauseBtnAt(mousePos.x, mousePos.y);
    if (idx >= 0) handlePauseAction(PAUSE_BTNS[idx].action);
});


class Player {
    constructor() {
        this.x = 0; this.y = 0;
        this.speed = 520;
        this.maxHp = 100; this.hp = 100;
        this.width = 48; this.height = 48;
        this.sprite = new Image();
        this.sprite.src = 'assets/dr_sukru.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
        this.fireRate = 0.25; this.fireTimer = 0;
        this.invulnerable = 0;
    }
    update(dt) {
        let dx = 0, dy = 0;
        if (keys.w || keys.ArrowUp) dy -= 1;
        if (keys.s || keys.ArrowDown) dy += 1;
        if (keys.a || keys.ArrowLeft) dx -= 1;
        if (keys.d || keys.ArrowRight) dx += 1;
        if (dx !== 0 && dy !== 0) { const l = Math.sqrt(2); dx /= l; dy /= l; }
        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y));
        if (this.invulnerable > 0) this.invulnerable -= dt;
        this.fireTimer += dt;
        if (isMouseDown && this.fireTimer >= this.fireRate) {
            this.fireTimer = 0;
            projectiles.push(new Projectile(this.x, this.y, mousePos.x, mousePos.y));
        } else if (!isMouseDown && this.fireTimer > this.fireRate) {
            this.fireTimer = this.fireRate;
        }
    }
    draw(ctx) {
        const r = this.width / 2;
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = '#66ff66';
        ctx.fillStyle = 'rgba(102,255,102,0.25)';
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#66ff66'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
        if (this.spriteLoaded) {
            ctx.save();
            if (this.invulnerable > 0) ctx.globalAlpha = Math.sin(performance.now()*0.02)*0.5+0.5;
            ctx.drawImage(this.sprite, this.x-15, this.y-19, 30, 38);
            ctx.restore();
        }
    }
}

let player = new Player();
let projectiles = [], enemies = [], enemyProjectiles = [];

// Background particles
class BgParticle {
    constructor() { this.reset(); this.y = Math.random() * canvas.height; }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -30;
        this.size = Math.random() * 8 + 2;
        this.speed = Math.random() * 25 + 8;
        this.opacity = Math.random() * 0.18 + 0.04;
        this.hue = Math.random() * 40 + 330; // pinkish-red
    }
    update(dt) { this.y += this.speed * dt; if (this.y > canvas.height + 30) this.reset(); }
    draw(ctx) {
        ctx.fillStyle = `hsla(${this.hue},80%,60%,${this.opacity})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    }
}
let bgParticles = [];
for (let i = 0; i < 60; i++) bgParticles.push(new BgParticle());

// ---- STAGE LOGIC ----
function startStage(stageNum) {
    currentStage = stageNum;
    const cfg = STAGE_CONFIG[stageNum];
    if (!cfg) return;

    stageTransitioning = true;
    stageMessageTimer = 3.0;
    stageMessageText = cfg.label;
    stageMessageSub = cfg.sub;

    enemies = [];
    enemyProjectiles = [];
    projectiles = [];
    spawnTimer = 0;

    if (cfg.isBoss) {
        enemiesToSpawn = 0;
        stageEnemiesRemaining = 1;
        bossSpawnPending = true; // boss spawns when transition ends
    } else {
        enemiesToSpawn = cfg.enemyCount;
        stageEnemiesRemaining = cfg.enemyCount;
        nextSpawnInterval = cfg.spawnInterval;
        bossSpawnPending = false;
    }

    // Update stage UI
    const stageEl = document.getElementById('stage-label');
    if (stageEl) {
        stageEl.textContent = cfg.isBoss ? 'Stage 3 — Final Boss' : cfg.label;
        stageEl.style.color = cfg.color;
    }
}

let stageCompleteScheduled = false;

function onEnemyKilled() {
    stageEnemiesRemaining--;
}

function checkStageComplete() {
    if (stageCompleteScheduled) return;
    if (currentStage === 0) return;
    if (bossSpawnPending) return;   // waiting for boss to appear
    if (enemiesToSpawn > 0) return;
    if (enemies.length > 0) return;

    stageCompleteScheduled = true;
    if (currentStage < 3) {
        setTimeout(() => {
            stageCompleteScheduled = false;
            startStage(currentStage + 1);
        }, 1500);
    } else {
        showWin();
    }
}

function showWin() {
    gameRunning = false;
    // Notify the map that this organ's objective is complete
    if (window.onOrganComplete) window.onOrganComplete(gameState.levelName);
    const screen = document.getElementById('game-over-screen');
    screen.classList.remove('hidden');
    screen.querySelector('h1').textContent = '🎉 YOU WIN!';
    screen.querySelector('h1').style.color = '#66ff66';
    const btn = document.getElementById('btn-respawn');
    btn.textContent = 'Return to Map';
    btn.onclick = () => {
        screen.classList.add('hidden');
        screen.querySelector('h1').textContent = 'YOU DIED';
        screen.querySelector('h1').style.color = '#ff3333';
        btn.textContent = 'Retry';
        btn.onclick = () => location.reload();
        document.getElementById('level-view').classList.replace('active','hidden');
        document.getElementById('game-view').classList.replace('hidden','active');
    };
}

// ---- MAIN LOOP ----
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    if (isPaused) {
        // Keep drawing pause menu while paused
        draw();
        drawPauseMenu();
        gameState.lastTime = timestamp;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    if (!gameState.lastTime) gameState.lastTime = timestamp;
    const dt = Math.min((timestamp - gameState.lastTime) / 1000, 0.05);
    gameState.lastTime = timestamp;
    update(dt);
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (stageTransitioning) {
        stageMessageTimer -= dt;
        if (stageMessageTimer <= 0) {
            stageTransitioning = false;
            // Spawn boss right when transition finishes
            if (bossSpawnPending) {
                bossSpawnPending = false;
                const boss = new Boss(canvas.width / 2, 130);
                enemies.push(boss);
            }
        }
    }

    // Track player velocity for predictive aim
    const prevX = player.x, prevY = player.y;
    player.update(dt);
    player.vx = (player.x - prevX) / dt;
    player.vy = (player.y - prevY) / dt;

    // Spawn enemies for current stage
    const cfg = STAGE_CONFIG[currentStage];
    if (cfg && !cfg.isBoss && enemiesToSpawn > 0 && !stageTransitioning) {
        spawnTimer += dt;
        if (spawnTimer >= nextSpawnInterval) {
            spawnTimer = 0;
            nextSpawnInterval = cfg.spawnInterval * (0.7 + Math.random() * 0.6);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(canvas.width, canvas.height) / 2 + 120;
            const sx = player.x + Math.cos(angle) * dist;
            const sy = player.y + Math.sin(angle) * dist;
            if (Math.random() < cfg.shooterChance) {
                enemies.push(new ShootingEnemy(sx, sy, cfg.enemyLevel));
            } else {
                enemies.push(new Enemy(sx, sy, cfg.enemyLevel));
            }
            enemiesToSpawn--;
        }
    }

    bgParticles.forEach(p => p.update(dt));
    projectiles.forEach(p => p.update(dt));
    enemies.forEach(e => e.update(dt, player));
    enemyProjectiles.forEach(p => p.update(dt));

    // Enemy projectile vs player
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        const dx = p.x - player.x, dy = p.y - player.y;
        if (Math.sqrt(dx*dx+dy*dy) < p.radius + player.width/2) {
            p.active = false;
            if (player.invulnerable <= 0) { player.hp -= 8; player.invulnerable = 0.5; }
        }
    }

    // Player projectile vs enemy
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = p.x - e.x, dy = p.y - e.y;
            if (Math.sqrt(dx*dx+dy*dy) < p.radius + e.radius) {
                p.active = false;
                e.hp -= 1;
                if (e.hp <= 0) {
                    e.active = false;
                    onEnemyKilled();
                }
                break;
            }
        }
    }

    projectiles = projectiles.filter(p => p.active);
    enemies = enemies.filter(e => e.active);
    enemyProjectiles = enemyProjectiles.filter(p => p.active);

    // Check stage completion after arrays are filtered
    if (!stageTransitioning && !stageCompleteScheduled) {
        checkStageComplete();
    }

    // Update HP bar
    const hpFill = document.getElementById('player-hp-fill');
    if (hpFill) hpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';

    // Update enemy count UI
    const countEl = document.getElementById('enemy-count');
    if (countEl) {
        const boss = enemies.find(e => e.isBoss);
        if (boss) {
            countEl.textContent = `Boss HP: ${boss.hp}/${boss.maxHp}`;
        } else {
            countEl.textContent = `Enemies left: ${enemies.length + enemiesToSpawn}`;
        }
    }

    if (player.hp <= 0 && gameRunning) {
        gameRunning = false;
        const stageToRetry = currentStage; // Remember current stage
        const screen = document.getElementById('game-over-screen');
        screen.classList.remove('hidden');
        document.getElementById('btn-respawn').onclick = () => {
            screen.classList.add('hidden');
            gameRunning = true;
            isPaused = false;
            pauseMenuVisible = false;
            window.isGamePaused = false;
            player = new Player();
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            projectiles = []; enemies = []; enemyProjectiles = [];
            // Reset to 0 BEFORE starting loop — prevents checkStageComplete
            // from seeing currentStage=3 + empty enemies and calling showWin()
            currentStage = 0;
            enemiesToSpawn = 0; stageEnemiesRemaining = 0;
            stageCompleteScheduled = false; bossSpawnPending = false;
            gameState.lastTime = performance.now();
            setTimeout(() => startStage(stageToRetry), 500);
            animationFrameId = requestAnimationFrame(gameLoop);
        };
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep space bio background
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 80, canvas.width/2, canvas.height/2, canvas.width * 0.8);
    if (currentStage === 3) {
        grad.addColorStop(0, '#1a0015');
        grad.addColorStop(0.5, '#0d0008');
        grad.addColorStop(1, '#050005');
    } else if (currentStage === 2) {
        grad.addColorStop(0, '#1a0a00');
        grad.addColorStop(0.5, '#0d0500');
        grad.addColorStop(1, '#050200');
    } else {
        grad.addColorStop(0, '#0a1a1a');
        grad.addColorStop(0.5, '#050d0d');
        grad.addColorStop(1, '#020808');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle hex grid
    ctx.strokeStyle = currentStage === 3 ? 'rgba(255,0,85,0.04)' : 'rgba(0,200,100,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    bgParticles.forEach(p => p.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    enemyProjectiles.forEach(p => p.draw(ctx));
    player.draw(ctx);

    // Stage transition overlay
    if (stageTransitioning && stageMessageTimer > 0) {
        const alpha = Math.min(1, stageMessageTimer > 2 ? 1 : stageMessageTimer / 1);
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = alpha;

        const cfg = STAGE_CONFIG[currentStage];
        // Stage label
        ctx.textAlign = 'center';
        ctx.font = 'bold 80px Inter';
        ctx.fillStyle = cfg ? cfg.color : '#fff';
        ctx.shadowBlur = 40; ctx.shadowColor = cfg ? cfg.color : '#fff';
        ctx.fillText(stageMessageText, canvas.width/2, canvas.height/2 - 20);

        // Sub label
        ctx.font = currentStage === 3 ? 'bold 36px Inter' : '28px Inter';
        ctx.fillStyle = currentStage === 3 ? '#ff3366' : '#ffffff';
        ctx.shadowBlur = 20; ctx.shadowColor = currentStage === 3 ? '#ff0055' : '#aaffcc';
        ctx.fillText(stageMessageSub, canvas.width/2, canvas.height/2 + 55);
        ctx.restore();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

window.startActionGame = function(organName) {
    resizeCanvas();
    gameRunning = true;
    gameState.levelName = organName;
    document.getElementById('level-title').textContent = organName + ' — Micro Battle';

    player = new Player();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    projectiles = []; enemies = []; enemyProjectiles = [];
    currentStage = 0; enemiesToSpawn = 0; stageEnemiesRemaining = 0;
    stageCompleteScheduled = false; bossSpawnPending = false;

    document.getElementById('game-over-screen').classList.add('hidden');
    gameState.lastTime = performance.now();

    // Start Stage 1 after short delay
    setTimeout(() => startStage(1), 500);

    animationFrameId = requestAnimationFrame(gameLoop);
};

window.stopActionGame = function() {
    gameRunning = false;
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
};

window.skipCurrentStage = function() {
    if (!gameRunning) return;
    enemiesToSpawn = 0;
    stageEnemiesRemaining = 0;
    bossSpawnPending = false;
    stageTransitioning = false;
    stageCompleteScheduled = false;  // Allow checkStageComplete to run
    enemies = [];                     // Immediately clear (not just mark inactive)
    enemyProjectiles = [];
};

window.skipAllStages = function() {
    if (!gameRunning) return;
    currentStage = 3;
    window.skipCurrentStage();
};
