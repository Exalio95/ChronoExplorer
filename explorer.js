document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Loading from data_episodes.js
    if (typeof episodesData === 'undefined') {
        console.error("episodesData is not defined. Check data loading.");
        return;
    }

    // ---------------------------------------------------------
    // i18n Logic
    // ---------------------------------------------------------
    let currentLang = localStorage.getItem('app_lang') || 'fr';

    // Global helper for other modules
    window.t = (key) => {
        if (!translations[currentLang] || !translations[currentLang][key]) {
            // Fallback to FR if missing
            return translations['fr'][key] || key;
        }
        return translations[currentLang][key];
    };

    const updateStaticParams = () => {
        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = window.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = window.t(key);
        });

        // Update Toggle Button Text
        const langLabel = document.getElementById('currentLangLabel');
        if (langLabel) langLabel.textContent = currentLang.toUpperCase();
    };

    // Toggle Language
    const toggleLanguage = () => {
        currentLang = currentLang === 'fr' ? 'en' : 'fr';
        localStorage.setItem('app_lang', currentLang);
        updateStaticParams();
        renderFilters(); // Re-render filters (names)
        renderEpisodes(searchInput.value); // Re-render cards

        // Notify user/console
        console.log("Language switched to:", currentLang);
    };

    // Bind Toggle Button
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Initial Translation Update
    updateStaticParams();
    // ---------------------------------------------------------


    // Helper: Determine Era
    const getEra = (year) => {
        if (year < -3000) return window.t("js.era.prehistory");
        if (year < 476) return window.t("js.era.antiquity");
        if (year < 1492) return window.t("js.era.middle_ages");
        if (year < 1789) return window.t("js.era.modern");
        return window.t("js.era.contemporary");
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
    const getPriority = (cards, episodeId) => {
        // Use Global Manual Override if available
        if (typeof manualEpisodePriorities !== 'undefined' && manualEpisodePriorities[episodeId]) {
            return manualEpisodePriorities[episodeId];
        }

        if (!cards || cards.length === 0) return 3;
        // Find the minimum priority value (1 is highest importance)
        const priorities = cards.map(c => c.priority || 3);
        return Math.min(...priorities);
    };

    // Moved priorityMap to function to be dynamic
    const getPriorityInfo = (p) => {
        const map = {
            1: { label: window.t("js.prio.1"), icon: "🏆", class: "prio-1" },
            2: { label: window.t("js.prio.2"), icon: "📜", class: "prio-2" },
            3: { label: window.t("js.prio.3"), icon: "💎", class: "prio-3" }
        };
        return map[p] || map[3];
    };

    // Convert to internal format (NOTE: This runs once at load, so we need to RE-RUN it or make properties dynamic)
    // Actually, we must process 'era' dynamically if we want it to translate. 
    // BUT 'episodesList' is built once. 
    // STRATEGY: Store 'internalEraKey' or recalculate 'era' display name on render.
    // Let's keep it simple: WE REBUILD episodesList on render? No, too heavy.
    // We will just store the Era Key (e.g. "Préhistoire" is effectively a key, but let's make it English-safe or strict).
    // Actually, getEra returns the localized string. If we change lang, we need to update this.

    // BETTER APPROACH: Keep 'era' as raw value in list, and translate ON RENDER.
    let episodesList = episodesData.map(ep => {
        let year = 0;
        const match = (ep.title || "").match(/^(-?[\d\s]+)\s*:/);
        if (match) {
            year = parseInt(match[1].replace(/\s/g, ''));
        }

        // We calculate Era Key here
        const eraKey = (year < -3000) ? "prehistory" :
            (year < 476) ? "antiquity" :
                (year < 1492) ? "middle_ages" :
                    (year < 1789) ? "modern" : "contemporary";

        const topTags = getTopTags(ep.cards || []);
        const priority = getPriority(ep.cards || [], ep.id);

        return {
            name: ep.title,           // Store French title (default)
            name_en: ep.title_en,     // Store English title if available
            originalName: ep.title,
            id: ep.id,
            year: year,
            eraKey: eraKey,           // Stable key
            priority: priority,
            topTags: topTags,
            cards: ep.cards || [],
            count: (ep.cards || []).length
        };
    });

    // Sort Chronologically
    episodesList.sort((a, b) => a.year - b.year);

    // Expose globally for Quiz and other modules
    window.allEpisodes = episodesList;


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
    const playerBgImage = document.getElementById('playerBackgroundImage');

    // State
    let currentEpisode = null;
    let currentCardIndex = 0;

    // Filter State
    let selectedEraKeys = new Set(); // Changed to store keys
    let selectedPriorities = new Set();
    let selectedTags = new Set();


    // 3. Render Filters
    const renderFilters = () => {
        // Eras
        const eraKeys = ["prehistory", "antiquity", "middle_ages", "modern", "contemporary"];
        eraFiltersContainer.innerHTML = '';
        eraKeys.forEach(key => {
            // Count episodes in this era
            const count = episodesList.filter(ep => ep.eraKey === key).length;
            if (count === 0) return;

            // Localize label
            const labelText = window.t("js.era." + key);

            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${key}" ${selectedEraKeys.has(key) ? 'checked' : ''}> ${labelText} <span style="opacity:0.5; font-size:0.8em;">(${count})</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) selectedEraKeys.add(key);
                else selectedEraKeys.delete(key);
                renderEpisodes(searchInput.value);
            });
            eraFiltersContainer.appendChild(label);
        });



        // Priority Filters
        const priorities = [1, 2, 3];
        priorityFiltersContainer.innerHTML = '';
        priorities.forEach(p => {
            const info = getPriorityInfo(p);
            const count = episodesList.filter(ep => ep.priority === p).length;
            if (count === 0) return;

            const label = document.createElement('label');
            // Use icon in label for fun
            label.innerHTML = `
                <input type="checkbox" value="${p}" ${selectedPriorities.has(p) ? 'checked' : ''}> <span class="${info.class}">${info.icon} ${info.label}</span> <span style="opacity:0.5; font-size:0.8em;">(${count})</span>
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

    // Helper: Get Episode Image Path
    const getEpisodeImage = (ep) => {
        return `images/img_ep_${ep.id}.webp`;
    };

    // Helper: Get Era Fallback Image
    const getEraImage = (eraKey) => {
        const eraImages = {
            "prehistory": "images/img_era_prehistory.webp",
            "antiquity": "images/img_era_antiquity.webp",
            "middle_ages": "images/img_era_middleages.webp",
            "modern": "images/img_era_modern.webp",
            "contemporary": "images/img_era_contemporary.webp"
        };
        return eraImages[eraKey] || "images/img_era_antiquity.webp";
    };

    // 3b. Render Episodes Grid
    const renderEpisodes = (filterText = '') => {
        gridContainer.innerHTML = '';

        const filtered = episodesList.filter(ep => {
            const localName = (currentLang === 'en' && ep.name_en) ? ep.name_en : ep.name;
            const matchesText = localName.toLowerCase().includes(filterText.toLowerCase());
            const matchesEra = selectedEraKeys.size === 0 || selectedEraKeys.has(ep.eraKey);
            const matchesPriority = selectedPriorities.size === 0 || selectedPriorities.has(ep.priority);

            // Matches Tags
            const matchesTags = selectedTags.size === 0 || ep.topTags.some(t => selectedTags.has(t));

            return matchesText && matchesEra && matchesPriority && matchesTags;
        });

        // Localized Stats
        const totalCards = filtered.reduce((sum, ep) => sum + ep.count, 0);
        statsBadgeEl.innerHTML = `${filtered.length} / ${episodesList.length} <span data-i18n="header.stats_episodes">${window.t("header.stats_episodes")}</span> <span style="opacity:0.5; margin:0 0.5rem">|</span> ${totalCards} <span data-i18n="header.stats_cards">${window.t("header.stats_cards")}</span>`;

        if (filtered.length === 0) {
            document.getElementById('noResults').classList.remove('hidden');
        } else {
            document.getElementById('noResults').classList.add('hidden');
        }

        // --- MYSTERY EPISODE CARD ---
        if (filterText === '') {
            const mysteryCardEl = document.createElement('div');
            mysteryCardEl.className = 'card-item mystery-card';
            mysteryCardEl.style.border = '2px solid var(--accent-gold)';

            mysteryCardEl.innerHTML = `
                <div class="card-bg-container">
                    <img src="images/mystery_episode.webp" class="card-bg" alt="Épisode Mystère">
                    <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(100, 80, 0, 0.3));"></div>
                </div>
                <div class="card-body" style="text-align: center; padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="flex-grow: 1;">
                         <div class="priority-badge" style="background: var(--accent-gold); color:black;"><i class="fa-solid fa-question"></i> <span class="badge-text" data-i18n="mystery.special">${window.t("mystery.special")}</span></div>
                    </div>
                    <span class="card-category" style="margin-bottom:0.5rem; display:block; color:var(--accent-gold); font-size:0.8rem;" data-i18n="mystery.tag">${window.t("mystery.tag")}</span>
                    <h3 class="card-title" style="font-size: 1.4rem; color: var(--accent-gold); text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);" data-i18n="mystery.title">${window.t("mystery.title")}</h3>
                    
                    <div class="card-tags" style="justify-content:center; margin-bottom:1rem;">
                        <span class="mini-tag" style="background: var(--accent-gold); color:black;">#Random</span>
                    </div>

                    <span class="mini-tag" style="background:rgba(0,0,0,0.6); border:1px solid var(--accent-gold); align-self: center;" data-i18n="mystery.action">${window.t("mystery.action")}</span>
                </div>
            `;

            mysteryCardEl.addEventListener('click', () => {
                let candidates = episodesList;
                if (window.auth) {
                    const history = window.auth.getUserHistory();
                    const unread = episodesList.filter(ep => {
                        const data = history.get(ep.id);
                        return !data || !data.finished;
                    });
                    if (unread.length > 0) candidates = unread;
                }
                const randomEp = candidates[Math.floor(Math.random() * candidates.length)];
                startEpisode(randomEp);
            });

            gridContainer.appendChild(mysteryCardEl);
        }
        // ---------------------------

        filtered.forEach((ep) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-item';
            cardEl.dataset.id = ep.id;

            const bgImage = getEpisodeImage(ep);
            const fallbackImage = getEraImage(ep.eraKey);

            // Create Tags HTML
            const tagsHtml = ep.topTags.slice(0, 3).map(tag => `<span class="mini-tag">#${tag}</span>`).join('');

            // Priority Badge
            const pInfo = getPriorityInfo(ep.priority);

            // Localize Title
            const displayTitle = (currentLang === 'en' && ep.name_en) ? ep.name_en : ep.name;
            const displayEra = window.t("js.era." + ep.eraKey);

            cardEl.innerHTML = `
                <div class="card-bg-container">
                    <img src="${bgImage}" class="card-bg" alt="${displayTitle}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';">
                    <div class="card-overlay"></div>
                </div>
                <div class="card-body" style="text-align: center; padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="flex-grow: 1;">
                         <div class="priority-badge ${pInfo.class}" title="${pInfo.label}">${pInfo.icon} <span class="badge-text">${pInfo.label}</span></div>
                    </div>
                    <span class="card-category" style="margin-bottom:0.5rem; display:block; color:var(--accent-gold); font-size:0.8rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${displayEra}</span>
                    <h3 class="card-title" style="font-size: 1.4rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${displayTitle}</h3>
                    
                    <div class="card-tags" style="justify-content:center; margin-bottom:1rem;">
                        ${tagsHtml}
                    </div>

                    <span class="mini-tag" style="background:rgba(0,0,0,0.6); border:1px solid var(--accent-blue); align-self: center;">${ep.count} <span data-i18n="js.cards_count">${window.t("js.cards_count")}</span></span>
                </div>
            `;

            cardEl.addEventListener('click', () => startEpisode(ep));
            gridContainer.appendChild(cardEl);
        });
    };

    // 4. Player Logic (Same as before)
    const startEpisode = (episode) => {
        currentEpisode = episode;

        // Resume logic
        let startIndex = 0;
        if (window.auth) {
            const history = window.auth.getUserHistory();
            if (history.has(episode.id)) {
                // If finished, restart? Or stay finished? Usually restart if they click again.
                // But if IN PROGRESS, resume.
                const data = history.get(episode.id);
                if (!data.finished) {
                    startIndex = data.lastIndex;
                }
            }
        }

        currentCardIndex = startIndex;
        updatePlayerUI('default');
        playerOverlay.classList.remove('hidden');
    };

    const updatePlayerUI = (direction = 'default') => {
        if (!currentEpisode) return;
        const card = currentEpisode.cards[currentCardIndex];

        // Localized Content
        const displayTitle = (currentLang === 'en' && currentEpisode.name_en) ? currentEpisode.name_en : currentEpisode.name;
        playerTitle.textContent = displayTitle;

        playerProgress.textContent = `${currentCardIndex + 1} / ${currentEpisode.count}`;
        progressBar.style.width = `${((currentCardIndex + 1) / currentEpisode.count) * 100}%`;

        activeCardEl.classList.remove('slide-in', 'slide-in-right', 'slide-in-left');
        void activeCardEl.offsetWidth;

        const bgImage = getEpisodeImage(currentEpisode);
        const fallbackImage = getEraImage(currentEpisode.eraKey);

        // Update Fullscreen Background
        if (playerBgImage) {
            playerBgImage.src = bgImage;
            playerBgImage.onerror = () => {
                playerBgImage.src = fallbackImage;
                playerBgImage.onerror = null; // Prevent infinite loop
            };
        }

        // Set class for animation logic
        if (direction === 'next') {
            activeCardEl.classList.add('slide-in-right');
        } else if (direction === 'prev') {
            activeCardEl.classList.add('slide-in-left');
        } else {
            activeCardEl.classList.add('slide-in');
        }

        // Render Card Content (Title, Detail, Tags)
        const content = (currentLang === 'en' && card.content_en) ? card.content_en : card.content;
        const detail = (currentLang === 'en' && card.detail_en) ? card.detail_en : card.detail;

        activeCardEl.innerHTML = `
            <div class="player-card-content">
                <h2>${content}</h2>
                <div class="card-tags" style="justify-content: center; margin-top:1rem;">
                    ${card.tags ? card.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('') : ''}
                </div>
                <div class="player-card-detail">
                    ${detail}
                </div>
            </div>
        `;
    };

    const nextCard = () => {
        if (currentCardIndex < currentEpisode.count - 1) {
            currentCardIndex++;
            updatePlayerUI('next');
            // Save Progress
            if (window.auth) window.auth.saveProgress(currentEpisode.id, currentCardIndex, currentEpisode.count);
        } else {
            // End of episode (Finished)
            if (window.auth) window.auth.saveProgress(currentEpisode.id, currentCardIndex, currentEpisode.count);
            closePlayer();
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updatePlayerUI('prev');
            // Save Progress
            if (window.auth) window.auth.saveProgress(currentEpisode.id, currentCardIndex, currentEpisode.count);
        }
    };

    // Tap to Navigate (Left/Right zones)
    playerOverlay.addEventListener('click', (e) => {
        // Ignore if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('.player-card')) return;

        const width = window.innerWidth;
        const x = e.clientX;

        // Left 30% -> Prev
        if (x < width * 0.3) {
            prevCard();
        }
        // Right 30% -> Next
        else if (x > width * 0.7) {
            nextCard();
        }
    });

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

        // Check Login Modal
        setTimeout(() => {
            if (!localStorage.getItem('auth_refused') && (!firebase.auth().currentUser)) {
                const m = document.getElementById('loginModal');
                if (m) m.classList.remove('hidden');
            }
        }, 1500);



        // --- Quiz Integration ---
        window.startQuizAction = function () {
            const onlyWatched = document.getElementById('quizOnlyWatched').checked;

            // Get Selected Eras
            const selectedEras = [];
            document.querySelectorAll('#quizEraFilters input:checked').forEach(cb => {
                selectedEras.push(cb.value);
            });

            // Start Quiz
            window.quiz.startQuiz({
                onlyWatched: onlyWatched,
                eras: selectedEras
            });
        };

        // Helper to copy filters to modal
        function populateQuizFilters() {
            const container = document.getElementById('quizEraFilters');
            if (!container) return;

            // Get unique Eras
            const eraKeys = ["prehistory", "antiquity", "middle_ages", "modern", "contemporary"];

            container.innerHTML = eraKeys.map(key => {
                const label = window.t("js.era." + key);
                return `
            <label style="display:block; padding:0.5rem; cursor:pointer;">
                <input type="checkbox" value="${key}" style="margin-right:8px;"> 
                ${label}
            </label>
        `}).join('');
        }

        // Bind open event to populate filters
        const quizBtn = document.getElementById('headerQuizBtn');
        if (quizBtn) {
            quizBtn.addEventListener('click', populateQuizFilters);
        }
    });

