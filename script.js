// State
let state = {
    seenCards: [], // Array of IDs
    favorites: [], // Array of IDs
    currentCardIndex: 0, // Index within the *filtered* list
    currentCategory: 'all',
    currentTheme: 'general' // 'general' or 'paris'
};

// DOM Elements
const elements = {
    deck: {
        stack: document.getElementById('card-stack'),
        nextBtn: document.getElementById('btn-next'),
        prevBtn: document.getElementById('btn-prev'),
        filters: document.getElementById('category-filters'),
        themeBtns: document.querySelectorAll('.theme-btn'),
        modeBtns: document.querySelectorAll('.mode-btn')
    }
};

// Initialization
function init() {
    loadState();
    renderFilters();
    renderCurrentCard();
    setupEventListeners();
    updateNavButtons();
    updateThemeUI();
    updateModeUI();
}

// Event Listeners
function setupEventListeners() {
    // Deck Controls
    elements.deck.nextBtn.addEventListener('click', nextCard);
    elements.deck.prevBtn.addEventListener('click', prevCard);
}

// Theme Logic
function setTheme(theme) {
    if (state.currentTheme === theme) return;

    state.currentTheme = theme;
    state.currentCategory = 'all'; // Reset category when switching theme
    state.currentCardIndex = 0;

    updateThemeUI();
    renderFilters();
    renderCurrentCard();
    updateNavButtons();
    saveState();
}

