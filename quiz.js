/**
 * QuizManager - Gère la logique des quizz (génération, jeu, score)
 */
class QuizManager {
    constructor() {
        this.allQuestions = []; // Pool complet
        this.currentQuiz = [];  // Les 10 questions de la partie
        this.currentIndex = 0;
        this.score = 0;
        this.historyFilter = false; // "Vu seulement"
        this.selectedEras = [];     // Filtres époques
    }

    /**
     * Charge toutes les questions disponibles depuis les fichiers globaux quiz_ep*
     */
    loadAllQuestions() {
        this.allQuestions = [];
        // On cherche toutes les variables globales qui commencent par "quiz_ep"
        // Note: C'est un peu "hacky" mais efficace vu notre structure de fichiers multiples sans modules
        Object.keys(window).forEach(key => {
            if (key.startsWith('quiz_ep') && typeof window[key] === 'object') {
                const quizData = window[key];
                // On ajoute l'ID de l'épisode à chaque question pour référence
                const questions = quizData.questions.map(q => ({
                    ...q,
                    episodeId: quizData.episodeId,
                    episodeTitle: quizData.title
                }));
                this.allQuestions.push(...questions);
            }
        });
        console.log(`QuizManager: ${this.allQuestions.length} questions chargées.`);
    }

    /**
     * Génère une liste d'IDs de questions pour un duel
     */
    generateDuelQuestions(config) {
        this.loadAllQuestions();
        let pool = this.allQuestions;

        // Apply filters same as startQuiz
        if (config.eras && config.eras.length > 0) {
            pool = pool.filter(q => {
                const ep = window.allEpisodes.find(e => e.id === q.episodeId);
                return ep && config.eras.includes(ep.era);
            });
        }

        // We do NOT filter by 'watched' for duels to ensure fairness (both must have same pool possibility)
        // Or we warn the user. For now, we take from global pool.

        if (pool.length < 10) return [];

        const shuffled = this.shuffleArray([...pool]); // Copy before shuffle
        // We need to return identifiers. unique ID = episodeId + index in episode array?
        // Or we just store the full question objects? Storing objects is heavier but easier.
        // Storing IDs is better. We don't have unique question IDs.
        // Let's store objects for simplicity in prototype, or generate temporary IDs.
        // Actually, we can just return the objects for now, and social.js will save them. 
        // Firestore limit is 1MB, 10 questions is fine.
        return shuffled.slice(0, 10);
    }

    /**
     * Lance un duel spécifique
     */
    async startDuel(duelId, questionData) {
        console.log("⚔️ startDuel called with:", duelId);
        // Debug Log
        if (questionData && questionData.length > 0) {
            console.log("First question sample:", questionData[0]);
        } else {
            console.warn("⚠️ questionData appears empty or invalid:", questionData);
        }

        this.isDuel = true;
        this.duelId = duelId;
        this.currentQuiz = [];
        this.score = 0;
        this.currentIndex = 0;

        // 1. Flatten
        const flatData = Array.isArray(questionData) ? questionData.flat(Infinity) : [questionData];

        if (flatData.length === 0 || !flatData[0]) {
            console.error("❌ No valid questions provided to startDuel");
            alert(`Erreur Technique: Données questions manquantes ou vides. (Type: ${typeof questionData})`);
            return;
        }

        // 2. Direct Object Usage (Standard Path)
        // Check if first item looks like a question object (has 'question' and 'options')
        if (typeof flatData[0] === 'object' && flatData[0].question) {
            console.log("✅ Loaded questions directly from duel data.");
            this.currentQuiz = flatData;
        }
        // 3. Legacy ID Fallback
        else {
            console.log("⚠️ Legacy Mode: Attempting to resolve IDs in startDuel...");
            // Only load if strictly necessary (expensive)
            if (this.allQuestions.length === 0) {
                this.loadAllQuestions();
            }

            // Create Map
            const qMap = new Map();
            this.allQuestions.forEach(q => {
                if (q.id) qMap.set(String(q.id), q);
            });

            flatData.forEach(item => {
                const id = (typeof item === 'object') ? String(item.id) : String(item);
                const q = qMap.get(id);
                if (q) this.currentQuiz.push(q);
            });
        }

        // Final Check
        if (this.currentQuiz.length === 0) {
            console.error("❌ startDuel failed: No valid questions loaded from data.");
            alert(`ECHEC CHARGEMENT (NOUVELLE VERSION)\nFormat: ${typeof flatData[0]}\nExemple: ${JSON.stringify(flatData[0]).substring(0, 100)}`);
            return;
        }

        // Hide Social UI
        if (document.getElementById('socialModal')) {
            document.getElementById('socialModal').classList.add('hidden');
        }

        this.showPlayer();
        this.renderQuestion();
    }

