/** @typedef {[string, string]} WordPair - A tuple of [english, translation] */

/** @typedef {Object} GameState
 * @property {1|2} currentTeam - Current team's turn (1 or 2)
 * @property {{ team1: number, team2: number }} scores - Teams' scores
 * @property {HTMLElement[]} selectedCards - Currently selected cards
 * @property {Set<number>} matchedPairs - Indices of matched word pairs
 * @property {WordPair[]} wordPairs - All available word pairs
 * @property {number} timeRemaining - How much time is left on the timer
 * @property {number} currentRound - The current (zero-based) round
 * @property {number} WORDS_PER_GAME - Number of word pairs per game
 * @property {number} TIMER_DURATION - How long each student has to find matches
 * @property {number} ROUNDS_PER_GAME - The number of rounds per game
 * @property {'team'|'individual'} mode - The current game mode
 */

let timerInterval = null;

// Sample word pairs for initial demo (Portuguese-English)
/** @type {WordPair[]} */
const samplePairs = [
  ["house", "casa"],
  ["water", "água"],
  ["friend", "amigo"],
  ["book", "livro"],
  ["cat", "gato"],
  ["dog", "cachorro"],
  ["bread", "pão"],
  ["milk", "leite"],
  ["coffee", "café"],
  ["sun", "sol"],
  ["moon", "lua"],
  ["beach", "praia"],
  ["tree", "árvore"],
  ["food", "comida"],
  ["door", "porta"],
];

/** @type {GameState} */
const initialState = {
  currentTeam: 1,
  scores: { team1: 0, team2: 0 },
  selectedCards: [],
  matchedPairs: new Set(),
  wordPairs: [],
  timeRemaining: 0,
  currentRound: 0,
  WORDS_PER_GAME: 9,
  TIMER_DURATION: 15,
  ROUNDS_PER_GAME: 2,
};

// Settings

let settingsState = {
  mode: "team",
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
      timeRemaining: settingsState.timer,
      mode: settingsState.mode,

  };

  // Update UI
  updateUI.timer(gameState.timeRemaining);
  const roundMessage = `Round ${gameState.currentRound + 1} of ${gameState.ROUNDS_PER_GAME}`;
  document.getElementById("currentRound").textContent = roundMessage;

  updateUI.teamFeatures(gameState.mode === "team");

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

document.querySelectorAll('.mode-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const isSelected = button.classList.contains('active')
    if (!isSelected) {
      updateUI.mode(button);
      settingsState.mode = button.dataset.mode;
      // Toggle visibility of team settings
      const modalContent = document.querySelector('.modal-content');
      modalContent.classList.toggle('individual-mode', settingsState.mode === 'individual');
    }
  })
})

// Update display values
function updateDisplays() {
  roundsDisplay.textContent = settingsState.rounds;
  timerDisplay.textContent = settingsState.timer;
}


// Core game state updates (pure functions)

/** @typedef {{state: GameState, deselect?: HTMLElement}} SelectCardResult */

/**
 * Updates game state when a card is selected
 * @param {GameState} state - Current game state
 * @param {HTMLElement} card - Selected card element
 * @returns {SelectCardResult} Updated state and optional card to deselect
 */
const selectCard = (state, card) => {
  const cardIndex = parseInt(card.dataset.index);
  const cardSide = card.dataset.side;
  const isTeamMode = state.mode === "team";

  if (isTeamMode && !timerInterval) startTimer();
  if (state.selectedCards.length === 1) {
    previousSelection = state.selectedCards[0];
    if (cardSide === previousSelection.dataset.side) {
      const newState = { ...state, selectedCards: [card] };
      return { state: newState, deselect: previousSelection };
    }
  }
  const isValidSelection =
    !state.matchedPairs.has(cardIndex) && state.selectedCards.length < 2;

  return isValidSelection
    ? { state: { ...state, selectedCards: [...state.selectedCards, card] } }
    : { state };
};

/**
 * Checks if selected cards match and updates game state
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated game state after checking match
 */
