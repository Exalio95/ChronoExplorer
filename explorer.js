document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Loading from data_episodes.js
    if (typeof episodesData === 'undefined') {
        console.error("episodesData is not defined. Check data loading.");
        return;
    }

    // Helper: Determine Era
    const getEra = (year) => {
        if (year < -3000) return "Préhistoire";
        if (year < 476) return "Antiquité";
        if (year < 1492) return "Moyen Âge";
        if (year < 1789) return "Temps Modernes";
        return "Époque Contemporaine";
    };

    // Helper: Get Top 3 Tags
    const getTopTags = (cards) => {
        const tagCounts = {};
        cards.forEach(card => {
            if (card.tags) {
                card.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .slice(0, 3) // Take top 3
            .map(entry => entry[0]);
    };

    // Helper: Get Episode Priority
    // 1 (Highest) -> "Légendaire", 2 -> "Marquant", 3 -> "Insolite"
    const getPriority = (cards) => {
        if (!cards || cards.length === 0) return 3;
        // Find the minimum priority value (1 is highest importance)
        const priorities = cards.map(c => c.priority || 3);
        return Math.min(...priorities);
    };

    const priorityMap = {
        1: { label: "Incontournable", icon: "🏆", class: "prio-1" },
        2: { label: "Essentiel", icon: "📜", class: "prio-2" },
        3: { label: "Insolite", icon: "💎", class: "prio-3" }
    };

    // Convert to internal format
    let episodesList = episodesData.map(ep => {
        let year = 0;
        const match = (ep.title || "").match(/^(-?[\d\s]+)\s*:/);
        if (match) {
            year = parseInt(match[1].replace(/\s/g, ''));
        }

        const era = getEra(year);
        const topTags = getTopTags(ep.cards || []);
        const priority = getPriority(ep.cards || []);

        return {
            name: ep.title,
            originalName: ep.title,
            id: ep.id,
            year: year,
            era: era,
            priority: priority,
            topTags: topTags,
            cards: ep.cards || [],
            count: (ep.cards || []).length
        };
    });

    // Sort Chronologically
    episodesList.sort((a, b) => a.year - b.year);

    // 2. DOM Elements
    const gridContainer = document.getElementById('cardsGrid');
    const searchInput = document.getElementById('searchInput');
    const statsBadgeEl = document.querySelector('.stats-badge');
    const eraFiltersContainer = document.getElementById('eraFilters');
    const priorityFiltersContainer = document.getElementById('priorityFilters'); // New Priority Container
    // We might add tag filters later if needed, but user asked specifically for functionality
    // The previous code had `tagFilters` container.
    const tagFiltersContainer = document.getElementById('tagFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    // Player Elements
    const playerOverlay = document.getElementById('episodePlayer');
    const playerTitle = document.getElementById('playerTitle');
    const playerProgress = document.getElementById('playerProgress');
    const activeCardEl = document.getElementById('activeCard');
    const progressBar = document.getElementById('progressBar');
    const nextBtn = document.getElementById('nextCard');
    const prevBtn = document.getElementById('prevCard');
    const closePlayerBtn = document.getElementById('closePlayer');

    // State
    let currentEpisode = null;
    let currentCardIndex = 0;

    // Filter State
    let selectedEras = new Set();
    let selectedPriorities = new Set(); // New Priority State
    let selectedTags = new Set(); // If we implement tag filtering

    // 3. Render Filters
    const renderFilters = () => {
        // Eras
        const eras = ["Préhistoire", "Antiquité", "Moyen Âge", "Temps Modernes", "Époque Contemporaine"];
        eraFiltersContainer.innerHTML = '';
        eras.forEach(era => {
            // Count episodes in this era
            const count = episodesList.filter(ep => ep.era === era).length;
            if (count === 0) return;

            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${era}"> ${era} <span style="opacity:0.5; font-size:0.8em;">(${count})</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) selectedEras.add(era);
                else selectedEras.delete(era);
                renderEpisodes(searchInput.value);
            });
            eraFiltersContainer.appendChild(label);
        });



        // Priority Filters
        const priorities = [1, 2, 3];
        priorityFiltersContainer.innerHTML = '';
        priorities.forEach(p => {
            const info = priorityMap[p];
            const count = episodesList.filter(ep => ep.priority === p).length;
            if (count === 0) return;

            const label = document.createElement('label');
            // Use icon in label for fun
            label.innerHTML = `
                <input type="checkbox" value="${p}"> <span class="${info.class}">${info.icon} ${info.label}</span> <span style="opacity:0.5; font-size:0.8em;">(${count})</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                if (e.target.checked) selectedPriorities.add(val);
                else selectedPriorities.delete(val);
                renderEpisodes(searchInput.value);
            });
            priorityFiltersContainer.appendChild(label);
        });

        // Top Global Tags Filter
        // Aggregate ALL tags from all episodes (using topTags of each episode to represent the episode's main themes)
        const allTagCounts = {};
        episodesList.forEach(ep => {
            ep.topTags.forEach(t => allTagCounts[t] = (allTagCounts[t] || 0) + 1);
        });

        // Sort by frequency
        const sortedTags = Object.entries(allTagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15) // Top 15 tags
            .map(e => e[0]);

        tagFiltersContainer.innerHTML = '';
        sortedTags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.textContent = tag;
            pill.addEventListener('click', () => {
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag);
                    pill.className = 'tag-pill';
                } else {
                    selectedTags.add(tag);
                    pill.className = 'tag-pill active';
                }
                renderEpisodes(searchInput.value);
            });
            tagFiltersContainer.appendChild(pill);
        });
    };

    // Helper: Get Episode Image
    const getEpisodeImage = (ep) => {
        const eraImages = {
            "Préhistoire": "img_era_prehistory.png",
            "Antiquité": "img_era_antiquity.png",
            "Moyen Âge": "img_era_middleages.png",
            "Temps Modernes": "img_era_modern.png",
            "Époque Contemporaine": "img_era_contemporary.png"
        };
        // List of episodes with specific custom images
        const specificImages = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 89]);

        if (specificImages.has(ep.id)) {
            return `img_ep_${ep.id}.png`;
        } else {
            return eraImages[ep.era] || "img_era_antiquity.png";
        }
    };

    // 3b. Render Episodes Grid
    const renderEpisodes = (filterText = '') => {
        gridContainer.innerHTML = '';

        const filtered = episodesList.filter(ep => {
            const matchesText = ep.name.toLowerCase().includes(filterText.toLowerCase());
            const matchesEra = selectedEras.size === 0 || selectedEras.has(ep.era);
            const matchesPriority = selectedPriorities.size === 0 || selectedPriorities.has(ep.priority);

            // Matches Tags (if any selected, must have at least one of the selected tags in its topTags)
            // Or should it be strictly containing? Usually 'inclusive' filter is better for discovery.
            const matchesTags = selectedTags.size === 0 || ep.topTags.some(t => selectedTags.has(t));

            return matchesText && matchesEra && matchesPriority && matchesTags;
        });

        const totalCards = filtered.reduce((sum, ep) => sum + ep.count, 0);
        statsBadgeEl.innerHTML = `${filtered.length} / ${episodesList.length} Ép. <span style="opacity:0.5; margin:0 0.5rem">|</span> ${totalCards} Cartes`;

        if (filtered.length === 0) {
            document.getElementById('noResults').classList.remove('hidden');
        } else {
            document.getElementById('noResults').classList.add('hidden');
        }

        filtered.forEach((ep, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-item';
            // Custom animation removed for performance
            // cardEl.style.animationDelay = `${index * 50}ms`;

            const bgImage = getEpisodeImage(ep);

            // Create Tags HTML - Limit to 3 visual tags
            const tagsHtml = ep.topTags.slice(0, 3).map(tag => `<span class="mini-tag">#${tag}</span>`).join('');

            // Priority Badge
            const pInfo = priorityMap[ep.priority] || priorityMap[3]; // Default to 3
            const badgeHtml = `<div class="priority-badge ${pInfo.class}" title="${pInfo.label}">${pInfo.icon} <span class="badge-text">${pInfo.label}</span></div>`;

            cardEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('${bgImage}')`;
            cardEl.style.backgroundSize = 'cover';
            cardEl.style.backgroundPosition = 'center';

            cardEl.innerHTML = `
                <div class="card-body" style="text-align: center; padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="flex-grow: 1;"></div>
                    <span class="card-category" style="margin-bottom:0.5rem; display:block; color:var(--accent-gold); font-size:0.8rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${ep.era}</span>
                    <h3 class="card-title" style="font-size: 1.4rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${ep.name}</h3>
                    
                    <div class="card-tags" style="justify-content:center; margin-bottom:1rem;">
                        ${tagsHtml}
                    </div>

                    <span class="mini-tag" style="background:rgba(0,0,0,0.6); border:1px solid var(--accent-blue); align-self: center;">${ep.count} Cartes</span>
                </div>
            `;
            cardEl.addEventListener('click', () => startEpisode(ep));
            gridContainer.appendChild(cardEl);
        });
    };

    // 4. Player Logic (Same as before)
    const startEpisode = (episode) => {
        currentEpisode = episode;
        currentCardIndex = 0;
        updatePlayerUI('default');
        playerOverlay.classList.remove('hidden');
    };

    const updatePlayerUI = (direction = 'default') => {
        if (!currentEpisode) return;
        const card = currentEpisode.cards[currentCardIndex];

        playerTitle.textContent = currentEpisode.name;
        playerProgress.textContent = `${currentCardIndex + 1} / ${currentEpisode.count}`;
        progressBar.style.width = `${((currentCardIndex + 1) / currentEpisode.count) * 100}%`;

        activeCardEl.classList.remove('slide-in', 'slide-in-right', 'slide-in-left');
        void activeCardEl.offsetWidth;

        const bgImage = getEpisodeImage(currentEpisode);
        activeCardEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${bgImage}')`;
        activeCardEl.style.backgroundSize = 'cover';
        activeCardEl.style.backgroundPosition = 'center';

        if (direction === 'next') {
            activeCardEl.classList.add('slide-in-right');
        } else if (direction === 'prev') {
            activeCardEl.classList.add('slide-in-left');
        } else {
            activeCardEl.classList.add('slide-in');
        }

        activeCardEl.innerHTML = `
            <div class="player-card-content">
                <h2>${card.content}</h2>
                <div class="card-tags" style="justify-content: center; margin-top:1rem;">
                    ${card.tags ? card.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('') : ''}
                </div>
                <div class="player-card-detail">
                    ${card.detail}
                </div>
            </div>
        `;
    };

    const nextCard = () => {
        if (currentCardIndex < currentEpisode.count - 1) {
            currentCardIndex++;
            updatePlayerUI('next');
        } else {
            closePlayer();
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updatePlayerUI('prev');
        }
    };

    const closePlayer = () => {
        playerOverlay.classList.add('hidden');
        currentEpisode = null;
    };

    // Event Listeners
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);
    closePlayerBtn.addEventListener('click', closePlayer);

    document.addEventListener('keydown', (e) => {
        if (!playerOverlay.classList.contains('hidden')) {
            if (e.key === 'ArrowRight' || e.key === 'Space') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === 'Escape') closePlayer();
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderEpisodes(e.target.value);
    });

    resetFiltersBtn.addEventListener('click', () => {
        selectedEras.clear();
        selectedTags.clear();
        document.querySelectorAll('#eraFilters input').forEach(cb => cb.checked = false);
        document.querySelectorAll('.tag-pill').forEach(pill => pill.classList.remove('active'));
        searchInput.value = '';
        renderEpisodes();
    });

    // Touch Swipe Logic
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    };

    const handleSwipe = () => {
        const threshold = 50; // min distance
        if (touchEndX < touchStartX - threshold) {
            nextCard(); // Swipe Left -> Next
        }
        if (touchEndX > touchStartX + threshold) {
            prevCard(); // Swipe Right -> Prev
        }
    };

    activeCardEl.addEventListener('touchstart', handleTouchStart);
    activeCardEl.addEventListener('touchend', handleTouchEnd);

    // Mobile Filter Toggle Logic
    const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
             sidebar.classList.toggle('active');
             // Update icon or text if needed?
        });
    }

    // Initial Render
    renderFilters();
    renderEpisodes();
});