function updateThemeUI() {
    elements.deck.themeBtns.forEach(btn => {
        const themeName = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (state.currentTheme === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Mode Logic
function setMode(mode) {
    if (state.currentMode === mode) return;

    state.currentMode = mode;
    state.currentCategory = 'all';
    state.currentCardIndex = 0;

    updateModeUI();
    renderFilters();
    renderCurrentCard();
    updateNavButtons();
    saveState();
}

function updateModeUI() {
    elements.deck.modeBtns.forEach(btn => {
        const modeName = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (state.currentMode === modeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Filter Logic
function getFilteredFacts() {
    let facts;

    // Handle Favorites Filter
    if (state.currentCategory === 'favoris') {
        facts = factsData.filter(f => state.favorites.includes(f.id));
        // If we are in favorites, we might want to respect the theme or show all favorites?
        // Let's show all favorites regardless of theme for now, or filter by theme?
        // User asked for "Favorites" button, usually favorites are global.
        // But to keep UI consistent with theme selector, maybe filter favorites by theme?
        // Let's keep it simple: Favorites filter shows ALL favorites.
        return facts;
    }

    // Normal Theme Filtering
    facts = factsData.filter(f => f.theme === state.currentTheme);

    if (state.currentCategory !== 'all') {
        facts = facts.filter(f => f.category === state.currentCategory);
    }
    return facts;
}

function setCategory(category) {
    state.currentCategory = category;
    state.currentCardIndex = 0; // Reset to start of new category
    renderFilters();
    renderCurrentCard();
    updateNavButtons();
}

function renderFilters() {
    // Get categories ONLY for current theme
    const themeFacts = factsData.filter(f => f.theme === state.currentTheme);
    const categories = ['all', ...new Set(themeFacts.map(f => f.category))];

    // Add Favorites to the list
    categories.push('favoris');

    elements.deck.filters.innerHTML = categories.map(cat => {
        let label = cat;
        if (cat === 'all') label = 'Tout';
        if (cat === 'favoris') label = '❤️ Favoris';

        return `
        <button class="filter-chip ${state.currentCategory === cat ? 'active' : ''}" 
                onclick="setCategory('${cat}')">
            ${label}
        </button>
        `;
    }).join('');
}

// Deck Logic
function renderCurrentCard() {
    const stack = elements.deck.stack;
    stack.innerHTML = ''; // Clear current

    const filteredFacts = getFilteredFacts();

    if (filteredFacts.length === 0) {
        let msg = "Aucune anecdote dans cette catégorie.";
        if (state.currentCategory === 'favoris') {
            msg = "Vous n'avez pas encore de favoris.";
        }

        stack.innerHTML = `
            <div class="card" style="text-align: center;">
                <div class="card-content">${msg}</div>
            </div>
        `;
        elements.deck.nextBtn.disabled = true;
        elements.deck.prevBtn.disabled = true;
        return;
    }

    if (state.currentCardIndex >= filteredFacts.length) {
        stack.innerHTML = `
            <div class="card" style="text-align: center;">
                <div class="card-content">
                    Vous avez vu toutes les anecdotes de cette liste !
                </div>
                <div class="card-detail">
                    Changez de catégorie ou de thème.
                </div>
            </div>
        `;
        elements.deck.nextBtn.disabled = true;
        return;
    }

    const data = filteredFacts[state.currentCardIndex];
    const isFav = state.favorites.includes(data.id);

    const card = document.createElement('div');
    card.className = 'card slide-in-right';

    card.innerHTML = `
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${data.id}, this)">
            <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </button>
        <div class="card-category">${data.category}</div>
        <div class="card-content">${data.content}</div>
        <div class="card-detail">${data.detail}</div>
    `;

    stack.appendChild(card);
    updateNavButtons();
}

function nextCard() {
    const filteredFacts = getFilteredFacts();
    if (state.currentCardIndex >= filteredFacts.length - 1) return;

    const currentCard = elements.deck.stack.querySelector('.card');
    if (!currentCard) return;

    // Mark as seen if not already
    const currentData = filteredFacts[state.currentCardIndex];
    if (!state.seenCards.includes(currentData.id)) {
        state.seenCards.push(currentData.id);
        saveState();
    }

    // Animate out
    currentCard.classList.add('slide-out-left');

    // Wait for animation then load next
    setTimeout(() => {
        state.currentCardIndex++;
        renderCurrentCard();
    }, 300);
}

function prevCard() {
    if (state.currentCardIndex <= 0) return;

    const currentCard = elements.deck.stack.querySelector('.card');
    // Animate out to right (reverse)
    if (currentCard) {
        currentCard.style.transform = 'translateX(120%) rotate(10deg)';
        currentCard.style.opacity = '0';
    }

    setTimeout(() => {
        state.currentCardIndex--;
        renderCurrentCard();
    }, 300);
}

function updateNavButtons() {
    const filteredFacts = getFilteredFacts();
    elements.deck.prevBtn.disabled = state.currentCardIndex <= 0;
    elements.deck.nextBtn.disabled = state.currentCardIndex >= filteredFacts.length - 1;
}

// Favorites Logic
function toggleFavorite(id, btnElement) {
    const index = state.favorites.indexOf(id);
    if (index === -1) {
        state.favorites.push(id);
        btnElement.classList.add('active');
    } else {
        state.favorites.splice(index, 1);
        btnElement.classList.remove('active');

        // If we are in "Favoris" view, we might want to remove the card or just update
        if (state.currentCategory === 'favoris') {
            // If we remove the current card from favorites while viewing favorites,
            // we should probably re-render to show the next one or empty state.
            // But for smooth UX, maybe just let it stay until navigation?
            // Let's re-render to reflect state immediately if it was the last one.
            // Actually, re-rendering might be jarring. Let's leave it for now.
        }
    }
    saveState();
}

// Storage
function saveState() {
    localStorage.setItem('annecdote_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('annecdote_state');
    if (saved) {
        const savedState = JSON.parse(saved);
        state.seenCards = savedState.seenCards || [];
        state.favorites = savedState.favorites || [];
        state.currentTheme = savedState.currentTheme || 'general';
        state.currentMode = savedState.currentMode || 'fun_fact';
    }
}

// Expose functions
window.setCategory = setCategory;
window.setTheme = setTheme;
window.setMode = setMode;
window.toggleFavorite = toggleFavorite;

// Run
init();
