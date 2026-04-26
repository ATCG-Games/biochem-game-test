// Stomach Stabilization Mini-game Logic
class StomachGame {
    constructor() {
        this.ph = 2.0; // Current pH
        this.mucus = 100; // 0-100%
        this.integrity = 100; // 0-100%
        this.progress = 0; // 0-100%
        
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        
        this.targetPhMin = 1.5;
        this.targetPhMax = 3.5;
        
        // Dom Elements
        this.phValueEl = document.getElementById('ph-value');
        this.phMarkerEl = document.getElementById('ph-marker');
        this.mucusFillEl = document.getElementById('mucus-fill');
        this.mucusValueEl = document.getElementById('mucus-value');
        this.integrityFillEl = document.getElementById('integrity-fill');
        this.integrityValueEl = document.getElementById('integrity-value');
        this.digestionFillEl = document.getElementById('digestion-fill');
        this.digestionValueEl = document.getElementById('digestion-value');
        this.feedbackEl = document.getElementById('stomach-feedback');
        this.instructionsEl = document.getElementById('stomach-instructions');
        this.gameUiEl = document.getElementById('stomach-game-ui');
        this.pauseMenuEl = document.getElementById('stomach-pause-menu');

        // Buttons
        document.getElementById('btn-add-acid').addEventListener('click', () => this.addAcid());
        document.getElementById('btn-add-buffer').addEventListener('click', () => this.addBuffer());
        document.getElementById('btn-secret-mucus').addEventListener('click', () => this.secretMucus());
        document.getElementById('btn-start-stomach').addEventListener('click', () => this.beginGame());

        // Pause Menu Buttons
        document.getElementById('btn-stomach-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-stomach-skip').addEventListener('click', () => this.onWin());
        document.getElementById('btn-stomach-exit').addEventListener('click', () => {
            this.stop();
            if (window.switchView && window.gameView) window.switchView(window.gameView);
        });

        window.addEventListener('keydown', (e) => {
            if (this.running && e.key === 'Escape') {
                this.togglePause();
            }
        });
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseMenuEl.classList.remove('hidden');
        } else {
            this.pauseMenuEl.classList.add('hidden');
            this.lastTime = performance.now(); // Reset time to avoid jump
        }
    }

    start() {
        this.ph = 5.5; // Start unbalanced (more basic)
        this.mucus = 65;
        this.integrity = 100;
        this.progress = 0;
        this.running = false;
        this.paused = false;
        
        // Show instructions, hide game UI and pause menu
        this.instructionsEl.classList.remove('hidden');
        this.pauseMenuEl.classList.add('hidden');
        this.gameUiEl.style.opacity = '0.3';
        this.gameUiEl.style.pointerEvents = 'none';
        
        this.updateUI();
    }

    beginGame() {
        this.instructionsEl.classList.add('hidden');
        this.gameUiEl.style.opacity = '1';
        this.gameUiEl.style.pointerEvents = 'all';
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    addAcid() {
        if (!this.running) return;
        this.ph = Math.max(1.0, this.ph - 0.5);
        this.showFeedback("HCl Added!", "#ff4d4d");
        this.updateUI();
    }

    addBuffer() {
        if (!this.running) return;
        this.ph = Math.min(7.0, this.ph + 0.5);
        this.showFeedback("Bicarbonate Added!", "#3388ff");
        this.updateUI();
    }

    secretMucus() {
        if (!this.running) return;
        this.mucus = Math.min(100, this.mucus + 15);
        this.showFeedback("Mucus Secreted!", "#66ff66");
        this.updateUI();
    }

    showFeedback(text, color) {
        this.feedbackEl.textContent = text;
        this.feedbackEl.style.color = color;
        this.feedbackEl.style.opacity = 1;
        setTimeout(() => {
            if (this.feedbackEl.textContent === text) {
                this.feedbackEl.style.opacity = 0;
            }
        }, 1000);
    }

    update(dt) {
        if (!this.running || this.paused) return;

        // pH natural drift (towards neutral)
        this.ph += 0.05 * dt;

        // Mucus natural depletion
        this.mucus -= 2 * dt;

        // Integrity damage if pH is too low and mucus is low
        if (this.ph < 1.5) {
            const damageMult = (100 - this.mucus) / 50;
            this.integrity -= (2 + damageMult) * dt;
        }

        // Integrity damage if pH is too high (pathogen growth)
        if (this.ph > 4.0) {
            this.integrity -= 1.5 * dt;
        }

        // Progress increases ONLY if pH is in target range
        if (this.ph >= this.targetPhMin && this.ph <= this.targetPhMax) {
            this.progress += 2.5 * dt; // ~40 seconds to win
        } else {
            this.progress -= 0.5 * dt; // Penalize wrong range
        }

        this.progress = Math.max(0, Math.min(100, this.progress));
        this.integrity = Math.max(0, this.integrity);
        this.mucus = Math.max(0, this.mucus);

        if (this.integrity <= 0) {
            this.onGameOver();
        }

        if (this.progress >= 100) {
            this.onWin();
        }

        this.updateUI();
    }

    updateUI() {
        // pH Marker (1.0 to 7.0 mapping to 0% to 100%)
        const phPos = ((this.ph - 1.0) / 6.0) * 100;
        this.phMarkerEl.style.left = `${phPos}%`;
        this.phValueEl.textContent = this.ph.toFixed(1);
        
        // Color based on range
        if (this.ph >= this.targetPhMin && this.ph <= this.targetPhMax) {
            this.phValueEl.style.color = "#66ff66";
        } else if (this.ph < 1.5) {
            this.phValueEl.style.color = "#ff4d4d"; // Too Acidic
        } else {
            this.phValueEl.style.color = "#3388ff"; // Too Basic
        }

        this.mucusFillEl.style.width = `${this.mucus}%`;
        this.mucusValueEl.textContent = `${Math.round(this.mucus)}%`;

        this.integrityFillEl.style.width = `${this.integrity}%`;
        this.integrityValueEl.textContent = `${Math.round(this.integrity)}%`;
        
        // Change integrity color based on health
        if (this.integrity > 60) this.integrityFillEl.style.background = "#66ff66";
        else if (this.integrity > 30) this.integrityFillEl.style.background = "#ffca28";
        else this.integrityFillEl.style.background = "#ff4d4d";

        this.digestionFillEl.style.width = `${this.progress}%`;
        this.digestionValueEl.textContent = `${Math.round(this.progress)}%`;
    }

    onWin() {
        this.running = false;
        if (window.onStomachStabilized) {
            window.onStomachStabilized();
        }
    }

    onGameOver() {
        this.running = false;
        // Simple alert for now, can be improved
        alert("CRITICAL FAILURE: Stomach lining destroyed by acid imbalance!");
        // Reset or exit
        if (window.switchView && window.gameView) window.switchView(window.gameView);
    }

    loop(timestamp) {
        if (!this.running) return;
        if (this.paused) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.update(dt);
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.StomachGame = new StomachGame();
