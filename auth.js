// auth.js
// Gestion de l'authentification et de l'historique utilisateur

let currentUser = null;
let userHistory = new Set(); // IDs des épisodes vus

// Référence aux collections Firestore
const getUserDocRef = (userId) => window.db.collection('users').doc(userId);

// --- Authentification ---

// Se connecter avec Google
const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    window.firebaseAuth.signInWithPopup(provider)
        .then((result) => {
            console.log("Connecté en tant que :", result.user.displayName);
            document.getElementById('loginModal').classList.add('hidden');
            // Check for pseudo
            checkAndPromptPseudo(result.user);
        })
        .catch((error) => {
            console.error("Erreur de connexion :", error);
            alert("Erreur lors de la connexion : " + error.message);
        });
};

// Se déconnecter
const signOut = () => {
    window.firebaseAuth.signOut().then(() => {
        console.log("Déconnecté");
        updateUserUI(null);
        // On garde l'historique local en mémoire ou on le vide ? 
        // Pour l'instant on le garde, mais il ne sera plus synchronisé.
    }).catch((error) => {
        console.error("Erreur de déconnexion :", error);
    });
};

// Observer les changements d'état (connexion/déconnexion)
const checkAndPromptPseudo = (user) => {
    getUserDocRef(user.uid).get().then((doc) => {
        if (doc.exists && doc.data().pseudo) {
            // Pseudo exists
            // Merge history and update UI
            mergeHistory(user.uid);
            updateUserUI(user, doc.data().pseudo);
        } else {
            // No pseudo, show modal
            document.getElementById('pseudoModal').classList.remove('hidden');
        }
    });
};

const savePseudo = () => {
    const input = document.getElementById('pseudoInput');
    const pseudo = input.value.trim();
    if (!pseudo) return alert("Veuillez entrer un pseudo !");

    if (currentUser) {
        getUserDocRef(currentUser.uid).set({
            pseudo: pseudo,
            email: currentUser.email
        }, { merge: true }).then(() => {
            document.getElementById('pseudoModal').classList.add('hidden');
            mergeHistory(currentUser.uid);
            updateUserUI(currentUser, pseudo);
        });
    }
};

window.auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        // We handle UI update in checkAndPromptPseudo for proper welcome message
        checkAndPromptPseudo(user);
        loadHistory(user.uid);
    } else {
        updateUserUI(null);
        // Chargement de l'historique local (localStorage) si non connecté
        loadLocalHistory();
    }
});


// --- Gestion de l'UI Utilisateur ---

const updateUserUI = (user, pseudo = null) => {
    const header = document.querySelector('header');
    let userProfile = document.getElementById('userProfile');

    if (!userProfile) {
        userProfile = document.createElement('div');
        userProfile.id = 'userProfile';
        userProfile.className = 'user-profile';
        header.appendChild(userProfile);
    }

    if (user) {
        // Try to get pseudo from global user object or display name if not passed
        const displayName = pseudo || user.displayName || "Explorateur";

        userProfile.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 10px;">
                <span style="font-size: 0.9rem; color: var(--accent-gold);">Bienvenue</span>
                <span style="font-weight: bold;">${displayName}</span>
            </div>
            <img src="${user.photoURL}" alt="${displayName}" class="user-avatar" title="${displayName}">
            <button id="logoutBtn" class="btn-text" style="font-size: 0.8rem; margin-left:10px;">X</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', signOut);

        // Cacher le bouton de connexion s'il existe ailleurs
        const loginBtn = document.getElementById('headerLoginBtn');
        if (loginBtn) loginBtn.style.display = 'none';

    } else {
        userProfile.innerHTML = `
            <button id="headerLoginBtn" class="btn-glass-small"><i class="fa-brands fa-google"></i> Connexion</button>
        `;
        document.getElementById('headerLoginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('hidden');
        });
    }
};


// --- Gestion de l'Historique ---

// Charger l'historique (Cloud ou Local)
const loadHistory = (userId) => {
    if (userId) {
        getUserDocRef(userId).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.seenEpisodes) {
                    data.seenEpisodes.forEach(id => userHistory.add(id));
                }
            }
            updateFilesUI();
        }).catch((error) => {
            console.error("Erreur chargement historique:", error);
        });
    }
};

const loadLocalHistory = () => {
    const local = localStorage.getItem('chrono_seen_episodes');
    if (local) {
        JSON.parse(local).forEach(id => userHistory.add(id));
    }
    updateFilesUI();
};

// Marquer un épisode comme vu
const markEpisodeAsSeen = (episodeId) => {
    if (userHistory.has(episodeId)) return; // Déjà vu

    userHistory.add(episodeId);

    // Sauvegarde
    if (currentUser) {
        // Cloud
        getUserDocRef(currentUser.uid).set({
            seenEpisodes: Array.from(userHistory)
        }, { merge: true });
    } else {
        // Local
        localStorage.setItem('chrono_seen_episodes', JSON.stringify(Array.from(userHistory)));
    }

    updateFilesUI();
};

// Fusionner Local -> Cloud lors de la connexion
const mergeHistory = (userId) => {
    const local = localStorage.getItem('chrono_seen_episodes');
    let localSeen = [];
    if (local) {
        localSeen = JSON.parse(local);
    }

    if (localSeen.length > 0) {
        // On récupère d'abord le cloud pour ne rien écraser accidentellement, puis on set
        getUserDocRef(userId).get().then((doc) => {
            let cloudSeen = [];
            if (doc.exists && doc.data().seenEpisodes) {
                cloudSeen = doc.data().seenEpisodes;
            }
            const merged = [...new Set([...cloudSeen, ...localSeen])];

            getUserDocRef(userId).set({
                seenEpisodes: merged
            }, { merge: true }).then(() => {
                console.log("Historique fusionné avec succès.");
                // Optionnel: vider le localStorage
            });
        });
    }
};

// Mettre à jour l'interface des cartes (ajout d'un indicateur "Vu")
const updateFilesUI = () => {
    // Cette fonction sera appelée quand l'historique change
    // Elle doit parcourir les cartes affichées et ajouter une classe ou icône
    document.querySelectorAll('.card-item').forEach(card => {
        // On suppose qu'on peut récupérer l'ID de l'épisode depuis le DOM
        // Il faudrait ajouter un data-id aux cartes dans explorer.js
        const id = parseInt(card.dataset.id);
        if (userHistory.has(id)) {
            card.classList.add('episode-seen');
            if (!card.querySelector('.seen-badge')) {
                const badge = document.createElement('div');
                badge.className = 'seen-badge';
                badge.innerHTML = '<i class="fa-solid fa-check"></i>';
                card.appendChild(badge);
            }
        } else {
            card.classList.remove('episode-seen');
            const badge = card.querySelector('.seen-badge');
            if (badge) badge.remove();
        }
    });
};

// Exposer globalement
window.auth = {
    signInWithGoogle,
    signOut,
    markEpisodeAsSeen,
    savePseudo
};
