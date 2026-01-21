
// social.js - Gestion des Duels et du Social

const social = {
    // Supprimer un duel en attente (si challenger)
    deleteDuel: async (duelId) => {
        console.log("deleteDuel called for:", duelId);
        try {
            await window.db.collection('duels').doc(duelId).delete();
            console.log("Delete successful");
        } catch (e) {
            console.error("Error deleting duel:", e);
            throw e; // Let UI handle error display
        }
    },

    // Créer un duel
    createDuel: async (quizConfig, opponentPseudo = null) => {
        const user = window.auth.getCurrentUser();
        if (!user) return alert("Connectez-vous pour lancer un duel !");

        // 1. Fetch Real Pseudo from DB (Force Source of Truth)
        let properPseudo = user.displayName || "Challenger";
        // DEBUG: Force user to see we are fetching
        console.log("🔍 Fetching Pseudo for:", user.uid);

        try {
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.pseudo) {
                    properPseudo = userData.pseudo;
                    console.log("✅ Using DB Pseudo:", properPseudo);
                }
            }
        } catch (e) {
            console.warn("Could not fetch latest pseudo from DB, using displayName", e);
        }

        // 2. Resolve Opponent ID if pseudo provided (CRITICAL for "Recu" list)
        let opponentId = null;
        if (opponentPseudo) {
            try {
                const opSnap = await window.db.collection('users').where('pseudo', '==', opponentPseudo).limit(1).get();
                if (!opSnap.empty) {
                    opponentId = opSnap.docs[0].id;
                    console.log("✅ Resolved Opponent ID:", opponentId, "for pseudo:", opponentPseudo);
                } else {
                    console.warn("⚠️ Opponent pseudo not found:", opponentPseudo);
                    // We continue, but it might be a ghost duel if not found.
                    // Ideally we might want to stop here or fallback to link.
                }
            } catch (e) {
                console.error("Error resolving opponent pseudo:", e);
            }
        }

        // 3. Generate consistent questions for fair battle
        const questions = window.quiz.generateDuelQuestions(quizConfig);

        // Guard: Prevent empty/corrupt duels
        if (!questions || questions.length < 10) {
            console.error("❌ createDuel aborted: Invalid questions generated.");
            alert("Erreur: Impossible de générer 10 questions valides. Vérifiez que les données sont chargées.");
            return null;
        }

        let duelData = {
            challengerId: user.uid,
            challengerPseudo: properPseudo,
            status: opponentId ? 'pending_user' : 'pending_link', // Use opponentId to determine status validity
            createdAt: new Date().toISOString(),
            quizConfig: quizConfig,
            questions: questions, // Array of Question Objects
            scores: {
                [user.uid]: null // Placeholder
            }
        };

        if (opponentPseudo) {
            duelData.opponentPseudo = opponentPseudo;
            if (opponentId) duelData.opponentId = opponentId; // SAVE IT
        }

        try {
            const docRef = await window.db.collection('duels').add(duelData);
            return docRef.id;
        } catch (e) {
            console.error("Error creating duel:", e);
            throw e;
        }
    },

    // Generates a link (Legacy helper, logic moved to UI mostly but kept for robustness)
    createDuelLink: async (quizConfig) => {
        return await social.createDuel(quizConfig);
    },


    // Accepter un duel (via lien ou invite)
    acceptDuel: async (duelId) => {
        const user = window.auth.getCurrentUser();
        if (!user) return alert("Connectez-vous pour accepter le défi !");

        const duelRef = window.db.collection('duels').doc(duelId);
        const doc = await duelRef.get();
        if (!doc.exists) return alert("Duel introuvable ou expiré.");

        const data = doc.data();
        if (data.status !== 'pending_link' && data.status !== 'pending_user') {
            // Already active or completed, just open it
            return true;
        }

        // Linking user to duel
        if (!data.opponentId || data.opponentId === user.uid) {
            await duelRef.update({
                opponentId: user.uid,
                opponentPseudo: user.displayName || "Adversaire",
                status: 'active',
                [`scores.${user.uid}`]: null // Ensure field exists
            });
            return true;
        } else {
            alert("Ce duel est déjà pris par un autre joueur !");
            return false;
        }
    },

    // Récupérer mes duels (En tant que challenger ou opposant)
    subscribeToDuels: (callback) => {
        const user = window.auth.getCurrentUser();
        if (!user) return;

        const q1 = window.db.collection('duels').where('challengerId', '==', user.uid);
        const q2 = window.db.collection('duels').where('opponentId', '==', user.uid);

        let duelsA = {};
        let duelsB = {};

        const mergeAndCallback = () => {
            const all = { ...duelsA, ...duelsB };
            const list = Object.values(all).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            callback(list);
        };

        const handleSnapshotA = (snap) => {
            duelsA = {}; // Reset state for this query
            snap.forEach(doc => {
                duelsA[doc.id] = { id: doc.id, ...doc.data() };
            });
            mergeAndCallback();
        };

        const handleSnapshotB = (snap) => {
            duelsB = {}; // Reset state for this query
            snap.forEach(doc => {
                duelsB[doc.id] = { id: doc.id, ...doc.data() };
            });
            mergeAndCallback();
        };

        q1.onSnapshot(handleSnapshotA);
        q2.onSnapshot(handleSnapshotB);
    },

    // Check URL for invite
    checkUrlForInvite: async () => {
        const params = new URLSearchParams(window.location.search);
        const duelId = params.get('duel');
        if (duelId) {
            console.log("Duel invite found:", duelId);
            // Check auth
            const user = window.auth.getCurrentUser();
            if (user) {
                // User logged in, try to accept/view
                const success = await social.acceptDuel(duelId);
                if (success) {
                    // Open Duel UI
                    if (window.socialUI) window.socialUI.openDuelPreview(duelId);
                }
            } else {
                // Not logged in -> Show Login then handle
                // Store duelId in localstorage to resume after login?
                localStorage.setItem('pending_duel_id', duelId);
                document.getElementById('loginModal').classList.remove('hidden');
                // We leave the param in URL so after reload/auth it checks again? 
                // No, current auth flow is SPA, so page doesn't reload.
                // We need `auth.js` to call this `checkUrlForInvite` after login success.
            }
        }
    },

    // Finish Duel (Submit Score)
    submitDuelScore: async (duelId, score, total) => {
        const user = window.auth.getCurrentUser();
        const duelRef = window.db.collection('duels').doc(duelId);

        // Transaction to ensure atomicity if needed, or simple update
        // We update our score.
        // Check if opponent has score too -> if yes, mark completed.

        await window.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(duelRef);
            if (!doc.exists) throw "Duel not found";

            const data = doc.data();
            const scores = data.scores || {};
            scores[user.uid] = { score, total };

            let updates = { scores: scores };

            // Check if both played
            const otherIds = [data.challengerId, data.opponentId].filter(id => id && id !== user.uid);
            if (otherIds.length > 0) {
                const otherId = otherIds[0];
                if (scores[otherId]) {
                    // Both played!
                    updates.status = 'completed';
                    // Determine winner
                    const myS = score;
                    const otherS = scores[otherId].score;
                    if (myS > otherS) updates.winner = user.uid;
                    else if (otherS > myS) updates.winner = otherId;
                    else updates.winner = 'tie';
                }
            } else if (data.status === 'pending_link') {
                // I am challenger playing first on a link duel
                // Status remains pending_link (or waiting_opponent?)
            }

            transaction.update(duelRef, updates);
        });
    }
};

window.social = social;

// If auth already loaded, check invite?
// Better: call this from main script or explorer.js DOMContentLoaded
