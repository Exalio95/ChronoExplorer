// auth.js
// Gestion de l'authentification et de l'historique utilisateur

let currentUser = null;
let userHistory = new Map(); // ID -> { finished, lastIndex, totalCards }
let userFavorites = new Set(); // IDs des favoris

// Référence aux collections Firestore
const getUserDocRef = (userId) => window.db.collection('users').doc(userId);

// --- Authentification ---

// Se connecter avec Google
const signInWithGoogle = () => {
    console.log("Tentative de connexion Google...");

    if (typeof firebase === 'undefined') {
        alert("Erreur critique : Firebase n'est pas chargé. Vérifiez votre connexion ou vos bloqueurs de publicité.");
        return;
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const authInstance = window.firebaseAuth || firebase.auth();

        authInstance.signInWithPopup(provider)
            .then((result) => {
                console.log("Connecté en tant que :", result.user.displayName);
                document.getElementById('loginModal').classList.add('hidden');
                checkAndPromptPseudo(result.user);
            })
            .catch((error) => {
                console.error("Erreur de connexion :", error);
                alert("Erreur lors de la connexion : " + error.message);
            });
    } catch (e) {
        alert("Erreur d'initialisation Auth : " + e.message);
        console.error(e);
    }
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
            currentUser.pseudo = doc.data().pseudo; // Attach pseudo to object
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
    if (pseudo.length < 3) return alert("Le pseudo doit faire au moins 3 caractères.");

    if (currentUser) {
        // Check uniqueness
        window.db.collection('users').where('pseudo', '==', pseudo).get().then(snapshot => {
            if (!snapshot.empty) {
                // Check if it's NOT the current user (in case they are just clicking save again on same name)
                let taken = false;
                snapshot.forEach(doc => {
                    if (doc.id !== currentUser.uid) taken = true;
                });

                if (taken) {
                    alert("Ce pseudo est déjà pris, veuillez en choisir un autre.");
                    return;
                }
            }

            // Available
            getUserDocRef(currentUser.uid).set({
                pseudo: pseudo,
                email: currentUser.email,
                searchKey: pseudo.toLowerCase(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add creation date
            }, { merge: true }).then(() => {
                document.getElementById('pseudoModal').classList.add('hidden');
                currentUser.pseudo = pseudo; // Update global object
                mergeHistory(currentUser.uid);
                updateUserUI(currentUser, pseudo);
            });
        });
    }
};

const getNewestUsers = async () => {
    try {
        const snapshot = await window.db.collection('users')
            .limit(10)
            .get();

        if (snapshot.empty) return [];

        let users = [];
        snapshot.forEach(doc => {
            // Exclude self if present (though unlikely to be exactly last 3 with high volume, good for small tests)
            if (!currentUser || doc.id !== currentUser.uid) {
                users.push(doc.data());
            }
        });
        // Client-side sort (newest first), handling missing dates
        users.sort((a, b) => {
            const dateA = a.lastActivityDate || a.createdAt || "";
            const dateB = b.lastActivityDate || b.createdAt || "";
            return dateB.localeCompare(dateA); // Lexicographical sort works for ISO dates
        });
        return users.slice(0, 5);
    } catch (e) {
        console.error("Could not fetch newest users", e);
        alert("Erreur chargement suggestions: " + e.message);
        return [];
    }
};

// --- Gestion Amis ---

// Envoyer une demande d'ami
const sendFriendRequest = async (targetPseudo) => {
    if (!currentUser) return { success: false, message: "Vous devez être connecté." };

    try {
        // 1. Find target
        const snapshot = await window.db.collection('users').where('pseudo', '==', targetPseudo).get();
        if (snapshot.empty) return { success: false, message: "Aucun explorateur trouvé avec ce pseudo." };

        const targetDoc = snapshot.docs[0];
        const targetId = targetDoc.id;

        if (targetId === currentUser.uid) return { success: false, message: "C'est vous !" };

        // 2. Check if already friends
        const myDoc = await getUserDocRef(currentUser.uid).get();
        const myFriends = myDoc.data().friends || [];
        if (myFriends.find(f => f.uid === targetId)) return { success: false, message: "Vous êtes déjà amis !" };

        // 3. Check for existing pending request
        const existing = await window.db.collection('friendRequests')
            .where('fromId', '==', currentUser.uid)
            .where('toId', '==', targetId)
            .where('status', '==', 'pending')
            .get();

        if (!existing.empty) return { success: false, message: "Demande déjà envoyée." };

        // 4. Create Request
        await window.db.collection('friendRequests').add({
            fromId: currentUser.uid,
            fromPseudo: currentUser.pseudo || currentUser.displayName || "Anonyme",
            toId: targetId,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        return { success: true, message: `Demande envoyée à ${targetPseudo} !` };

    } catch (e) {
        console.error("Error sending request:", e);
        return { success: false, message: "Erreur technique: " + e.message };
    }
};

const getFriends = async () => {
    if (!currentUser) return [];
    const doc = await getUserDocRef(currentUser.uid).get();
    return doc.data().friends || [];
};

// --- Missing Social Functions ---

const acceptFriendRequest = async (requestId) => {
    if (!currentUser) return;
    try {
        const reqRef = window.db.collection('friendRequests').doc(requestId);
        const reqDoc = await reqRef.get();
        if (!reqDoc.exists) return; // Msg showed error?

        const data = reqDoc.data();
        if (data.toId !== currentUser.uid) return;

        // Transaction to add friends to both users
        await window.db.runTransaction(async (t) => {
            const myRef = getUserDocRef(currentUser.uid);
            const senderRef = getUserDocRef(data.fromId);

            // Get current friends
            const mySnap = await t.get(myRef);
            const senderSnap = await t.get(senderRef);

            let myFriends = mySnap.data().friends || [];
            let senderFriends = senderSnap.data().friends || [];

            // Add if not exists
            if (!myFriends.find(f => f.uid === data.fromId)) {
                myFriends.push({ uid: data.fromId, pseudo: data.fromPseudo });
            }
            if (!senderFriends.find(f => f.uid === currentUser.uid)) {
                senderFriends.push({ uid: currentUser.uid, pseudo: currentUser.pseudo || currentUser.displayName || "Ami" });
            }

            t.update(myRef, { friends: myFriends });
            t.update(senderRef, { friends: senderFriends });
            t.update(reqRef, { status: 'accepted' });
        });

    } catch (e) {
        console.error("Error accepting friend:", e);
        alert("Erreur validation ami");
    }
};

const rejectFriendRequest = async (requestId) => {
    if (!currentUser) return;
    try {
        await window.db.collection('friendRequests').doc(requestId).update({ status: 'rejected' });
    } catch (e) { console.error(e); }
};

const removeFriend = async (friendUid, friendPseudo) => {
    if (!currentUser) return;
    if (!confirm(`Voulez-vous vraiment retirer ${friendPseudo} de vos amis ?`)) return;

    try {
        await window.db.runTransaction(async (t) => {
            const myRef = getUserDocRef(currentUser.uid);
            const friendRef = getUserDocRef(friendUid);

            const mySnap = await t.get(myRef);
            const friendSnap = await t.get(friendRef);

            // Even if friend doc doesn't exist (deleted user), we should try to clean up ours.
            // But transaction requires all gets before writes.
            // If friend doc missing, just update mine.

            let myFriends = mySnap.exists ? (mySnap.data().friends || []) : [];
            const newMyFriends = myFriends.filter(f => f.uid !== friendUid);
            t.update(myRef, { friends: newMyFriends });

            if (friendSnap.exists) {
                let friendFriends = friendSnap.data().friends || [];
                const newFriendFriends = friendFriends.filter(f => f.uid !== currentUser.uid);
                t.update(friendRef, { friends: newFriendFriends });
            }
        });

        alert(`${friendPseudo} a été retiré de vos amis.`);
        if (window.socialUI) window.socialUI.renderFriendsList();

    } catch (e) {
        console.error("Error removing friend:", e);
        alert("Erreur lors de la suppression : " + e.message);
    }
};

const getPendingRequests = (callback) => {
    if (!currentUser) return;
    return window.db.collection('friendRequests')
        .where('toId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(reqs);
        });
};

const updatePresence = () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    // Just update lastActivityDate
    getUserDocRef(currentUser.uid).set({
        lastActivityDate: today,
        status: 'online', // Simple status
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
};

const getFriendsData = async (friendIds) => {
    if (!friendIds || friendIds.length === 0) return {};

    console.log("Fetching friends data for:", friendIds);

    // In chunks of 10 for 'in' query
    if (friendIds.length > 10) friendIds = friendIds.slice(0, 10); // Limit

    try {
        const snapshot = await window.db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', friendIds).get();
        let dataMap = {};
        snapshot.forEach(doc => {
            const d = doc.data();
            dataMap[doc.id] = {
                status: d.status || 'offline',
                pseudo: d.pseudo || "Explorateur Inconnu"
            };
        });
        console.log("Friends data retrieved:", dataMap);
        return dataMap;
    } catch (e) {
        console.error("Error fetching friends data:", e);
        return {};
    }
};

// Initialisation sécurisée
const initAuthListener = () => {
    if (window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                checkAndPromptPseudo(user);
                loadHistory(user.uid);
                updatePresence();
            } else {
                updateUserUI(null);
                loadLocalHistory();
            }
        });
    } else {
        console.warn("FirebaseAuth not found immediately, retrying in 500ms...");
        setTimeout(initAuthListener, 500);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthListener);
} else {
    initAuthListener();
}


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
            <button id="headerSocialBtn" class="btn-glass-small" style="margin-right: 15px; position:relative;">
                <i class="fa-solid fa-users"></i> Social
                <span id="socialBadge" class="notification-badge hidden">0</span>
            </button>

            <div id="profileClickArea" style="display: flex; align-items: center; cursor: pointer; transition: opacity 0.2s;" title="Cliquez pour vous déconnecter">
                <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 10px;">
                    <span style="font-size: 0.9rem; color: var(--accent-gold);">Bienvenue</span>
                    <span style="font-weight: bold;">${displayName}</span>
                </div>
                <img src="${user.photoURL}" alt="${displayName}" class="user-avatar">
            </div>
            
            <button id="showLeaderboardBtn" class="btn-icon" style="margin-left:15px;" title="Classement">
                <i class="fa-solid fa-trophy" style="color: var(--accent-gold);"></i>
            </button>
        `;

        // Click on social
        document.getElementById('headerSocialBtn').addEventListener('click', () => {
            if (window.socialUI) window.socialUI.open();
        });

        // Click on profile to logout
        document.getElementById('profileClickArea').addEventListener('click', () => {
            if (confirm(`Voulez-vous vous déconnecter, ${displayName} ?`)) {
                signOut();
            }
        });

        document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
            document.getElementById('leaderboardModal').classList.remove('hidden');
            fetchLeaderboard();
        });

        // Cacher le bouton de connexion s'il existe ailleurs
        const loginBtn = document.getElementById('headerLoginBtn');
        if (loginBtn) loginBtn.style.display = 'none';

        // Check for pending invite
        if (window.social) window.social.checkUrlForInvite();

        // Init Notifs
        if (window.socialUI) window.socialUI.initListeners();

    } else {
        userProfile.innerHTML = `
            <button id="headerLoginBtn" class="btn-glass-small"><i class="fa-brands fa-google"></i> Connexion</button>
        `;
        document.getElementById('headerLoginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('hidden');
        });
        const socialBtn = document.getElementById('headerSocialBtn');
        if (socialBtn) socialBtn.style.display = 'none';

        // Even if not logged in, check URL to store it or prompt login
        if (window.social) window.social.checkUrlForInvite();
    }
};


// --- Gestion de l'Historique ---

// Charger l'historique (Cloud ou Local)
// Charger l'historique (Cloud ou Local)
const loadHistory = (userId) => {
    if (userId) {
        getUserDocRef(userId).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                // Migration: If data is old array format
                if (Array.isArray(data.seenEpisodes)) {
                    // Convert old array to new Map format (all assumed finished)
                    data.seenEpisodes.forEach(id => {
                        userHistory.set(id, { finished: true, lastIndex: 0 });
                    });
                } else if (data.progress) {
                    // New format: Object/Map
                    // Firestore stores Maps as Objects
                    Object.entries(data.progress).forEach(([key, val]) => {
                        userHistory.set(parseInt(key), val);
                    });
                }
            }
            updateFilesUI();
        }).catch((error) => {
            console.error("Erreur chargement historique:", error);
        });
    }
};

const loadLocalHistory = () => {
    const local = localStorage.getItem('chrono_user_progress');
    // Check for old format first
    const oldLocal = localStorage.getItem('chrono_seen_episodes');

    if (local) {
        const parsed = JSON.parse(local);
        Object.entries(parsed).forEach(([key, val]) => {
            userHistory.set(parseInt(key), val);
        });
    } else if (oldLocal) {
        // Migrate old local data
        JSON.parse(oldLocal).forEach(id => {
            userHistory.set(id, { finished: true, lastIndex: 0 });
        });
    }
    updateFilesUI();
};

// Sauvegarder la progression
const saveProgress = (episodeId, cardIndex, totalCards) => {
    // Determine state
    const isFinished = cardIndex >= totalCards - 1;

    const currentData = userHistory.get(episodeId) || {};
    // Only update if we advanced further or if it's finished
    // actually we want to resume where we left off, so update to current index

    const newData = {
        lastIndex: cardIndex,
        finished: currentData.finished || isFinished, // Once finished, always finished
        totalCards: totalCards,
        lastUpdated: new Date().toISOString()
    };

    userHistory.set(episodeId, newData);

    // Persist
    if (currentUser) {
        // If finished, we also handle the Leaderboard stats here (dailyReads)
        // But only if it wasn't ALREADY finished before
        if (isFinished && !currentData.finished) {
            incrementDailyReads(currentUser.uid);
        }

        // Save entire progress map (convert Map to Object for Firestore)
        const progressObj = Object.fromEntries(userHistory);

        getUserDocRef(currentUser.uid).set({
            progress: progressObj
        }, { merge: true });

    } else {
        // Local
        const progressObj = Object.fromEntries(userHistory);
        localStorage.setItem('chrono_user_progress', JSON.stringify(progressObj));
    }

    updateFilesUI();
};

// Helper for Daily Reads (split from main save to avoid complexity)
const incrementDailyReads = (userId) => {
    const today = new Date().toISOString().split('T')[0];
    getUserDocRef(userId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            let dailyReads = data.dailyReads || 0;
            let lastDate = data.lastActivityDate || "";
            let totalReads = data.totalReads || 0;

            if (lastDate !== today) {
                dailyReads = 1;
            } else {
                dailyReads += 1;
            }

            getUserDocRef(userId).set({
                dailyReads: dailyReads,
                lastActivityDate: today,
                totalReads: totalReads + 1
            }, { merge: true });
        }
    });
};

// --- QUIZ HISTORY & LEADERBOARD ---

const saveQuizResult = (score, total) => {
    if (!currentUser) return; // Only save if logged in

    const today = new Date().toISOString();
    const result = {
        score: score,
        total: total,
        date: today
    };

    // 1. Save to User Profile
    getUserDocRef(currentUser.uid).update({
        quizHistory: firebase.firestore.FieldValue.arrayUnion(result)
    }).catch(err => {
        // Create if doesn't exist (update fails if doc doesn't exist, but promptPseudo usually handles creation)
        console.warn("Quiz history update failed, trying set merge:", err);
        getUserDocRef(currentUser.uid).set({
            quizHistory: [result]
        }, { merge: true });
    });

    // 2. Save to Global Quiz Results Collection for "Recent Games" Leaderboard
    // We store minimal info: pseudo, score, date
    // We assume 'pseudo' is available in currentUser object if we updated it, or we fetch it.
    // For simplicity, we'll try to get it from DOM or assume it's set.
    // Better: Allow 'pseudo' to be passed or just rely on what is stored.
    // Actually, let's fetch the pseudo to be sure, or store it.

    getUserDocRef(currentUser.uid).get().then(doc => {
        const userData = doc.data();
        const pseudo = userData.pseudo || "Anonyme";

        window.db.collection('quizResults').add({
            userId: currentUser.uid,
            pseudo: pseudo,
            score: score,
            total: total,
            date: today
        }).then(() => {
            console.log("Global quiz result saved.");
        });
    });
};

// Fusionner Local -> Cloud lors de la connexion
const mergeHistory = (userId) => {
    const local = localStorage.getItem('chrono_user_progress');
    const localOld = localStorage.getItem('chrono_seen_episodes');

    let localMap = new Map();

    if (local) {
        Object.entries(JSON.parse(local)).forEach(([k, v]) => localMap.set(parseInt(k), v));
    } else if (localOld) {
        JSON.parse(localOld).forEach(id => localMap.set(id, { finished: true, lastIndex: 0 }));
    }

    if (localMap.size > 0) {
        getUserDocRef(userId).get().then((doc) => {
            const data = doc.data();
            let cloudMap = new Map();

            if (data && data.progress) {
                Object.entries(data.progress).forEach(([k, v]) => cloudMap.set(parseInt(k), v));
            } else if (data && data.seenEpisodes) {
                // Migrate old cloud data
                data.seenEpisodes.forEach(id => cloudMap.set(id, { finished: true, lastIndex: 0 }));
            }

            // Merge logic: prefer finished, then prefer higher index
            localMap.forEach((val, key) => {
                const cloudVal = cloudMap.get(key);
                if (!cloudVal) {
                    cloudMap.set(key, val);
                } else {
                    // If local is finished but cloud isn't, take local. 
                    // Or if local is further ahead.
                    if (val.finished || val.lastIndex > cloudVal.lastIndex) {
                        cloudMap.set(key, val);
                    }
                }
            });

            // Save back merged
            const progressObj = Object.fromEntries(cloudMap);
            getUserDocRef(userId).set({
                progress: progressObj
            }, { merge: true }).then(() => {
                console.log("Historique fusionné.");
            });
        });
    }
};

// Mettre à jour l'interface des cartes
const updateFilesUI = () => {
    document.querySelectorAll('.card-item').forEach(card => {
        const id = parseInt(card.dataset.id);
        const data = userHistory.get(id);

        // Remove old badges
        const oldBadge = card.querySelector('.seen-badge');
        if (oldBadge) oldBadge.remove();
        card.classList.remove('episode-seen', 'episode-progress');

        if (data) {
            if (data.finished) {
                card.classList.add('episode-seen'); // Orange border
                const badge = document.createElement('div');
                badge.className = 'seen-badge success';
                badge.innerHTML = '<i class="fa-solid fa-check"></i>';
                card.appendChild(badge);
            } else if (data.lastIndex > 0) {
                card.classList.add('episode-progress'); // Blue border
                const percent = Math.round(((data.lastIndex + 1) / data.totalCards) * 100);

                const badge = document.createElement('div');
                badge.className = 'seen-badge progress';
                badge.innerHTML = `<span style="font-size:0.7rem; font-weight:bold;">${percent}%</span>`;
                card.appendChild(badge);
            }
        }
    });
};

// Exposer globalement
window.auth = {
    signInWithGoogle,
    signOut,
    saveProgress,
    savePseudo,
    saveQuizResult,
    fetchLeaderboard,
    switchLeaderboard,
    addFriend: sendFriendRequest,
    sendFriendRequest,
    getNewestUsers,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getPendingRequests,
    getFriendsData,
    updatePresence,
    getFriends,
    getUserHistory: () => userHistory,
    getCurrentUser: () => currentUser
};

let currentLeaderboardMode = 'daily';

function switchLeaderboard(mode) {
    currentLeaderboardMode = mode;

    // Update buttons UI
    const btnDaily = document.getElementById('btnDaily');
    const btnAllTime = document.getElementById('btnAllTime');
    const btnQuiz = document.getElementById('btnQuiz');

    // Reset styles
    btnDaily.style.background = ''; btnDaily.style.color = '';
    btnAllTime.style.background = ''; btnAllTime.style.color = '';
    if (btnQuiz) { btnQuiz.style.background = ''; btnQuiz.style.color = ''; }

    if (mode === 'daily') {
        btnDaily.style.background = 'var(--accent-gold)';
        btnDaily.style.color = 'black';
    } else if (mode === 'total') {
        btnAllTime.style.background = 'var(--accent-gold)';
        btnAllTime.style.color = 'black';
    } else if (mode === 'quiz') {
        if (btnQuiz) {
            btnQuiz.style.background = 'var(--accent-gold)';
            btnQuiz.style.color = 'black';
        }
    }

    fetchLeaderboard();
}

// Function declaration needs to match the export above if we hoist, 
// but since we assigned to window.auth, we just need the function defined.
function fetchLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="text-align:center; color:#888;">Chargement des données...</p>';

    let query;

    if (currentLeaderboardMode === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        query = window.db.collection('users')
            .where('lastActivityDate', '==', today)
            .orderBy('dailyReads', 'desc')
            .limit(10);
    } else if (currentLeaderboardMode === 'total') {
        // All Time: Order by totalReads
        query = window.db.collection('users')
            .orderBy('totalReads', 'desc')
            .limit(10);
    } else if (currentLeaderboardMode === 'quiz') {
        // Recent Quizzes: Order by date desc
        query = window.db.collection('quizResults')
            .orderBy('date', 'desc')
            .limit(5); // Last 5 results
    }

    query.get()
        .then((snapshot) => {
            let html = '<ul style="list-style:none; padding:0;">';
            let rank = 1;

            if (snapshot.empty) {
                list.innerHTML = '<p style="text-align:center; color:#888;">Aucun classement pour le moment.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();

                // Specific Render for Quiz Mode
                if (currentLeaderboardMode === 'quiz') {
                    // Logic for Recent Quizzes
                    const score = data.score || 0;
                    const total = data.total || 10;
                    const pseudo = data.pseudo || 'Anonyme';
                    // Optional: Format date

                    html += `
                        <li style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); align-items:center;">
                             <div style="flex-grow:1;">
                                <span style="font-weight:bold; color: var(--accent-gold); display:block; margin-bottom:2px;">${pseudo}</span>
                                <span style="font-size:0.75rem; color:#888;">Il y a un instant</span>
                            </div>
                            <div style="text-align:right;">
                                <span style="font-size:1.2rem; font-weight:bold; color:${score >= 8 ? '#4ade80' : 'white'}">
                                    ${score}/${total}
                                </span>
                            </div>
                        </li>
                    `;

                } else {
                    // Standard Leaderboard Logic
                    let badge = '';
                    if (rank === 1) badge = '🥇';
                    else if (rank === 2) badge = '🥈';
                    else if (rank === 3) badge = '🥉';
                    else badge = `#${rank}`;

                    // Score to display
                    const scoreDisplay = currentLeaderboardMode === 'daily' ? `${data.dailyReads || 0} 📖` : `${data.totalReads || 0} 🏆`;

                    html += `
                        <li style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); align-items:center;">
                            <span style="font-weight:bold; font-size:1.1rem; width: 40px;">${badge}</span>
                            <div style="flex-grow:1;">
                                <span style="color: var(--accent-gold); font-weight:bold;">${data.pseudo || 'Explorateur'}</span>
                                ${currentLeaderboardMode === 'daily' ? `<div style="font-size:0.8rem; color:#aaa;">Total: ${data.totalReads || 0} épisodes</div>` : ''}
                            </div>
                            <span style="background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 10px; font-weight:bold;">
                                ${scoreDisplay}
                            </span>
                        </li>
                    `;
                    rank++;
                }
            });
            html += '</ul>';
            list.innerHTML = html;
        })
        .catch((error) => {
            console.error("Erreur leaderboard:", error);
            list.innerHTML = `<p style="color:red; text-align:center;">Erreur : ${error.message}<br><small>Si "Index" requis : voir console</small></p>`;
        });
};