const checkMatch = (state) => {
  const [card1, card2] = state.selectedCards;
  const index1 = parseInt(card1.dataset.index);
  const index2 = parseInt(card2.dataset.index);
  const isMatch = index1 === index2;

  if (isMatch) {
    const newMatchedPairs = new Set(state.matchedPairs).add(index1);
    const newScores = {
      ...state.scores,
      [`team${state.currentTeam}`]:
        state.scores[`team${state.currentTeam}`] + 1,
    };
    return {
      ...state,
      matchedPairs: newMatchedPairs,
      scores: newScores,
      selectedCards: [],
    };
  }

  return {
    ...state,
    selectedCards: [],
  };
};

// Game utilities (pure functions)
/**
 * Shuffles array in place using Fisher-Yates algorithm
 * @template T
 * @param {T[]} array - Array to shuffle
 * @returns {T[]} New shuffled array
 */
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Gets random subset of word pairs
 * @param {WordPair[]} allPairs - All available word pairs
 * @param {number} count - Number of pairs to select
 * @returns {WordPair[]} Selected random pairs
 */
const getRandomPairs = (allPairs, count) =>
  shuffleArray([...allPairs]).slice(0, count);

/**
 * Parses CSV content into word pairs
 * @param {string} content - Raw CSV content
 * @returns {WordPair[]} Parsed word pairs
 */
const parseCsvContent = (content) =>
  content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line.includes(","))
    .map((line) => line.split(",").map((word) => word.trim()));

/**
 * Gets next team number
 * @param {1|2} currentTeam - Current team number
 * @returns {1|2} Next team number
 */
const getNextTeam = (currentTeam) => (currentTeam === 1 ? 2 : 1);

/**
 * Switches to the next team
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated game state with next team
 */
const switchTeam = (state) => {
  const newState = resetTimer(state);
  return {
    ...newState,
    currentTeam: getNextTeam(state.currentTeam),
  };
};

/**
 * Starts the timer, setting an interval which modifies gameState directly
 */
const startTimer = () => {
  timerInterval = setInterval(() => {
    gameState.timeRemaining--;
    updateUI.timer(gameState.timeRemaining);
    if (gameState.timeRemaining <= 0) {
      gameState = switchTeam(resetTimer(gameState));
      updateUI.teamTurn(gameState.currentTeam);
    }
  }, 1000);
};

/**
 * Stops the timer, clearing the interval and resetting it to null
 */
const stopTimer = () => {
  clearInterval(timerInterval);
  timerInterval = null;
};

/**
 * Stops timer and resets to initial value
 * @param {GameState} state - Current game state
 * @returns {GameState} with reset time
 */
const resetTimer = (state) => {
  stopTimer();
  updateUI.timer(state.TIMER_DURATION);
  return { ...state, timeRemaining: state.TIMER_DURATION };
};

/**
 * Formats the time in the desired way
 */