    /**
     * Start standard quiz
     */
    startQuiz(config) {
        this.isDuel = false;
        this.duelId = null;

        this.loadAllQuestions(); // Recharger au cas où

        // 1. Filtrer
        let pool = this.allQuestions;

        // Filtre "Episodes Vus"
        if (config.onlyWatched) {
            const history = window.auth.getUserHistory(); // Map<id, data>
            pool = pool.filter(q => {
                const epData = history.get(q.episodeId);
                return epData && epData.finished;
            });
        }

        // Filtre "Epoques" (Si on a implémenté le lien Episode -> Epoque dans les données quiz ou master)
        // Pour l'instant, l'info époque n'est pas directement dans l'objet quiz_ep.
        // On doit récupérer l'époque via masterEpisodes ou data_episodes.js
        if (config.eras && config.eras.length > 0) {
            pool = pool.filter(q => {
                // On cherche l'épisode dans la liste globale pour avoir son époque
                const ep = window.allEpisodes.find(e => e.id === q.episodeId);
                return ep && config.eras.includes(ep.era);
            });
        }

        if (pool.length < 10) {
            alert(`Pas assez de questions trouvées (${pool.length}). Essayez d'élargir vos filtres !`);
            return;
        }

        // 2. Mélanger et prendre 10
        this.currentQuiz = this.shuffleArray(pool).slice(0, 10);
        this.currentIndex = 0;
        this.score = 0;

        // 3. UI
        this.showPlayer();
        this.renderQuestion();
    }

    /**
     * Utilitaire de mélange (Fisher-Yates)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }



    /**
     * Affiche l'interface du joueur
     */
    showPlayer() {
        document.getElementById('quizConfigModal').classList.add('hidden');
        document.getElementById('quizPlayer').classList.remove('hidden');
    }

