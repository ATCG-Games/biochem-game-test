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

    let isPreBattleCinematic = false; // declared here so the click handler can see it

    function startCinematic() {
        isPreBattleCinematic = false;
        switchView(cinematicView);
        currentScene = 0;
        renderScene();
    }

    cinematicView.addEventListener('click', () => {
        if (isPreBattleCinematic) {
            preBattleSceneIndex++;
            renderPreBattleScene();
        } else {
            currentScene++;
            renderScene();
        }
    });

    // Buttons
    const btnPlay = document.getElementById('btn-play');
    const btnSettings = document.getElementById('btn-settings');
    const btnBack = document.getElementById('btn-back');
    
    let sfxEnabled = true;
    let musicEnabled = true;

    // Map Pause Elements
    const mapPauseMenu = document.getElementById('map-pause-menu');
    const btnMapResume = document.getElementById('btn-map-resume');
    const btnMapExit = document.getElementById('btn-map-exit');
    let isMapPaused = false;

    function toggleMapPause() {
        if (!mapPauseMenu) return;
        isMapPaused = !isMapPaused;
        if (isMapPaused) {
            mapPauseMenu.classList.remove('hidden');
        } else {
            mapPauseMenu.classList.add('hidden');
        }
    }

    function exitToMainMenu() {
        isMapPaused = false;
        if (mapPauseMenu) mapPauseMenu.classList.add('hidden');
        switchView(mainMenu);
        // Reset any temporary state if needed
    }

    if (btnMapResume) btnMapResume.addEventListener('click', toggleMapPause);
    if (btnMapExit) btnMapExit.addEventListener('click', exitToMainMenu);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Only trigger map pause if we are in game-view or cinematic-view
            // and NOT in a mini-game (those have their own Esc handlers)
            const isGameActive = !gameView.classList.contains('hidden');
            const isCinematicActive = !cinematicView.classList.contains('hidden');
            const isLevelActive = !levelView.classList.contains('hidden');
            const isEsoActive = !document.getElementById('esophagus-view').classList.contains('hidden');
            const isStomachActive = !document.getElementById('stomach-view').classList.contains('hidden');

            if ((isGameActive || isCinematicActive) && !isLevelActive && !isEsoActive && !isStomachActive) {
                toggleMapPause();
            }
        }
    });

    // View Switching Logic
    const allViews = document.querySelectorAll('.view');
    function switchView(showView) {
        allViews.forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        showView.classList.remove('hidden');
        showView.classList.add('active');
    }
    window.switchView = switchView; // Make globally accessible
    window.gameView = gameView;

    btnPlay.addEventListener('click', () => { 
        freeRoam = false;
        document.getElementById('objective-panel').classList.remove('hidden');
        startCinematic(); 
    });
    
    document.getElementById('btn-view-body').addEventListener('click', () => {
        freeRoam = true;
        currentLocation = 'Mouth';
        // Reset player pos
        player.setAttribute('transform', `translate(410, 118)`);
        switchView(gameView);
        document.getElementById('objective-panel').classList.add('hidden');
        updateTargetableOrgans();
        showCurrentLocationInfo();
        showMessage("Free Roam Mode: Explore the circulatory system freely.");
    });

    btnSettings.addEventListener('click', () => { switchView(settingsMenu); });
    btnBack.addEventListener('click', () => { switchView(mainMenu); });

    // Settings Logic
    const toggleSfx = document.getElementById('toggle-sfx');
    const toggleMusic = document.getElementById('toggle-music');
    if (toggleSfx) toggleSfx.addEventListener('change', (e) => { sfxEnabled = e.target.checked; });
    if (toggleMusic) toggleMusic.addEventListener('change', (e) => { musicEnabled = e.target.checked; });

    const organs = document.querySelectorAll('.organ');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const infoTravel = document.getElementById('info-travel');
    const btnEnterLevel = document.getElementById('btn-enter-level');
    
    // ---- OBJECTIVE TRACKING ----
    const completedOrgans = new Set();
    let freeRoam = false;

    function showObjectiveToast() {
        const toast = document.getElementById('objective-toast');
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function showFreeRoamAlert() {
        const alertEl = document.getElementById('free-roam-alert');
        if (!alertEl) return;
        alertEl.style.opacity = '1';
        alertEl.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
            alertEl.style.opacity = '0';
            alertEl.style.transform = 'translate(-50%, -50%) scale(0.85)';
        }, 3000);
    }

    function markObjectiveComplete(organName) {
        completedOrgans.add(organName);
        if (organName === 'Mouth') {
            const el = document.getElementById('objective-mouth');
            if (el) {
                el.classList.add('completed');
                const icon = el.querySelector('.objective-icon');
                if (icon) icon.textContent = '✓';
            }
            // Unlock next objective
            const nextObj = document.getElementById('objective-stomach');
            if (nextObj) nextObj.classList.remove('locked');
            
            // Relabel button at Mouth
            if (currentLocation === 'Mouth') {
                btnEnterLevel.textContent = "Enter the Esophagus";
            }
        } else if (organName === 'Stomach') {
            const el = document.getElementById('objective-stomach');
            if (el) {
                el.classList.add('completed');
                const icon = el.querySelector('.objective-icon');
                if (icon) icon.textContent = '✓';
            }
            // Unlock Objective 3
            const nextObj = document.getElementById('objective-stabilize');
            if (nextObj) nextObj.classList.remove('locked');
        } else if (organName === 'Stabilize') {
            const el = document.getElementById('objective-stabilize');
            if (el) {
                el.classList.add('completed');
                const icon = el.querySelector('.objective-icon');
                if (icon) icon.textContent = '✓';
            }
            // Relabel button at Stomach
            if (currentLocation === 'Stomach') {
                btnEnterLevel.textContent = "Enter the Intestines";
            }
        }
    }

    function canEnterOrgan(organName) {
        if (freeRoam) return true;
        
        // Mouth is always allowed for Objective 1
        if (organName === 'Mouth') return true;
        
        // For others, Obj 1 (Mouth) must be complete
        if (!completedOrgans.has('Mouth')) return false;

        // If trying to enter anything other than Stomach after Mouth, 
        // they must have reached Stomach (Obj 2 done)
        if (organName !== 'Stomach' && !completedOrgans.has('Stomach')) return false;

        return true;
    }

    // Called by engine.js after winning a level
    window.onOrganComplete = function(organName) {
        markObjectiveComplete(organName);
    };

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

    function showLockToast() {
        const toast = document.getElementById('objective-toast');
        if (!toast) return;
        toast.innerHTML = '⚠️ Complete the current objective first.<br><span style="font-size:0.9rem;color:#ffaa33;">The path is blocked by cellular debris.</span>';
        toast.style.borderColor = 'rgba(255, 170, 51, 0.4)';
        toast.style.color = '#ffaa33';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
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
                
                // Update button text based on state
                if (targetID === 'Mouth' && completedOrgans.has('Mouth') && !completedOrgans.has('Stomach')) {
                    btnEnterLevel.textContent = "Enter the Esophagus";
                } else if (targetID === 'Stomach' && completedOrgans.has('Stomach') && !completedOrgans.has('Stabilize')) {
                    btnEnterLevel.textContent = "Stabilize Stomach";
                } else if (targetID === 'Stomach' && completedOrgans.has('Stabilize')) {
                    btnEnterLevel.textContent = "Enter the Intestines";
                } else {
                    btnEnterLevel.textContent = "Enter Organ";
                }
            } else if (graph[currentLocation] && graph[currentLocation][targetID]) {
                if (!canEnterOrgan(targetID)) {
                    infoTravel.textContent = "Locked: Complete previous objectives.";
                    infoTravel.style.color = "#ffaa33";
                } else {
                    infoTravel.textContent = "Click to travel here.";
                    infoTravel.style.color = "#3388ff";
                }
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

            if (!canEnterOrgan(targetID)) {
                showLockToast();
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
        let interrupted = false;

        function animateMove(currentTime) {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / playerAnimDuration, 1);

            // Easing
            const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Interruption check: Mouth -> Stomach at 25% (Not in Free Roam)
            if (!freeRoam && currentLocation === 'Mouth' && targetID === 'Stomach' && easeProgress >= 0.25 && !interrupted) {
                interrupted = true;
                showMidTravelInterruption();
                return; // Stop animation loop
            }

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
                showCurrentLocationInfo();
            }
        }

        requestAnimationFrame(animateMove);
    }

    // ---- PRE-BATTLE CINEMATIC DATA ----
    const preBattleScenes = {
        'Mouth': [
            {
                bg: 'url("assets/mouth_inside.png")',
                speaker: 'Dr. Şükrü',
                text: "We've entered the oral cavity. The protective nano-bubble is holding steady — but I'm detecting foreign pathogen signatures all around us.",
                charLeft: 'none',
                charRight: 'none',
                activeChar: 'none',
                showNanoSukru: true
            },
            {
                bg: 'url("assets/mouth_inside.png")',
                speaker: 'Gani',
                text: "Doctor, can you hear me? My throat feels like it's on fire... Are you inside?",
                charLeft: 'url("assets/patient_gani.png")',
                charRight: 'none',
                activeChar: 'left',
                showNanoSukru: false
            },
            {
                bg: 'url("assets/mouth_inside.png")',
                speaker: 'Dr. Şükrü',
                text: "Loud and clear, Gani. The mouth is infested — bacteria and viral particles are multiplying fast. I need to clear them out before moving deeper.",
                charLeft: 'url("assets/patient_gani.png")',
                charRight: 'none',
                activeChar: 'none',
                showNanoSukru: true
            },
            {
                bg: 'url("assets/mouth_inside.png")',
                speaker: 'System',
                text: "MISSION: Eliminate all oral pathogens. Initiating nano-cell combat mode.",
                charLeft: 'none',
                charRight: 'none',
                activeChar: 'none',
                showNanoSukru: false,
                flash: true
            }
        ],
        'Stomach': [
            {
                bg: 'radial-gradient(circle at center, #800000, #330000)',
                speaker: 'Dr. Şükrü',
                text: "We've reached the stomach, Gani. But it's in chaos. The acid levels are spiking, and the protective mucus barrier is thinning.",
                charLeft: 'url("assets/patient_gani.png")',
                charRight: 'none',
                activeChar: 'none',
                showNanoSukru: true
            },
            {
                bg: 'radial-gradient(circle at center, #800000, #330000)',
                speaker: 'Dr. Şükrü',
                text: "The stomach must maintain a very specific pH balance (around 1.5 - 3.5). If it's too acidic, the wall dissolves. If it's too basic, pathogens survive and enzymes fail.",
                charLeft: 'none',
                charRight: 'url("assets/dr_sukru.png")',
                activeChar: 'right',
                showNanoSukru: false
            },
            {
                bg: 'radial-gradient(circle at center, #800000, #330000)',
                speaker: 'Dr. Şükrü',
                text: "Protein digestion depends on Pepsin, which ONLY works in this acidic sweet spot. We must balance HCl, Bicarbonate buffers, and Mucus secretion to stabilize the environment.",
                charLeft: 'url("assets/patient_gani.png")',
                charRight: 'url("assets/dr_sukru.png")',
                activeChar: 'none',
                showNanoSukru: true
            },
            {
                bg: 'radial-gradient(circle at center, #800000, #330000)',
                speaker: 'System',
                text: "MISSION: Stabilize pH and restore barrier integrity. Digestion protocol initiated.",
                charLeft: 'none',
                charRight: 'none',
                activeChar: 'none',
                showNanoSukru: false,
                flash: true
            }
        ]
    };

    // Generic pre-battle scene for any organ without a specific one
    function getGenericPreBattleScenes(organName) {
        return [
            {
                bg: 'linear-gradient(to bottom, #0a0e17, #161b22)',
                speaker: 'Dr. Şükrü',
                text: `Entering the ${organName}. Pathogen concentrations are high — the nano-bubble's sensors are going off the charts.`,
                charLeft: 'url("assets/patient_gani.png")',
                charRight: 'url("assets/dr_sukru.png")',
                activeChar: 'right'
            },
            {
                bg: 'linear-gradient(to bottom, #0a0e17, #161b22)',
                speaker: 'System',
                text: `MISSION: Clear all hostiles from the ${organName}. Deploying combat protocols now.`,
                charLeft: 'none',
                charRight: 'none',
                activeChar: 'none',
                flash: true
            }
        ];
    }

    // ---- PRE-BATTLE CINEMATIC CONTROLLER ----
    let preBattleSceneIndex = 0;
    let preBattleSceneList = [];
    let preBattleTypewriterTimeout = null;
    let preBattlePendingOrgan = null;

    function startPreBattleCinematic(organName) {
        // Stop any running intro typewriter before starting ours
        if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }
        dialogueText.textContent = '';
        preBattlePendingOrgan = organName;
        preBattleSceneList = preBattleScenes[organName] || getGenericPreBattleScenes(organName);
        preBattleSceneIndex = 0;
        switchView(cinematicView);
        renderPreBattleScene();
    }

    function renderPreBattleScene() {
        if (preBattleSceneIndex >= preBattleSceneList.length) {
            // All scenes done — launch the actual combat or mini-game
            if (preBattlePendingOrgan === 'Stomach' && !completedOrgans.has('Stomach')) {
                // This shouldn't happen based on btn click logic, but safety check
                switchView(levelView);
                if (window.startActionGame) window.startActionGame('Stomach');
            } else if (preBattlePendingOrgan === 'Stomach' && completedOrgans.has('Stomach')) {
                // Launch Stabilization Mini-game
                const stomachView = document.getElementById('stomach-view');
                switchView(stomachView);
                if (window.StomachGame) window.StomachGame.start();
            } else {
                switchView(levelView);
                if (window.startActionGame) window.startActionGame(preBattlePendingOrgan);
            }
            return;
        }

        const scene = preBattleSceneList[preBattleSceneIndex];

        // Background
        const bg = document.getElementById('cinematic-bg');
        if (scene.bg.startsWith('url')) {
            bg.style.backgroundImage = scene.bg;
            bg.style.background = '';
        } else {
            bg.style.background = scene.bg;
            bg.style.backgroundImage = '';
        }

        // Speaker & text
        dialogueSpeaker.textContent = scene.speaker;
        dialogueText.textContent = '';

        // Characters
        const charLeft = document.getElementById('cinematic-char-left');
        const charRight = document.getElementById('cinematic-char-right');

        if (scene.charLeft && scene.charLeft !== 'none') {
            charLeft.style.backgroundImage = scene.charLeft;
            charLeft.classList.add('show');
            charLeft.classList.toggle('dim', scene.activeChar !== 'left');
        } else {
            charLeft.classList.remove('show');
        }

        if (scene.charRight && scene.charRight !== 'none') {
            charRight.style.backgroundImage = scene.charRight;
            charRight.classList.add('show');
            charRight.classList.toggle('dim', scene.activeChar !== 'right');
        } else {
            charRight.classList.remove('show');
        }

        // Nano-Sukru overlay
        const nanoSukru = document.getElementById('nano-sukru-anim');
        if (scene.showNanoSukru) {
            nanoSukru.classList.remove('hidden');
        } else {
            nanoSukru.classList.add('hidden');
        }

        // Nano-cell fly-in (reset)
        document.getElementById('nano-cell-anim').classList.remove('fly-in');

        // Shrink reset
        charRight.classList.remove('shrink');

        // Flash
        if (scene.flash) {
            shrinkFlash.classList.add('active');
            setTimeout(() => shrinkFlash.classList.remove('active'), 2000);
        }

        // Typewriter
        if (preBattleTypewriterTimeout) clearTimeout(preBattleTypewriterTimeout);
        let i = 0;
        const txt = scene.text;
        function typeWriter() {
            if (i < txt.length) {
                dialogueText.textContent += txt.charAt(i++);
                preBattleTypewriterTimeout = setTimeout(typeWriter, 28);
            }
        }
        typeWriter();
    }


    // Action Game Entry — now shows pre-battle cinematic first
    btnEnterLevel.addEventListener('click', () => {
        if (freeRoam) {
            showFreeRoamAlert();
            return;
        }

        // Special case: Stomach Stabilization (Objective 3)
        if (currentLocation === 'Stomach' && completedOrgans.has('Stomach') && !completedOrgans.has('Stabilize')) {
            isPreBattleCinematic = true;
            startPreBattleCinematic('Stomach');
            return;
        }

        // Special case: Mouth -> Esophagus (Objective 2)
        if (currentLocation === 'Mouth' && completedOrgans.has('Mouth')) {
            // Player is re-entering Mouth to go to Esophagus
            // Trigger the Mouth -> Stomach travel logic
            const connections = graph['Mouth'];
            if (connections && connections['Stomach']) {
                movePlayer(connections['Stomach'], 'Stomach', 'Stomach');
            }
            return;
        }

        isPreBattleCinematic = true;
        startPreBattleCinematic(currentLocation);
    });

    // Mid-Travel Logic
    function showMidTravelInterruption() {
        const overlay = document.getElementById('mid-travel-overlay');
        overlay.classList.remove('hidden');
    }

    document.getElementById('btn-start-esophagus').addEventListener('click', () => {
        document.getElementById('mid-travel-overlay').classList.add('hidden');
        const esoView = document.getElementById('esophagus-view');
        switchView(esoView);
        if (window.EsophagusGame) {
            window.EsophagusGame.start();
        }
    });

    window.onEsophagusComplete = function() {
        switchView(gameView);
        if (window.EsophagusGame) window.EsophagusGame.stop();
        
        // Complete the move to Stomach
        const stomach = document.getElementById('organ-Stomach');
        const point = { x: 460, y: 490 }; // Midpoint of Stomach or use SVG path end
        player.setAttribute('transform', `translate(${point.x}, ${point.y})`);
        
        isMoving = false;
        currentLocation = 'Stomach';
        currentLocationEl.textContent = 'Stomach';
        markObjectiveComplete('Stomach');
        showMessage(`Successfully navigated the esophagus. Arrived at Stomach!`);
        updateTargetableOrgans();
        showCurrentLocationInfo();
    };

    window.onStomachStabilized = function() {
        switchView(gameView);
        if (window.StomachGame) window.StomachGame.stop();
        markObjectiveComplete('Stabilize');
        showMessage(`Stomach stabilized! pH balanced and mucus barrier restored.`);
        updateTargetableOrgans();
        showCurrentLocationInfo();
    };

    document.getElementById('btn-eso-retry').addEventListener('click', () => {
        document.getElementById('eso-game-over').classList.add('hidden');
        if (window.EsophagusGame) window.EsophagusGame.start();
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
