/** @typedef {[string, string]} WordPair - A tuple of [english, translation] */

/** @typedef {Object} GameState
 * @property {1|2} currentTeam - Current team's turn (1 or 2)
 * @property {{ team1: number, team2: number }} scores - Teams' scores
 * @property {HTMLElement[]} selectedCards - Currently selected cards
 * @property {Set<number>} matchedPairs - Indices of matched word pairs
 * @property {WordPair[]} wordPairs - All available word pairs
 * @property {number} timeRemaining - How much time is left on the timer
 * @property {number} WORDS_PER_GAME - Number of word pairs per game
 * @property {number} TIMER_DURATION - How long each student has to find matches
 */

let timerInterval = null;

// Sample word pairs for initial demo (Portuguese-English)
/** @type {WordPair[]} */
const samplePairs = [
  ['house', 'casa'],
  ['water', 'água'],
  ['friend', 'amigo'],
  ['book', 'livro'],
  ['cat', 'gato'],
  ['dog', 'cachorro'],
  ['bread', 'pão'],
  ['milk', 'leite'],
  ['coffee', 'café'],
  ['sun', 'sol'],
  ['moon', 'lua'],
  ['beach', 'praia'],
  ['tree', 'árvore'],
  ['food', 'comida'],
  ['door', 'porta']
];

/** @type {GameState} */
const initialState = {
  currentTeam: 1,
  scores: { team1: 0, team2: 0 },
  selectedCards: [],
  matchedPairs: new Set(),
  wordPairs: [],
  timeRemaining: 0,
  WORDS_PER_GAME: 9,
  TIMER_DURATION: 5
};

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
  if (!timerInterval) startTimer();
  if (state.selectedCards.length === 1) {
    previousSelection = state.selectedCards[0];
    if (cardSide === previousSelection.dataset.side) {
      const newState = { ...state, selectedCards: [card] }
      return { state: newState, deselect: previousSelection }
    }
  }
  const isValidSelection =
      !state.matchedPairs.has(cardIndex) &&
      state.selectedCards.length < 2;

  return isValidSelection
    ? { state: {...state, selectedCards: [...state.selectedCards, card]} }
    : { state }
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
          [`team${state.currentTeam}`]: state.scores[`team${state.currentTeam}`] + 1
      };
      return {
          ...state,
          matchedPairs: newMatchedPairs,
          scores: newScores,
          selectedCards: []
      };
  }

  return {
      ...state,
      currentTeam: state.currentTeam === 1 ? 2 : 1,
      selectedCards: []
  };
};


// Game utilities (pure functions)
/**
* Shuffles array in place using Fisher-Yates algorithm
* @template T
* @param {T[]} array - Array to shuffle
* @returns {T[]} New shuffled array
*/
const shuffleArray = array => {
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
const parseCsvContent = content =>
  content.split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(','))
      .map(line => line.split(',').map(word => word.trim()));

/**
* Gets next team number
* @param {1|2} currentTeam - Current team number
* @returns {1|2} Next team number
*/
const getNextTeam = (currentTeam) => currentTeam === 1 ? 2 : 1;

/**
* Switches to the next team
* @param {GameState} state - Current game state
* @returns {GameState} Updated game state with next team
*/
const switchTeam = (state) => ({
  ...state,
  currentTeam: getNextTeam(state.currentTeam)
});

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
}

/**
 * Stops the timer, clearing the interval and resetting it to null
 */
const stopTimer = () => {
  clearInterval(timerInterval)
  timerInterval = null;
}

/**
 * Stops timer and resets to initial value
 * @param {GameState} state - Current game state
 * @returns {GameState} with reset time
 */
const resetTimer = (state) => {
  stopTimer();
  updateUI.timer(state.TIMER_DURATION);
  return {...state, timeRemaining: state.TIMER_DURATION}
}

/**
 * Formats the time in the desired way
 */
