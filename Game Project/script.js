document.addEventListener('DOMContentLoaded', () => {
    // Menu Elements
    const mainMenu = document.getElementById('main-menu');
    const settingsMenu = document.getElementById('settings-menu');
    const gameView = document.getElementById('game-view');
    const cinematicView = document.getElementById('cinematic-view');
    const levelView = document.getElementById('level-view');
    
    // Cinematic Elements
    const cinematicBg = document.getElementById('cinematic-bg');
    const cinematicCharLeft = document.getElementById('cinematic-char-left');
    const cinematicCharRight = document.getElementById('cinematic-char-right');
    const dialogueSpeaker = document.getElementById('dialogue-speaker');
    const dialogueText = document.getElementById('dialogue-text');
    const shrinkFlash = document.getElementById('shrink-flash');

    const cinematicScenes = [
        {
            bg: 'linear-gradient(to bottom, #0a0e17, #161b22)',
            speaker: 'Gani',
            text: "Dr. Şükrü, please, you have to save me... This disease is getting worse.",
            charLeft: 'url("assets/patient_gani.png")',
            charRight: 'url("assets/dr_sukru.png")',
            activeChar: 'left'
        },
        {
            bg: 'linear-gradient(to bottom, #0a0e17, #161b22)',
            speaker: 'Dr. Şükrü',
            text: "Don't worry Gani. This disease is incurable by normal means, but we have an experimental procedure.",
            charLeft: 'url("assets/patient_gani.png")',
            charRight: 'url("assets/dr_sukru.png")',
            activeChar: 'right'
        },
        {
            bg: 'linear-gradient(to bottom, #0a0e17, #161b22)',
            speaker: 'Dr. Şükrü',
            text: "I will pilot the nano-cell directly to the source. Initiating the shrink protocol!",
            charLeft: 'url("assets/patient_gani.png")',
            charRight: 'url("assets/dr_sukru.png")',
            activeChar: 'right'
        },
        {
            bg: 'linear-gradient(to bottom, #111, #333)',
            speaker: 'System',
            text: "WARNING: Shrink protocol initiated. Brace for cellular scaling.",
            charLeft: 'url("assets/patient_gani.png")',
            charRight: 'url("assets/dr_sukru.png")',
            activeChar: 'none',
            shrinkRight: true,
            flash: true
        },
        {
            bg: 'radial-gradient(circle at center, #800000, #330000)',
            speaker: 'Dr. Şükrü',
            text: "Entering the oral cavity now. Hang in there, Gani. I'm beginning the descent into the circulatory system...",
            charLeft: 'url("assets/patient_gani.png")',
            charRight: 'none',
            activeChar: 'none',
            flyIn: true
        },
        {
            bg: 'url("assets/mouth_inside.png")',
            speaker: 'Dr. Şükrü',
            text: "I've successfully entered the oral cavity. The protective nano-bubble is holding steady. Initiating journey to the Stomach.",
            charLeft: 'none',
            charRight: 'none',
            activeChar: 'none',
            showNanoSukru: true
        }
    ];

    let currentScene = 0;
    let typewriterTimeout = null;

    function renderScene() {
        if (currentScene >= cinematicScenes.length) {
            // End of cinematic
            switchView(gameView);
            updateTargetableOrgans();
            showMessage("Arrived at the Mouth. Select a destination to travel.");
            return;
        }

        const scene = cinematicScenes[currentScene];
        cinematicBg.style.backgroundImage = scene.bg;
        dialogueSpeaker.textContent = scene.speaker;
        dialogueText.textContent = '';
        
        // Update Characters
        if (scene.charLeft && scene.charLeft !== 'none') {
            cinematicCharLeft.style.backgroundImage = scene.charLeft;
            cinematicCharLeft.classList.add('show');
            if (scene.activeChar === 'left') {
                cinematicCharLeft.classList.remove('dim');
            } else {
                cinematicCharLeft.classList.add('dim');
            }
        } else {
            cinematicCharLeft.classList.remove('show');
        }

        if (scene.charRight && scene.charRight !== 'none') {
            cinematicCharRight.style.backgroundImage = scene.charRight;
            cinematicCharRight.classList.add('show');
            if (scene.activeChar === 'right') {
                cinematicCharRight.classList.remove('dim');
            } else {
                cinematicCharRight.classList.add('dim');
            }
        } else {
            cinematicCharRight.classList.remove('show');
        }

        if (scene.shrinkRight) {
            cinematicCharRight.classList.add('shrink');
        } else {
            cinematicCharRight.classList.remove('shrink');
        }

        const nanoCell = document.getElementById('nano-cell-anim');
        if (scene.flyIn) {
            nanoCell.classList.add('fly-in');
        } else {
            nanoCell.classList.remove('fly-in');
        }

        const nanoSukru = document.getElementById('nano-sukru-anim');
        if (scene.showNanoSukru) {
            nanoSukru.classList.remove('hidden');
        } else {
            nanoSukru.classList.add('hidden');
        }
        
        // Typewriter effect
        if (typewriterTimeout) clearTimeout(typewriterTimeout);
        let i = 0;
        const txt = scene.text;
        function typeWriter() {
            if (i < txt.length) {
                dialogueText.textContent += txt.charAt(i);
                i++;
                typewriterTimeout = setTimeout(typeWriter, 30); // Speed of typing
            }
        }
        typeWriter();
        
        if (scene.flash) {
            shrinkFlash.classList.add('active');
            setTimeout(() => {
                shrinkFlash.classList.remove('active');
            }, 2000);
        }
    }

    function startCinematic() {
        switchView(cinematicView);
        currentScene = 0;
        renderScene();
    }

    cinematicView.addEventListener('click', () => {
        currentScene++;
        renderScene();
    });

    // Buttons
    const btnPlay = document.getElementById('btn-play');
    const btnSettings = document.getElementById('btn-settings');
    const btnBack = document.getElementById('btn-back');
    
    // Settings toggles
    const toggleSfx = document.getElementById('toggle-sfx');
    const toggleMusic = document.getElementById('toggle-music');
    let sfxEnabled = true;
    let musicEnabled = true;

    // Pause Menu Elements
    const pauseMenu = document.getElementById('pause-menu');
    const btnResume = document.getElementById('btn-resume');
    const btnRestart = document.getElementById('btn-restart');
    const btnLeave = document.getElementById('btn-leave');
    const pauseToggleSfx = document.getElementById('pause-toggle-sfx');
    const pauseToggleMusic = document.getElementById('pause-toggle-music');
    let isPaused = false;

    // View Switching Logic
    function switchView(showView) {
        mainMenu.classList.replace('active', 'hidden');
        settingsMenu.classList.replace('active', 'hidden');
        gameView.classList.replace('active', 'hidden');
        cinematicView.classList.replace('active', 'hidden');
        levelView.classList.replace('active', 'hidden');
        showView.classList.replace('hidden', 'active');
    }

    btnPlay.addEventListener('click', () => {
        startCinematic();
    });

    btnSettings.addEventListener('click', () => {
        switchView(settingsMenu);
    });

    btnBack.addEventListener('click', () => {
        switchView(mainMenu);
    });

    // Settings Logic
    toggleSfx.addEventListener('change', (e) => {
        sfxEnabled = e.target.checked;
        if (pauseToggleSfx) pauseToggleSfx.checked = sfxEnabled;
    });

    toggleMusic.addEventListener('change', (e) => {
        musicEnabled = e.target.checked;
        if (pauseToggleMusic) pauseToggleMusic.checked = musicEnabled;
    });

    // Pause Menu Logic
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameView.classList.contains('active')) {
            togglePause();
        }
    });

    function togglePause() {
        if (!pauseMenu) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseMenu.classList.replace('hidden', 'active');
        } else {
            pauseMenu.classList.replace('active', 'hidden');
        }
    }

    if (btnResume) btnResume.addEventListener('click', togglePause);

    function resetGameState() {
        currentLocation = 'Mouth';
        currentLocationEl.textContent = 'Mouth';
        player.setAttribute('transform', 'translate(410, 118)'); 
        updateTargetableOrgans();
        showMessage("Game restarted. Starting at the Mouth.");
        infoTitle.textContent = "Hover over an organ";
        infoDesc.textContent = "Detailed biochemistry information will appear here.";
        infoTravel.textContent = "";
        isMoving = false;
        showCurrentLocationInfo();
    }

    if (btnRestart) btnRestart.addEventListener('click', () => {
        resetGameState();
        if (isPaused) togglePause();
        startCinematic();
    });

    if (btnLeave) btnLeave.addEventListener('click', () => {
        resetGameState();
        if (isPaused) togglePause();
        switchView(mainMenu);
    });

    if (pauseToggleSfx) pauseToggleSfx.addEventListener('change', (e) => {
        sfxEnabled = e.target.checked;
        toggleSfx.checked = sfxEnabled;
    });

    if (pauseToggleMusic) pauseToggleMusic.addEventListener('change', (e) => {
        musicEnabled = e.target.checked;
        toggleMusic.checked = musicEnabled;
    });

    const organs = document.querySelectorAll('.organ');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const infoTravel = document.getElementById('info-travel');
    const btnEnterLevel = document.getElementById('btn-enter-level');
    
    // Player State
    const player = document.getElementById('player-character');
    const currentLocationEl = document.getElementById('current-location');
    const systemMessageEl = document.getElementById('system-message');
    let currentLocation = 'Mouth'; // Changed starting point
    let isMoving = false;

    // Build Adjacency List for the graph
    const graph = {
        'Mouth': { 'Stomach': 'path-Mouth-Stomach' },
        'Heart': {
            'Brain': 'path-Heart-Brain',
            'LeftLung': 'path-Heart-LeftLung',
            'RightLung': 'path-Heart-RightLung',
            'Liver': 'path-Heart-Liver',
            'Stomach': 'path-Heart-Stomach',
            'LeftKidney': 'path-Heart-LeftKidney',
            'RightKidney': 'path-Heart-RightKidney',
            'Intestines': 'path-Heart-Intestines'
        },
        'Brain': { 'Heart': 'path-Brain-Heart' },
        'LeftLung': { 'Heart': 'path-LeftLung-Heart' },
        'RightLung': { 'Heart': 'path-RightLung-Heart' },
        'Liver': { 'Heart': 'path-Liver-Heart' },
        'Stomach': { 
            'Heart': 'path-Stomach-Heart',
            'Mouth': 'path-Stomach-Mouth',
            'Pancreas': 'path-Stomach-Pancreas',
            'Spleen': 'path-Stomach-Spleen'
        },
        'Pancreas': { 'Liver': 'path-Pancreas-Liver' },
        'Spleen': { 'Liver': 'path-Spleen-Liver' },
        'LeftKidney': { 
            'Heart': 'path-LeftKidney-Heart',
            'Bladder': 'path-LeftKidney-Bladder'
        },
        'RightKidney': { 
            'Heart': 'path-RightKidney-Heart',
            'Bladder': 'path-RightKidney-Bladder'
        },
        'Bladder': { 'Heart': 'path-Bladder-Heart' },
        'Intestines': { 'Liver': 'path-Intestines-Liver' }
    };

    // Initialize Map visual state
    updateTargetableOrgans();

    function showCurrentLocationInfo() {
        const currentOrgan = document.getElementById('organ-' + currentLocation);
        if (currentOrgan) {
            infoTitle.textContent = currentOrgan.getAttribute('data-name');
            infoDesc.textContent = currentOrgan.getAttribute('data-desc');
            infoTravel.textContent = "You are currently here.";
            infoTravel.style.color = "#66ff66";
            btnEnterLevel.classList.remove('hidden');
        }
    }

    showCurrentLocationInfo();

    function updateTargetableOrgans() {
        organs.forEach(o => o.classList.remove('targetable'));
        const availableTargets = graph[currentLocation];
        if (availableTargets) {
            Object.keys(availableTargets).forEach(targetName => {
                const organEl = document.getElementById('organ-' + targetName);
                if (organEl) organEl.classList.add('targetable');
            });
        }
    }

    function showMessage(msg, isError = false) {
        systemMessageEl.textContent = msg;
        if (isError) {
            systemMessageEl.classList.add('error');
            setTimeout(() => systemMessageEl.classList.remove('error'), 2000);
        }
    }

    // Hover Interaction -> Updates Fixed Panel
    organs.forEach(organ => {
        organ.addEventListener('mouseenter', (e) => {
            const name = organ.getAttribute('data-name');
            const desc = organ.getAttribute('data-desc');
            const targetID = organ.id.replace('organ-', '');
            
            // Update Right Panel
            infoTitle.textContent = name;
            infoDesc.textContent = desc;
            
            // Check travel status for this hovered organ
            if (targetID === currentLocation) {
                infoTravel.textContent = "You are currently here.";
                infoTravel.style.color = "#66ff66";
                btnEnterLevel.classList.remove('hidden');
            } else if (graph[currentLocation] && graph[currentLocation][targetID]) {
                infoTravel.textContent = "Click to travel here.";
                infoTravel.style.color = "#3388ff";
                btnEnterLevel.classList.add('hidden');
            } else {
                infoTravel.textContent = "No direct connection from current location.";
                infoTravel.style.color = "#ff6666";
                btnEnterLevel.classList.add('hidden');
            }

            organ.classList.add('active');
        });

        organ.addEventListener('mouseleave', () => {
            organ.classList.remove('active');
            
            // Revert back to the current location's info
            if (!isMoving) {
                showCurrentLocationInfo();
            }
        });

        // Click Interaction: Travel
        organ.addEventListener('click', () => {
            if (isMoving) return;

            const targetID = organ.id.replace('organ-', '');
            const targetName = organ.getAttribute('data-name');

            if (targetID === currentLocation) {
                showMessage(`You are already at the ${targetName}.`, true);
                return;
            }

            const connections = graph[currentLocation];
            if (connections && connections[targetID]) {
                const pathId = connections[targetID];
                movePlayer(pathId, targetID, targetName);
            } else {
                showMessage(`No direct vein/artery from ${currentLocation} to ${targetName}.`, true);
            }
        });
    });

    // Movement Logic
    function movePlayer(pathId, targetID, targetName) {
        const pathElement = document.getElementById(pathId);
        if (!pathElement) return;

        isMoving = true;
        showMessage(`Traveling to ${targetName}...`);
        
        // Remove targetable highlights
        organs.forEach(o => o.classList.remove('targetable'));

        const pathLength = pathElement.getTotalLength();
        const playerAnimDuration = 800;
        let startTime = null;

        function animateMove(currentTime) {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / playerAnimDuration, 1);

            // Easing
            const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentPoint = pathElement.getPointAtLength(easeProgress * pathLength);
            
            player.setAttribute('transform', `translate(${currentPoint.x}, ${currentPoint.y})`);

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            } else {
                isMoving = false;
                currentLocation = targetID;
                currentLocationEl.textContent = targetName;
                showMessage(`Arrived at ${targetName}.`);
                updateTargetableOrgans();
                
                
                // Update panel explicitly after moving
                showCurrentLocationInfo();
            }
        }

        requestAnimationFrame(animateMove);
    }

    // Action Game Entry
    btnEnterLevel.addEventListener('click', () => {
        switchView(levelView);
        // Start the Action RPG Engine for the current organ
        if (window.startActionGame) {
            window.startActionGame(currentLocation);
        }
    });

    const btnExitLevel = document.getElementById('btn-exit-level');
    if (btnExitLevel) {
        btnExitLevel.addEventListener('click', () => {
            switchView(gameView);
            if (window.stopActionGame) {
                window.stopActionGame();
            }
            updateTargetableOrgans();
            showMessage(`Returned to map at ${currentLocationEl.textContent}.`);
        });
    }
});
