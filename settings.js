let settingsState = {
  rounds: 2,
  timer: 15
};

// DOM Elements
const modal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const saveButton = document.getElementById('saveSettings');
const cancelButton = document.getElementById('cancelSettings');
const roundsDisplay = document.getElementById('roundsDisplay');
const timerDisplay = document.getElementById('timerDisplay');

// Settings constraints
const constraints = {
  rounds: { min: 1, max: 5, step: 1 },
  timer: { min: 10, max: 120, step: 5 }
};

// Event Handlers
settingsButton.addEventListener('click', () => {
  // Update displays with current values from gameState
  settingsState = {
      rounds: gameState.ROUNDS_PER_GAME,
      timer: gameState.TIMER_DURATION
  };
  updateDisplays();
  modal.style.display = 'block';
});

saveButton.addEventListener('click', () => {
  // Update gameState with new settings
  gameState = {
      ...gameState,
      ROUNDS_PER_GAME: settingsState.rounds,
      TIMER_DURATION: settingsState.timer,
      timeRemaining: settingsState.timer
  };
  
  // Update UI
  updateUI.timer(gameState.timeRemaining);
  const roundMessage = `Round ${gameState.currentRound + 1} of ${gameState.ROUNDS_PER_GAME}`;
  document.getElementById("currentRound").textContent = roundMessage;
  
  modal.style.display = 'none';
});

cancelButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal if clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
      modal.style.display = 'none';
  }
});

// Handle number controls
document.querySelectorAll('.control-btn').forEach(button => {
  button.addEventListener('click', () => {
      const setting = button.dataset.setting;
      const isPlus = button.classList.contains('plus');
      const { min, max, step } = constraints[setting];
      
      let newValue = settingsState[setting];
      if (isPlus) {
          newValue = Math.min(newValue + step, max);
      } else {
          newValue = Math.max(newValue - step, min);
      }
      
      settingsState[setting] = newValue;
      updateDisplays();
  });
});

// Update display values
function updateDisplays() {
  roundsDisplay.textContent = settingsState.rounds;
  timerDisplay.textContent = settingsState.timer;
}