    /**
     * Affiche la question courante
     */
    renderQuestion() {
        const q = this.currentQuiz[this.currentIndex];
        const container = document.getElementById('quizCardContainer');
        const bgImageEl = document.getElementById('quizBackgroundImage');

        // Lookup Episode Data in Global Context
        let epTitle = `Épisode ${q.episodeId}`;
        let epImage = '';

        if (window.allEpisodes) {
            const epData = window.allEpisodes.find(e => e.id === q.episodeId);
            if (epData) {
                // Determine format
                // User wants harmonized title: "Year : Title"
                // `epData.name` typically contains "Year : Title" (cf explorer.js parsing)
                epTitle = epData.name;

                if (epData.cards && epData.cards.length > 0) {
                    // Use standard image path convention instead of raw data path
                    epImage = `images/img_ep_${q.episodeId}.webp`; // Use new WebP
                }
            }
        }

        // Update Fullscreen Background
        if (bgImageEl) {
            if (epImage) {
                bgImageEl.src = epImage;
                bgImageEl.style.display = 'block';
            } else {
                bgImageEl.style.display = 'none'; // Fallback to gradient
            }
        }

        // Update Progress
        document.getElementById('quizProgress').innerText = `Question ${this.currentIndex + 1} / 10`;
        const percent = ((this.currentIndex) / 10) * 100;
        document.getElementById('quizProgressBar').style.width = `${percent}%`;

        // ---------------------------------------------------------
        // RANDOMIZATION LOGIC
        // ---------------------------------------------------------
        // Create objects with text and original index
        let optionsWithIndex = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

        // Shuffle them
        this.currentShuffledOptions = this.shuffleArray(optionsWithIndex);

        // Template HTML de la carte question
        container.innerHTML = `
            <div class="quiz-question-card glass-panel animate-in">
                <!-- Title harmonized with Player Title -->
                 <h2 class="quiz-title-harmonized">${epTitle}</h2>
                
                <h3 class="quiz-question-text" style="text-align:center;">${q.question}</h3>
                
                <div class="quiz-options">
                    ${this.currentShuffledOptions.map((optObj, visualIdx) => `
                        <button class="btn-quiz-option" onclick="quiz.handleAnswer(${visualIdx})">
                            ${optObj.text}
                        </button>
                    `).join('')}
                </div>

                <div id="quizFeedback" class="quizFeedback hidden">
                    <!-- Injection JS pour le résultat -->
                </div>
                
                <button id="nextQuestionBtn" class="btn-next-quiz hidden" onclick="quiz.nextQuestion()">
                    Question Suivante <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
    }

    /**
     * Gère le clic sur une réponse
     */
    handleAnswer(visualIndex) {
        const q = this.currentQuiz[this.currentIndex];
        // Need to target specific element for this instance of render if multiple?
        // But here ID is unique.
        // const feedback = container = ... (Error line removed)
        const feedbackEl = document.getElementById('quizFeedback');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const optionsBtns = document.querySelectorAll('.btn-quiz-option');

        // Désactiver les boutons
        optionsBtns.forEach(btn => btn.disabled = true);

        // Retrieve logical index from shuffled array
        const selectedOptionObj = this.currentShuffledOptions[visualIndex];
        const isCorrect = selectedOptionObj.originalIndex === q.correctAnswerIndex;

        if (isCorrect) {
            this.score++;
            optionsBtns[visualIndex].classList.add('correct');
            feedbackEl.innerHTML = `
                <div class="feedback-header correct"><i class="fa-solid fa-check-circle"></i> Bonne réponse !</div>
                <p>${q.explanation}</p>
            `;
        } else {
            optionsBtns[visualIndex].classList.add('wrong');

            // Find the visual index of the correct answer
            const correctVisualIndex = this.currentShuffledOptions.findIndex(o => o.originalIndex === q.correctAnswerIndex);
            if (correctVisualIndex !== -1) {
                optionsBtns[correctVisualIndex].classList.add('correct'); // Montrer la bonne
            }

            feedbackEl.innerHTML = `
                <div class="feedback-header wrong"><i class="fa-solid fa-times-circle"></i> Raté !</div>
                <p>${q.explanation}</p>
            `;
        }

        feedbackEl.classList.remove('hidden');
        feedbackEl.classList.add('slide-up');
        nextBtn.classList.remove('hidden');
    }

    /**
     * Passe à la question suivante ou termine
     */
    nextQuestion() {
        this.currentIndex++;
        if (this.currentIndex >= 10) {
            this.endQuiz();
        } else {
            this.renderQuestion();
        }
    }

    /**
     * Fin du jeu et affichage du score
     */
    endQuiz() {
        const container = document.getElementById('quizCardContainer');
        document.getElementById('quizProgressBar').style.width = `100%`;

        // SAVE RESULT
        if (this.isDuel && this.duelId) {
            // DUEL MODE SAVE
            window.social.submitDuelScore(this.duelId, this.score, 10);
        } else {
            // STANDARD MODE SAVE
            if (window.auth && typeof window.auth.saveQuizResult === 'function') {
                window.auth.saveQuizResult(this.score, 10);
            }
        }

        const { title, message } = this.getClashMessage(this.score);

        let actionButtons = '';
        if (this.isDuel) {
            actionButtons = `
                <button class="btn-action secondary" onclick="document.getElementById('quizPlayer').classList.add('hidden')">
                    <i class="fa-solid fa-check"></i> Retour
                </button>
             `;
        } else {
            actionButtons = `
                <button class="btn-action" onclick="document.getElementById('quizPlayer').classList.add('hidden'); document.getElementById('quizConfigModal').classList.remove('hidden')">
                    <i class="fa-solid fa-rotate-right"></i> Rejouer
                </button>
                <button class="btn-action secondary" onclick="document.getElementById('quizPlayer').classList.add('hidden')">
                    <i class="fa-solid fa-house"></i> Accueil
                </button>
            `;
        }

        container.innerHTML = `
            <div class="quiz-result-card glass-panel animate-in">
                <h2>${this.isDuel ? "Duel Terminé !" : "Quiz Terminé !"}</h2>
                <div class="score-circle">
                    <span>${this.score}</span>/10
                </div>
                
                <h3 class="clash-title">${title}</h3>
                <p class="clash-message">"${message}"</p>

                <div class="quiz-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    /**
     * Génère la phrase de clash selon le score
     */
    getClashMessage(score) {
        if (score === 10) return { title: "Dieu de l'Histoire 👑", message: "Bon, avoue, tu as triché ou tu es prof d'Histoire ?" };
        if (score >= 8) return { title: "Érudit Confirmé 🤓", message: "Impressionnant. Tu peux briller en société (ou ennuyer tes amis)." };
        if (score >= 5) return { title: "Touriste Temporel 🎒", message: "Pas mal, mais tu as dormi pendant quelques siècles." };
        if (score >= 2) return { title: "Amibe Historique 🦠", message: "C'est l'effort qui compte... ou pas. Retourne lire les fiches !" };
        return { title: "Catastrophe Ambulante 💀", message: "Tu as confondu Napoléon et un gâteau ? Sérieusement ?" };
    }
}

// Initialisation globale
window.quiz = new QuizManager();
