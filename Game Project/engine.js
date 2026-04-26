// Game Engine for Vampire Survivors-style combat
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let isMouseDown = false;
const mousePos = { x: 0, y: 0 };

function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    // Calculate scale in case canvas CSS size differs from internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
}

canvas.addEventListener('mousemove', updateMousePos);

// Prevent dragging/selection issues on canvas
canvas.addEventListener('mousedown', (e) => { 
    e.preventDefault(); 
    if (e.button === 0) {
        isMouseDown = true; // Left click
        updateMousePos(e);
    }
});
window.addEventListener('mouseup', (e) => { 
    if (e.button === 0) isMouseDown = false; 
});
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });

let animationFrameId = null;
let gameRunning = false;

// Game State
const gameState = {
    levelName: '',
    timeElapsed: 0,
    lastTime: 0
};

// Input State
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.speed = 800; // Fast projectile
        this.radius = 6;
        this.color = '#66ff66';
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const length = Math.sqrt(dx*dx + dy*dy) || 1;
        
        this.vx = (dx / length) * this.speed;
        this.vy = (dy / length) * this.speed;
        this.active = true;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Remove if off screen
        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

let projectiles = [];
let enemies = [];
let enemyProjectiles = [];
let spawnTimer = 0;
let nextSpawnInterval = 1.0;
const XP_THRESHOLDS = [0, 100, 300, 600];

class EnemyProjectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.speed = 300;
        this.radius = 4;
        this.color = '#ff6666';
        const dx = targetX - x;
        const dy = targetY - y;
        const length = Math.sqrt(dx*dx + dy*dy) || 1;
        this.vx = (dx / length) * this.speed;
        this.vy = (dy / length) * this.speed;
        this.active = true;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) this.active = false;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        const bonusHp = Math.floor(Math.random() * level);
        this.maxHp = Math.floor(Math.random() * 5) + 1 + bonusHp; // 1 to 5 + bonus
        this.hp = this.maxHp;
        this.radius = 12 + this.maxHp * 3; // scales with HP
        this.speed = Math.max(30, 120 - (this.maxHp * 12) + (level * 10)); // larger are slower
        this.color = '#ff3333';
        this.active = true;
    }
    
    update(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        
        // Player collision
        if (dist < this.radius + player.width/2 && player.invulnerable <= 0) {
            player.hp -= 10; // Deal 10 damage
            player.invulnerable = 1.0; // 1 second invulnerability
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Spiky look for microbes
        for(let i=0; i<12; i++) {
            const angle = (i/12) * Math.PI * 2;
            const spikeDist = i % 2 === 0 ? this.radius + 6 : this.radius;
            const spikeX = this.x + Math.cos(angle) * spikeDist;
            const spikeY = this.y + Math.sin(angle) * spikeDist;
            if (i === 0) ctx.moveTo(spikeX, spikeY);
            else ctx.lineTo(spikeX, spikeY);
        }
        ctx.closePath();
        ctx.fill();
        
        // HP bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 10, this.y - this.radius - 12, 20, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - 10, this.y - this.radius - 12, 20 * (this.hp / this.maxHp), 4);
        }
    }
}

class ShootingEnemy extends Enemy {
    constructor(x, y, level) {
        super(x, y, level);
        this.color = '#cc33ff'; // Purple color for shooters
        this.fireTimer = 0;
        this.fireRate = 2.0; // Fire every 2 seconds
        this.stopDistance = 250; // Stop and shoot when this close
    }
    