const formatTime = (time) => {
  minutes = String(Math.floor(time / 60)).padStart(2, "0");
  seconds = String(time % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/**
 * UI update functions
 * @typedef {Object} UIUpdate
 * @property {function(HTMLElement, boolean): void} cardSelection Updates card selection visual state
 * @property {function(HTMLElement, boolean): void} mode Updates settings game mode visual state
 * @property {function(boolean): void} teamFeatures Toggles team features on and off
 * @property {function(HTMLElement[]): void} matchedPair Updates matched cards visual state
 * @property {function(1|2): void} teamTurn Updates current team turn indicator
 * @property {function(1|2, number): void} score Updates team score display
 * @property {function(): void} resetGame Resets game UI to initial state
 * @property {function(number): void} timer Updates the timer display
 */

/** @type {UIUpdate} */
const updateUI = {
  /**
   * Updates card selection visual state
   * @param {HTMLElement} card - Card element
   * @param {boolean} isSelected - Whether card is selected
   */
  cardSelection: (card, isSelected) => {
    card.classList.toggle("selected", isSelected);
  },

  /**
   * Shows a mode as activated or not
   * @param {HTMLElement} button the mode button that was clicked
   */
  mode: (button) => {
    document.querySelectorAll('.mode-btn').forEach((one) => one.classList.remove('active'))
    button.classList.toggle('active', true)
  },

  teamFeatures: (shouldShow) => {
    const shouldHide = !shouldShow;
    document.querySelectorAll('.team').forEach(
      (ele) => ele.classList.toggle('hidden', shouldHide)
    );
  },

  /**
   * Updates matched cards visual state
   * @param {HTMLElement[]} cards - Matched card elements
   */
  matchedPair: (cards) => {
    cards.forEach((card) => {
      card.classList.remove("selected");
      card.classList.add("matched");
    });
  },

  /**
   * Updates current team turn indicator
   * @param {1|2} team - Team number
   */
  teamTurn: (team) => {
    document.querySelector(".team-score.active")?.classList.remove("active");
    document.querySelector(`.team${team}`).classList.add("active");
    document.getElementById("currentTeam").textContent = `Team ${team}'s Turn`;
  },

  /**
   * Updates team score display
   * @param {1|2} team - Team number
   * @param {number} score - New score
   */
  score: (team, score) => {
    document.getElementById(`team${team}Score`).textContent = score;
  },

  /** Resets game UI to initial state */
  resetGame: () => {
    document.getElementById("englishGrid").innerHTML = "";
    document.getElementById("translationGrid").innerHTML = "";
    document.getElementById("team1Score").textContent = "0";
    document.getElementById("team2Score").textContent = "0";
    document.querySelector(".team-score.active")?.classList.remove("active");
    document.querySelector(".team1").classList.add("active");
    document.getElementById("currentTeam").textContent = "Team 1's Turn";
    document.getElementById("timer").textContent = formatTime(
      gameState.TIMER_DURATION
    );
  },

  timer: (timeRemaining) => {
    document.getElementById("timer").textContent = formatTime(timeRemaining);
  },
};

/** @type {GameState} */
let gameState = { ...initialState };

/**
 * Advances to the next round
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated state for next round
 */
const advanceRound = (state) => {
  return {
    ...state,
    currentRound: state.currentRound + 1,
    matchedPairs: new Set(),
    selectedCards: [],
  };
};

/**
 * Creates a new game card element
 * @param {string} word - Word to display on card
 * @param {number} index - Card index
 * @param {boolean} isEnglish - Whether card is English side
 * @returns {HTMLElement} Created card element
 */
const createCard = (word, index, isEnglish) => {
  const card = document.createElement("button");
  card.className = "word-card";
  card.textContent = word;
  card.dataset.index = index;
  card.dataset.side = isEnglish ? "english" : "translation";

  const isTeamMode = gameState.mode === "team";

  card.addEventListener("click", () => {
    const { state: newState, deselect } = selectCard(gameState, card);
    if (deselect) updateUI.cardSelection(deselect, false);
    if (newState === gameState) return;

    gameState = newState;
    updateUI.cardSelection(card, true);

    if (isTeamMode && !timerInterval) startTimer();

    if (gameState.selectedCards.length === 2) {
      const matchState = checkMatch(gameState);
      const boardIsFinished = matchState.matchedPairs.size === gameState.WORDS_PER_GAME;
      const gameOver = matchState.currentRound >= gameState.ROUNDS_PER_GAME - 1 && boardIsFinished;

      // Inside the card click event listener, replace the if (matchState.matchedPairs.size > gameState.matchedPairs.size) block with:

      if (matchState.matchedPairs.size > gameState.matchedPairs.size) {
        // Handle successful match
        updateUI.matchedPair(gameState.selectedCards);
        if (isTeamMode) {
          updateUI.score(
            gameState.currentTeam,
            matchState.scores[`team${gameState.currentTeam}`]
          );
        }

        if (gameOver) {
          if (isTeamMode) {
            stopTimer();
            // Handle team mode game over
            const winner =
              matchState.scores.team1 > matchState.scores.team2
                ? "Team 1"
                : matchState.scores.team1 < matchState.scores.team2
                ? "Team 2"
                : "It's a tie";
            setTimeout(() => alert(`Game Over! ${winner} wins!`), 500);
          } else {
            // Handle individual mode game over
            setTimeout(() => {
              alert("Game Over! You've completed all rounds!");
            }, 500);
          }
        } else if (boardIsFinished) {
          if (isTeamMode) {
            stopTimer();
            const nextRoundState = advanceRound(matchState);

            // Show round transition message
            const roundMessage = `Round ${nextRoundState.currentRound + 1} of ${nextRoundState.ROUNDS_PER_GAME}`;
            document.getElementById("currentRound").textContent = roundMessage;

            setTimeout(() => {
              // Reset timer for new round
              const stateWithResetTimer = switchTeam(resetTimer(nextRoundState));
              // Setup new board and update global state after board is set up
              setupNewBoard(stateWithResetTimer);

              gameState = {
                ...stateWithResetTimer,
                matchedPairs: new Set(),
                selectedCards: []
              };
              updateUI.teamTurn(gameState.currentTeam);
            }, 1000);
          } else {
            // Handle individual mode round advance
            const nextRoundState = advanceRound(matchState);

            // Show round transition message
            const roundMessage = `Round ${nextRoundState.currentRound + 1} of ${nextRoundState.ROUNDS_PER_GAME}`;
            document.getElementById("currentRound").textContent = roundMessage;

            setTimeout(() => {
              setupNewBoard(nextRoundState);
              gameState = {
                ...nextRoundState,
                matchedPairs: new Set(),
                selectedCards: []
              };
            }, 1000);
          }
        }
      } else {
        // Handle unsuccessful match
        gameState.selectedCards.forEach((card) =>
          updateUI.cardSelection(card, false)
        );
        if (isTeamMode) updateUI.teamTurn(matchState.currentTeam);
      }

      gameState = matchState;
    }
  });

  return card;
};

/**
 * Sets up a new game board without resetting scores or round
 * @param {GameState} state - Current game state
 */
const setupNewBoard = (state) => {
  // Ensure we're working with a clean state
  state = {
    ...state,
    matchedPairs: new Set(),
    selectedCards: []
  };

  const currentGamePairs = getRandomPairs(
    state.wordPairs.length ? state.wordPairs : samplePairs,
    state.WORDS_PER_GAME
  );

  // Clear existing cards
  document.getElementById("englishGrid").innerHTML = "";
  document.getElementById("translationGrid").innerHTML = "";

  // Create new cards for both sides
  ["english", "translation"].forEach((side, sideIndex) => {
    const grid = document.getElementById(`${side}Grid`);
    const shuffledIndices = shuffleArray([
      ...Array(state.WORDS_PER_GAME).keys(),
    ]);

    shuffledIndices.forEach((index) => {
      const word = currentGamePairs[index][sideIndex];
      grid.appendChild(createCard(word, index, side === "english"));
    });
  });
};

/**
 * Sets up a new game
 * @param {WordPair[]} [wordPairs=[]] - Optional word pairs to use
 */
const setupNewGame = (wordPairs = []) => {
  gameState = {
    ...initialState,
    wordPairs,
    timeRemaining: initialState.TIMER_DURATION,
  };

  updateUI.resetGame();
  setupNewBoard(gameState);

  // Initialize round display
  const roundMessage = `Round 1 of ${gameState.ROUNDS_PER_GAME}`;
  document.getElementById("currentRound").textContent = roundMessage;
};

// Event Listeners
document.getElementById("csvInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });

    const wordPairs = parseCsvContent(text);
    setupNewGame(wordPairs);
  } catch (error) {
    console.error("Error reading CSV:", error);
    alert("Error reading CSV file. Please try again.");
  }
});

document.getElementById("newGameButton").addEventListener("click", () => {
  setupNewGame(gameState.wordPairs);
});

document.getElementById("switchTeamButton").addEventListener("click", () => {
  const newState = switchTeam(gameState);
  gameState = newState;
  updateUI.teamTurn(newState.currentTeam);
});

// Initialize game
setupNewGame();
