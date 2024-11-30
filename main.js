
let currentTeam = 1;
let scores = { team1: 0, team2: 0 };
let selectedCards = [];
let matchedPairs = new Set();
let wordPairs = [];
const WORDS_PER_GAME = 9;  // 3x3 grid

// Sample word pairs for initial demo
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomWordPairs(allPairs, count) {
    // Create a copy of the array to avoid modifying the original
    const shuffled = shuffleArray([...allPairs]);
    // Take only the first 'count' pairs
    return shuffled.slice(0, count);
}

function createCard(word, index, isEnglish) {
    const card = document.createElement('button');
    card.className = 'word-card';
    card.textContent = word;
    card.dataset.index = index;
    card.dataset.side = isEnglish ? 'english' : 'translation';
    
    card.addEventListener('click', () => handleCardClick(card));
    return card;
}

function handleCardClick(card) {
    if (matchedPairs.has(parseInt(card.dataset.index)) || 
        selectedCards.length === 2 ||
        (selectedCards.length === 1 && selectedCards[0].dataset.side === card.dataset.side)) {
        return;
    }

    card.classList.add('selected');
    selectedCards.push(card);

    if (selectedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = selectedCards;
    const index1 = parseInt(card1.dataset.index);
    const index2 = parseInt(card2.dataset.index);

    if (index1 === index2) {
        matchedPairs.add(index1);
        selectedCards.forEach(card => {
            card.classList.remove('selected');
            card.classList.add('matched');
        });
        updateScore();

        // Check if game is complete
        if (matchedPairs.size === WORDS_PER_GAME) {
            setTimeout(() => {
                const winner = scores.team1 > scores.team2 ? 'Team 1' : 
                             scores.team1 < scores.team2 ? 'Team 2' : 'It\'s a tie';
                alert(`Game Over! ${winner} wins!`);
            }, 500);
        }
    } else {
        setTimeout(() => {
            selectedCards.forEach(card => card.classList.remove('selected'));
            switchTeam();
        }, 1000);
    }

    selectedCards = [];
}

function updateScore() {
    const currentTeamScore = currentTeam === 1 ? 'team1' : 'team2';
    scores[currentTeamScore]++;
    document.getElementById(`${currentTeamScore}Score`).textContent = scores[currentTeamScore];
}

function switchTeam() {
    document.querySelector('.team-score.active').classList.remove('active');
    currentTeam = currentTeam === 1 ? 2 : 1;
    document.querySelector(`.team${currentTeam}`).classList.add('active');
    document.getElementById('currentTeam').textContent = `Team ${currentTeam}'s Turn`;
}

function newGame() {
    matchedPairs.clear();
    scores = { team1: 0, team2: 0 };
    document.getElementById('team1Score').textContent = '0';
    document.getElementById('team2Score').textContent = '0';
    currentTeam = 1;
    selectedCards = [];
    
    const englishGrid = document.getElementById('englishGrid');
    const translationGrid = document.getElementById('translationGrid');
    englishGrid.innerHTML = '';
    translationGrid.innerHTML = '';

    // Get random subset of word pairs for this game
    const allPairs = wordPairs.length ? wordPairs : samplePairs;
    const currentGamePairs = getRandomWordPairs(allPairs, WORDS_PER_GAME);

    // Create and shuffle the cards independently
    const shuffledEnglish = shuffleArray([...Array(WORDS_PER_GAME).keys()]);
    const shuffledTranslations = shuffleArray([...Array(WORDS_PER_GAME).keys()]);
    
    shuffledEnglish.forEach((originalIndex) => {
        const pair = currentGamePairs[originalIndex];
        englishGrid.appendChild(createCard(pair[0], originalIndex, true));
    });

    shuffledTranslations.forEach((originalIndex) => {
        const pair = currentGamePairs[originalIndex];
        translationGrid.appendChild(createCard(pair[1], originalIndex, false));
    });

    document.querySelector('.team-score.active')?.classList.remove('active');
    document.querySelector('.team1').classList.add('active');
    document.getElementById('currentTeam').textContent = "Team 1's Turn";
}

// CSV file handling
document.getElementById('csvInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            wordPairs = text.split('\n')
                .map(line => line.trim())
                .filter(line => line)
                // Filter out any empty cells or invalid lines
                .filter(line => line.includes(','))
                .filter(line => line.split(',').length >= 2)
                .map(line => line.split(',').map(word => word.trim()));
            newGame();
        };
        reader.readAsText(file);
    }
});

// Initialize the game
newGame();