const formatTime = (time) => {
  minutes = String(Math.floor(time / 60)).padStart(2, "0");
  seconds = String(time % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * UI update functions
 * @typedef {Object} UIUpdate
 * @property {function(HTMLElement, boolean): void} cardSelection Updates card selection visual state
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
      card.classList.toggle('selected', isSelected);
  },

  /**
   * Updates matched cards visual state
   * @param {HTMLElement[]} cards - Matched card elements
   */
  matchedPair: (cards) => {
      cards.forEach(card => {
          card.classList.remove('selected');
          card.classList.add('matched');
      });
  },

  /**
   * Updates current team turn indicator
   * @param {1|2} team - Team number
   */
  teamTurn: (team) => {
      document.querySelector('.team-score.active')?.classList.remove('active');
      document.querySelector(`.team${team}`).classList.add('active');
      document.getElementById('currentTeam').textContent = `Team ${team}'s Turn`;
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
      document.getElementById('englishGrid').innerHTML = '';
      document.getElementById('translationGrid').innerHTML = '';
      document.getElementById('team1Score').textContent = '0';
      document.getElementById('team2Score').textContent = '0';
      document.querySelector('.team-score.active')?.classList.remove('active');
      document.querySelector('.team1').classList.add('active');
      document.getElementById('currentTeam').textContent = "Team 1's Turn";
      document.getElementById('timer').textContent = formatTime(gameState.TIMER_DURATION);
  },

  timer: (timeRemaining) => {
    document.getElementById('timer').textContent = formatTime(timeRemaining);
  }
};

/** @type {GameState} */
let gameState = { ...initialState };

/**
* Creates a new game card element
* @param {string} word - Word to display on card
* @param {number} index - Card index
* @param {boolean} isEnglish - Whether card is English side
* @returns {HTMLElement} Created card element
*/
const createCard = (word, index, isEnglish) => {
  const card = document.createElement('button');
  card.className = 'word-card';
  card.textContent = word;
  card.dataset.index = index;
  card.dataset.side = isEnglish ? 'english' : 'translation';

  card.addEventListener('click', () => {
      const { state: newState, deselect } = selectCard(gameState, card);
      if (deselect) updateUI.cardSelection(deselect, false);
      if (newState === gameState) return;

      gameState = newState;
      updateUI.cardSelection(card, true);

      if (!timerInterval) startTimer();

      if (gameState.selectedCards.length === 2) {
          const matchState = checkMatch(gameState);

          if (matchState.matchedPairs.size > gameState.matchedPairs.size) {
              updateUI.matchedPair(gameState.selectedCards);
              updateUI.score(gameState.currentTeam, matchState.scores[`team${gameState.currentTeam}`]);

              if (matchState.matchedPairs.size === gameState.WORDS_PER_GAME) {
                  const winner = matchState.scores.team1 > matchState.scores.team2 ? 'Team 1' :
                               matchState.scores.team1 < matchState.scores.team2 ? 'Team 2' :
                               'It\'s a tie';
                  setTimeout(() => alert(`Game Over! ${winner} wins!`), 500);
              }
          } else {
              gameState.selectedCards.forEach(card => updateUI.cardSelection(card, false));
              updateUI.teamTurn(matchState.currentTeam);
          }

          gameState = matchState;
      }
  });

  return card;
};

/**
* Sets up a new game
* @param {WordPair[]} [wordPairs=[]] - Optional word pairs to use
*/
const setupNewGame = (wordPairs = []) => {
  gameState = { ...initialState, wordPairs, timeRemaining: gameState.TIMER_DURATION };
  updateUI.resetGame();

  const allPairs = wordPairs.length ? wordPairs : samplePairs;
  const currentGamePairs = getRandomPairs(allPairs, gameState.WORDS_PER_GAME);

  ['english', 'translation'].forEach((side, sideIndex) => {
      const grid = document.getElementById(`${side}Grid`);
      const shuffledIndices = shuffleArray([...Array(gameState.WORDS_PER_GAME).keys()]);

      shuffledIndices.forEach(index => {
          const word = currentGamePairs[index][sideIndex];
          grid.appendChild(createCard(word, index, side === 'english'));
      });
  });
};

// Event Listeners
document.getElementById('csvInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
      const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = e => reject(e);
          reader.readAsText(file);
      });

      const wordPairs = parseCsvContent(text);
      setupNewGame(wordPairs);
  } catch (error) {
      console.error('Error reading CSV:', error);
      alert('Error reading CSV file. Please try again.');
  }
});

document.getElementById('newGameButton').addEventListener('click', () => {
  setupNewGame(gameState.wordPairs);
});

document.getElementById('switchTeamButton').addEventListener('click', () => {
  const newState = switchTeam(gameState);
  gameState = newState;
  updateUI.teamTurn(newState.currentTeam);
});

// Initialize game
setupNewGame();
