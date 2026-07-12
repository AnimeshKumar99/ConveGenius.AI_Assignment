// script.js

// Game State Variables
let targetNumerator = 0;
let targetDenominator = 0;
let currentNumerator = 0;
let currentLevel = 1;
let currentScore = 0;
let timeLeft = 30;
let timerInterval = null;
const maxLevels = 5;
const timerDuration = 30;

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');

const targetNumEl = document.getElementById('target-num');
const targetDenEl = document.getElementById('target-den');
const currentNumEl = document.getElementById('current-num');
const currentDenEl = document.getElementById('current-den');

const circleContainer = document.getElementById('fraction-circle');
const messageEl = document.getElementById('message');
const levelEl = document.getElementById('current-level');
const scoreEl = document.getElementById('current-score');
const timerValueEl = document.getElementById('timer-value');

const addBtn = document.getElementById('add-btn');
const removeBtn = document.getElementById('remove-btn');
const resetBtn = document.getElementById('reset-btn');
const submitBtn = document.getElementById('submit-btn');

// Web Audio API for generating simple sounds (No external files needed)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Simple function to play different sounds
function playSound(type) {
    // Initialize AudioContext on first user interaction
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    
    // Resume context if suspended by browser
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        // Button click sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        // Success sound
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        // Wrong answer sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    }
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------

startBtn.addEventListener('click', () => {
    playSound('click');
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    startLevel();
});

addBtn.addEventListener('click', () => {
    playSound('click');
    addPiece();
});

removeBtn.addEventListener('click', () => {
    playSound('click');
    removePiece();
});

resetBtn.addEventListener('click', () => {
    playSound('click');
    resetGame();
});

submitBtn.addEventListener('click', () => {
    playSound('click');
    checkAnswer();
});


// ----------------------------------------------------
// Game Logic Functions
// ----------------------------------------------------

function startLevel() {
    // Generate random denominator between 4 and 8
    targetDenominator = Math.floor(Math.random() * 5) + 4; 
    
    // Generate random numerator between 1 and denominator
    targetNumerator = Math.floor(Math.random() * targetDenominator) + 1;
    
    // Update UI elements
    targetNumEl.textContent = targetNumerator;
    targetDenEl.textContent = targetDenominator;
    currentDenEl.textContent = targetDenominator;
    
    levelEl.textContent = currentLevel;
    scoreEl.textContent = currentScore;
    
    resetGame();
    startTimer();
}

function updateTimerDisplay() {
    timerValueEl.textContent = timeLeft;
    timerValueEl.classList.toggle('timer-warning', timeLeft <= 10);
}

function startTimer() {
    clearTimer();
    timeLeft = timerDuration;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleTimeUp() {
    clearTimer();
    messageEl.textContent = "Time's up!";
    messageEl.className = 'message wrong';
    playSound('wrong');

    addBtn.disabled = true;
    removeBtn.disabled = true;
    resetBtn.disabled = true;
    submitBtn.disabled = true;

    setTimeout(nextLevel, 1000);
}

function createCircle() {
    // Clear the container
    circleContainer.innerHTML = '';
    
    // Calculate the angle for each slice
    const angle = 360 / targetDenominator;
    const radians = (angle * Math.PI) / 180;
    
    // Calculate the right edge intersection for the CSS clip-path polygon
    const dy = 50 / Math.tan(radians);
    const yIntersect = (50 - dy).toFixed(2);
    
    // Create the wedge shape using clip-path 
    // Format: polygon(center, top-center, top-right, right-edge-intersection)
    const clipPathValue = `polygon(50% 50%, 50% 0%, 100% 0%, 100% ${yIntersect}%)`;
    
    // Create slices using loops and DOM manipulation
    for (let i = 0; i < targetDenominator; i++) {
        const slice = document.createElement('div');
        slice.classList.add('slice');
        
        // Apply clip path and rotation
        slice.style.clipPath = clipPathValue;
        slice.style.transform = `rotate(${i * angle}deg)`;
        
        circleContainer.appendChild(slice);
    }
    
    // Add lines to visually separate the pieces
    for (let i = 0; i < targetDenominator; i++) {
        const line = document.createElement('div');
        line.classList.add('slice-line');
        line.style.transform = `rotate(${i * angle}deg)`;
        circleContainer.appendChild(line);
    }
}

function addPiece() {
    if (currentNumerator < targetDenominator) {
        const slices = document.querySelectorAll('.slice');
        // Find the first gray slice
        for (let i = 0; i < slices.length; i++) {
            if (!slices[i].classList.contains('filled')) {
                // Change its color to green
                slices[i].classList.add('filled');
                
                // Update the current fraction
                currentNumerator++;
                currentNumEl.textContent = currentNumerator;
                
                break;
            }
        }
    }
}

function removePiece() {
    if (currentNumerator > 0) {
        const slices = document.querySelectorAll('.slice');
        // Find the last green slice
        for (let i = slices.length - 1; i >= 0; i--) {
            if (slices[i].classList.contains('filled')) {
                // Change it back to gray
                slices[i].classList.remove('filled');
                
                // Update the current fraction
                currentNumerator--;
                currentNumEl.textContent = currentNumerator;
                
                break;
            }
        }
    }
}

function checkAnswer() {
    clearTimer();

    // Compare the current fraction with the target fraction
    if (currentNumerator === targetNumerator) {
        messageEl.textContent = 'Correct!';
        messageEl.className = 'message correct';
        playSound('success');
        
        // Stop further changes while the next level is loading
        addBtn.disabled = true;
        removeBtn.disabled = true;
        resetBtn.disabled = true;
        submitBtn.disabled = true;
        
        updateScore();

        // Briefly show the feedback, then advance automatically
        setTimeout(nextLevel, 1000);
    } else {
        messageEl.textContent = 'Incorrect!';
        messageEl.className = 'message wrong';
        playSound('wrong');
    }
}

function updateScore() {
    // Add 10 points to the score
    // Check custom attribute to make sure we only score once per level
    if (submitBtn.getAttribute('data-scored') !== 'true') {
        currentScore += 10;
        scoreEl.textContent = currentScore;
        submitBtn.setAttribute('data-scored', 'true');
    }
}

function resetGame() {
    // Reset variables
    currentNumerator = 0;
    currentNumEl.textContent = currentNumerator;
    
    // Reset UI
    messageEl.textContent = '';
    messageEl.className = 'message';
    
    addBtn.disabled = false;
    removeBtn.disabled = false;
    resetBtn.disabled = false;
    submitBtn.disabled = false;
    
    // Recreate the circle
    createCircle();
}

function nextLevel() {
    clearTimer();
    currentLevel++;
    submitBtn.removeAttribute('data-scored');
    
    if (currentLevel > maxLevels) {
        // End of the game logic
        homeScreen.innerHTML = `
            <h1>Congratulations!</h1>
            <h3>You completed all ${maxLevels} levels.</h3>
            <h3>Final Score: ${currentScore} / ${maxLevels * 10}</h3>
            <button onclick="location.reload()">Play Again</button>
        `;
        gameScreen.classList.remove('active');
        homeScreen.classList.add('active');
    } else {
        startLevel();
    }
}
