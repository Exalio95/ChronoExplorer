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
            console.log("No pseudo found, showing modal");
            document.getElementById('pseudoModal').classList.remove('hidden');
        }
    }).catch((error) => {
        console.error("Erreur accès profil:", error);
        // If permission denied (common on new projects), show modal anyway or alert
        if (error.code === 'permission-denied') {
            alert("Attention : Vos règles de sécurité Firestore bloquent l'accès. Le pseudo ne pourra pas être sauvegardé.");
        } else {
            alert("Erreur profil : " + error.message);
        }
        // Force show modal just in case to verify UI works
        document.getElementById('pseudoModal').classList.remove('hidden');
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
            
            <button id="showLeaderboardBtn" class="btn-icon" style="margin-left:10px;" title="Leaderboard">
                <i class="fa-solid fa-trophy" style="color: var(--accent-gold);"></i>
            </button>
            <button id="logoutBtn" class="btn-icon" style="margin-left:5px; background: rgba(255,255,255,0.1);" title="Déconnexion">
                <i class="fa-solid fa-power-off"></i>
            </button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', signOut);
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
            document.getElementById('leaderboardModal').classList.remove('hidden');
            fetchLeaderboard();
        });

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
        // Update local stats first to be responsive
        const today = new Date().toISOString().split('T')[0];

        getUserDocRef(currentUser.uid).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                let dailyReads = data.dailyReads || 0;
                let lastDate = data.lastActivityDate || "";

                if (lastDate !== today) {
                    dailyReads = 1; // Reset for new day
                } else {
                    dailyReads += 1;
                }

                getUserDocRef(currentUser.uid).set({
                    seenEpisodes: Array.from(userHistory),
                    dailyReads: dailyReads,
                    lastActivityDate: today,
                    totalReads: userHistory.size
                }, { merge: true });
            }
        });
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
    savePseudo,
    fetchLeaderboard
};

const fetchLeaderboard = () => {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="text-align:center; color:#888;">Chargement des données...</p>';

    // Query users sorted by dailyReads (desc)
    // Note: This requires a composite index in Firestore if we filter by date too.
    // For simplicity, we just order by dailyReads and filter locally if needed, or rely on daily reset.
    // Since we reset dailyReads on write, we can just sort by dailyReads.

    // Important: We need to filter only users active TODAY ? 
    // Or we assume dailyReads is accurate because it resets on first write of the day.
    // Ideally we query: where('lastActivityDate', '==', today).orderBy('dailyReads', 'desc')

    const today = new Date().toISOString().split('T')[0];

    window.db.collection('users')
        .where('lastActivityDate', '==', today)
        .orderBy('dailyReads', 'desc')
        .limit(10)
        .get()
        .then((snapshot) => {
            let html = '<ul style="list-style:none; padding:0;">';
            let rank = 1;

            if (snapshot.empty) {
                list.innerHTML = '<p style="text-align:center; color:#888;">Aucun lecteur actif aujourd\'hui ! Soyez le premier.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                let badge = '';
                if (rank === 1) badge = '🥇';
                else if (rank === 2) badge = '🥈';
                else if (rank === 3) badge = '🥉';
                else badge = `#${rank}`;

                html += `
                    <li style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); align-items:center;">
                        <span style="font-weight:bold; font-size:1.1rem; width: 40px;">${badge}</span>
                        <div style="flex-grow:1;">
                            <span style="color: var(--accent-gold); font-weight:bold;">${data.pseudo || 'Explorateur'}</span>
                            <div style="font-size:0.8rem; color:#aaa;">Total: ${data.totalReads || 0} épisodes</div>
                        </div>
                        <span style="background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 10px; font-weight:bold;">
                            ${data.dailyReads} 📖
                        </span>
                    </li>
                `;
                rank++;
            });
            html += '</ul>';
            list.innerHTML = html;
        })
        .catch((error) => {
            console.error("Erreur leaderboard:", error);
            list.innerHTML = `<p style="color:red; text-align:center;">Erreur : ${error.message}<br><small>Vérifiez que l'index Firestore existe (lien dans la console JS)</small></p>`;
        });
};