    update(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        if (dist > this.stopDistance) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else {
            this.fireTimer += dt;
            if (this.fireTimer >= this.fireRate) {
                this.fireTimer = 0;
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, player.x, player.y));
            }
        }
        
        // Player collision
        if (dist < this.radius + player.width/2 && player.invulnerable <= 0) {
            player.hp -= 10;
            player.invulnerable = 1.0;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

// Player Class
class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = 450; // pixels per second
        this.maxHp = 100;
        this.hp = 100;
        this.level = 1;
        this.xp = 0;
        this.width = 48;
        this.height = 48;
        this.sprite = new Image();
        this.sprite.src = 'assets/dr_sukru.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
        this.fireRate = 0.15; // Fire every 0.15s
        this.fireTimer = 0;
        this.invulnerable = 0;
    }

    update(dt) {
        let dx = 0;
        let dy = 0;

        if (keys.w || keys.ArrowUp) dy -= 1;
        if (keys.s || keys.ArrowDown) dy += 1;
        if (keys.a || keys.ArrowLeft) dx -= 1;
        if (keys.d || keys.ArrowRight) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx*dx + dy*dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        // Keep player in bounds
        this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y));

        if (this.invulnerable > 0) {
            this.invulnerable -= dt;
        }

        // Fire towards mouse when clicked
        this.fireTimer += dt;
        if (isMouseDown && this.fireTimer >= this.fireRate) {
            this.fireTimer = 0;
            // Shoot from center of player to mouse
            projectiles.push(new Projectile(this.x, this.y, mousePos.x, mousePos.y));
        } else if (!isMouseDown && this.fireTimer > this.fireRate) {
            this.fireTimer = this.fireRate; // Ready to fire immediately on click
        }
    }

    draw(ctx) {
        const radius = this.width / 2;
        
        // Draw Nano-Bubble
        ctx.fillStyle = 'rgba(102, 255, 102, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#66ff66';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Sprite inside the bubble
        if (this.spriteLoaded) {
            const imgW = 30; // Scale sprite appropriately for the circle
            const imgH = 38;
            
            ctx.save();
            if (this.invulnerable > 0) {
                // Blink effect
                ctx.globalAlpha = Math.sin(performance.now() * 0.02) * 0.5 + 0.5;
            }
            ctx.drawImage(this.sprite, this.x - imgW/2, this.y - imgH/2, imgW, imgH);
            ctx.restore();
        }
    }
}

let player = new Player();

// Main Game Loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (!gameState.lastTime) gameState.lastTime = timestamp;
    const dt = (timestamp - gameState.lastTime) / 1000; // delta time in seconds
    gameState.lastTime = timestamp;

    update(dt);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Organic Background Particles
class BackgroundParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // initial random spread
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.size = Math.random() * 15 + 5;
        this.speed = Math.random() * 20 + 10;
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    
    update(dt) {
        this.y += this.speed * dt;
        if (this.y > canvas.height + 50) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = `rgba(150, 20, 20, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let bgParticles = [];
for (let i = 0; i < 50; i++) {
    bgParticles.push(new BackgroundParticle());
}

function checkLevelUp() {
    if (player.level < 4 && player.xp >= XP_THRESHOLDS[player.level]) {
        player.level++;
        player.hp = Math.min(player.maxHp, player.hp + 20); // Heal on level up
        
        const levelSpan = document.getElementById('player-level');
        if (levelSpan) levelSpan.textContent = player.level;

        if (player.level >= 4) {
            // YOU WIN
            gameRunning = false;
            const gameOverScreen = document.getElementById('game-over-screen');
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.querySelector('h1').textContent = "YOU WIN!";
            gameOverScreen.querySelector('h1').style.color = "#66ff66";
            const btn = document.getElementById('btn-respawn');
            btn.textContent = "Return to Map";
            btn.onclick = function() {
                gameOverScreen.classList.add('hidden');
                document.getElementById('level-view').classList.remove('active');
                document.getElementById('level-view').classList.add('hidden');
                document.getElementById('game-view').classList.remove('hidden');
                document.getElementById('game-view').classList.add('active');
                
                // Restore original button for future deaths
                gameOverScreen.querySelector('h1').textContent = "YOU DIED";
                gameOverScreen.querySelector('h1').style.color = "#ff3333";
                btn.textContent = "Respawn at Heart";
                btn.onclick = () => location.reload(); 
            };
        }
    }
}

function update(dt) {
    player.update(dt);
    
    // Spawn enemies if in Mouth
    if (gameState.levelName === 'Mouth') {
        spawnTimer += dt;
        if (spawnTimer >= nextSpawnInterval) {
            spawnTimer = 0;
            nextSpawnInterval = ((Math.random() * 1.5) + 0.2) / player.level; 
            
            // Spawn from outside the screen (360 degrees)
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.max(canvas.width, canvas.height) / 2 + 100;
            const spawnX = player.x + Math.cos(angle) * distance;
            const spawnY = player.y + Math.sin(angle) * distance;
            
            if (player.level >= 2 && Math.random() < 0.3) {
                enemies.push(new ShootingEnemy(spawnX, spawnY, player.level));
            } else {
                enemies.push(new Enemy(spawnX, spawnY, player.level));
            }
        }
    }
    
    bgParticles.forEach(p => p.update(dt));
    
    projectiles.forEach(p => p.update(dt));
    enemies.forEach(e => e.update(dt, player));
    enemyProjectiles.forEach(p => p.update(dt));
    
    // Enemy Projectile Collision with player
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < p.radius + player.width/2) {
            p.active = false;
            if (player.invulnerable <= 0) {
                player.hp -= 5;
                player.invulnerable = 1.0;
            }
        }
    }
    
    // Collisions: Projectile vs Enemy
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < p.radius + e.radius) {
                // Hit
                p.active = false;
                e.hp -= 1;
                if (e.hp <= 0) {
                    e.active = false;
                    player.xp += e.maxHp * 10;
                    checkLevelUp();
                }
                break; // One projectile hits one enemy
            }
        }
    }
    
    projectiles = projectiles.filter(p => p.active);
    enemies = enemies.filter(e => e.active);
    enemyProjectiles = enemyProjectiles.filter(p => p.active);
    
    // Update UI
    const hpFill = document.getElementById('player-hp-fill');
    if (hpFill) {
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        hpFill.style.width = hpPercent + '%';
    }
    const xpSpan = document.getElementById('player-xp');
    if (xpSpan) xpSpan.textContent = player.xp;

    // Check Player Death
    if (player.hp <= 0 && gameRunning) {
        gameRunning = false;
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('hidden');
        const btn = document.getElementById('btn-respawn');
        btn.onclick = () => location.reload();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Organic Radial Gradient Background
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 100,
        canvas.width/2, canvas.height/2, canvas.width
    );
    
    // Adjust background color based on organ (example)
    if (gameState.levelName === 'Stomach') {
        gradient.addColorStop(0, '#4a2500'); // more yellowish/brown acid
        gradient.addColorStop(1, '#1a0a00');
    } else {
        gradient.addColorStop(0, '#3a0a0a');
        gradient.addColorStop(1, '#100000');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floating particles
    bgParticles.forEach(p => p.draw(ctx));

    // Draw grid for perspective (made subtle)
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.05)';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.width; i+=100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let i = 0; i < canvas.height; i+=100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw projectiles
    projectiles.forEach(p => p.draw(ctx));

    // Draw enemies
    enemies.forEach(e => e.draw(ctx));

    // Draw enemy projectiles
    enemyProjectiles.forEach(p => p.draw(ctx));

    // Draw entities
    player.draw(ctx);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

// Global Start/Stop functions
window.startActionGame = function(organName) {
    resizeCanvas();
    gameRunning = true;
    gameState.levelName = organName;
    document.getElementById('level-title').textContent = organName + ' Battle';
    
    // Reset player
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.hp = player.maxHp;
    player.invulnerable = 0;
    player.level = 1;
    player.xp = 0;
    projectiles = []; // Clear old projectiles
    enemies = []; // Clear old enemies
    enemyProjectiles = [];
    spawnTimer = 0;
    
    document.getElementById('player-level').textContent = "1";
    document.getElementById('player-xp').textContent = "0";
    document.getElementById('game-over-screen').classList.add('hidden');
    
    gameState.lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
};

window.stopActionGame = function() {
    gameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
};
