
// social_ui.js - Gestion de l'interface Sociale

const socialUI = {
    currentDuelMode: 'link', // 'link' or 'friend'

    open: () => {
        document.getElementById('socialModal').classList.remove('hidden');
        socialUI.switchTab('friends');
    },

    switchTab: (tab) => {
        const btnFriends = document.getElementById('tabFriends');
        const btnDuels = document.getElementById('tabDuels');
        const viewFriends = document.getElementById('viewFriends');
        const viewDuels = document.getElementById('viewDuels');

        if (tab === 'friends') {
            btnFriends.classList.add('active'); btnDuels.classList.remove('active');
            viewFriends.classList.remove('hidden'); viewDuels.classList.add('hidden');
            socialUI.renderFriendsList();
        } else {
            btnDuels.classList.add('active'); btnFriends.classList.remove('active');
            viewDuels.classList.remove('hidden'); viewFriends.classList.add('hidden');
            socialUI.renderDuelsList();
        }
    },

    renderFriendsList: async () => {
        const list = document.getElementById('friendsList');
        list.innerHTML = '<div class="loader-spinner"></div>'; // Cleaner loader if exist, or text

        // 1. Fetch Request Container (Create if needed)
        // Note: New design handles requests inside the list or at top
        let reqContainer = document.getElementById('friendRequestsContainer');
        if (!reqContainer && list && list.parentElement) {
            reqContainer = document.createElement('div');
            reqContainer.id = 'friendRequestsContainer';
            // Insert before the title "Mes Amis"
            list.parentElement.insertBefore(reqContainer, list.previousElementSibling);
        }

        if (reqContainer) {
            window.auth.getPendingRequests((reqs) => {
                if (reqs.length === 0) {
                    reqContainer.innerHTML = '';
                    return;
                }
                reqContainer.innerHTML = `<h5 class="section-title">Demandes en attente</h5>` + reqs.map(r => `
                    <div class="friend-card" style="border-color:var(--accent-gold);">
                        <div class="friend-info">
                            <div class="friend-avatar" style="background:var(--accent-gold); color:black;">?</div>
                            <span class="friend-name">${r.fromPseudo}</span>
                        </div>
                        <div class="friend-actions">
                            <button onclick="window.auth.acceptFriendRequest('${r.id}')" class="btn-action-icon" style="background:var(--accent-blue); color:black;"><i class="fa-solid fa-check"></i></button>
                            <button onclick="window.auth.rejectFriendRequest('${r.id}')" class="btn-action-icon btn-delete"><i class="fa-solid fa-times"></i></button>
                        </div>
                    </div>
                `).join('');
            });
        }

        const friends = await window.auth.getFriends();
        // Remove inner wrapper, let the HTML container handle the class
        let html = '';

        if (friends.length === 0) {
            html += '<div style="text-align:center; padding:2rem; opacity:0.6;"><i class="fa-solid fa-user-group" style="font-size:2rem; margin-bottom:10px;"></i><p>Vous n\'avez pas encore d\'amis.</p></div>';
        } else {
            // Fetch Statuses & Fresh Pseudos
            const friendIds = friends.map(f => f.uid);
            const friendsData = await window.auth.getFriendsData(friendIds);

            friends.forEach(f => {
                const data = friendsData[f.uid] || { status: 'offline', pseudo: f.pseudo };
                const displayPseudo = data.pseudo;
                const statusClass = data.status === 'online' ? 'status-online' : 'status-offline';
                const initial = displayPseudo.charAt(0).toUpperCase();

                html += `
                <div class="friend-card animate-in">
                    <div class="friend-info">
                        <div class="friend-avatar">
                            ${initial}
                            <div class="friend-status-dot ${statusClass}"></div>
                        </div>
                        <span class="friend-name">${displayPseudo}</span>
                    </div>
                    <div class="friend-actions">
                        <button onclick="socialUI.startDuelWith('${displayPseudo.replace(/'/g, "\\'")}')" class="btn-action-icon btn-duel" title="Lancer un Duel">
                            <i class="fa-solid fa-bolt"></i> <span style="font-size:0.8rem;">Duel</span>
                        </button>
                        <button onclick="window.auth.removeFriend('${f.uid}', '${displayPseudo.replace(/'/g, "\\'")}')" class="btn-action-icon btn-delete" title="Retirer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            });
        }
        // No closing div needed

        // Append Suggestions
        const allSuggestions = await window.auth.getNewestUsers();
        // Limit to 3 suggestions
        const suggestions = allSuggestions.slice(0, 3);

        if (suggestions.length > 0) {
            html += `<div class="suggestions-section">
                <h5 class="section-title">Nouveaux Explorateurs</h5>
                <div class="suggestions-grid">`;

            suggestions.forEach(u => {
                const isFriend = friends.find(f => f.pseudo === u.pseudo);
                if (!isFriend && u.pseudo) {
                    const initial = u.pseudo.charAt(0).toUpperCase();
                    html += `
                        <div class="suggestion-card" onclick="document.getElementById('addFriendInput').value='${u.pseudo}'; socialUI.handleSendRequest()">
                            <div class="suggestion-avatar">${initial}</div>
                            <span class="suggestion-name">${u.pseudo}</span>
                            <div class="btn-add-mini"><i class="fa-solid fa-plus"></i></div>
                        </div>
                     `;
                }
            });
            html += `</div></div>`;
        }

        list.innerHTML = html;
    },

    renderDuelsList: () => {
        const list = document.getElementById('duelsList');
        // list.innerHTML = '<div class="loader-spinner"></div>'; // Optional

        window.social.subscribeToDuels(async (duels) => {
            if (duels.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:2rem; opacity:0.6;"><i class="fa-solid fa-swords" style="font-size:2rem; margin-bottom:10px;"></i><p>Aucun duel en cours.</p></div>';
                return;
            }

            // PRELOD: Collect all opponent IDs to fetch fresh data
            // This ensures we show the real 'pseudo' from users collection, not the stale one in duel doc.
            const myUid = window.auth.getCurrentUser().uid;
            const opponentIds = new Set();
            duels.forEach(d => {
                const opId = (d.challengerId === myUid) ? d.opponentId : d.challengerId;
                // Removed duplicate line

                if (opId) opponentIds.add(opId);
            });

            let opponentsData = {};
            if (opponentIds.size > 0) {
                try {
                    opponentsData = await window.auth.getFriendsData([...opponentIds]);
                } catch (e) { console.warn("Could not fetch fresh opponent data", e); }
            }

            let html = ''; // Remove inner wrapper

            duels.forEach(d => {
                const isChallenger = d.challengerId === myUid;
                // Resolve Opponent Name
                const opponentId = isChallenger ? d.opponentId : d.challengerId;
                let opponentName = "En attente...";

                if (opponentId && opponentsData[opponentId]) {
                    // BEST CASE: Fresh data from Users collection
                    opponentName = opponentsData[opponentId].pseudo;
                } else {
                    // FALLBACK: Data stored in Duel Document
                    opponentName = isChallenger ? (d.opponentPseudo || "En attente...") : d.challengerPseudo;
                }

                let statusBadge = '';
                let actionBtn = '';
                let cardStatusClass = '';

                // Calculate Scores
                const myScoreObj = d.scores && d.scores[myUid] ? d.scores[myUid] : null;
                const myScoreVal = myScoreObj ? myScoreObj.score : '-';

                const opponentScoreObj = d.scores && opponentId && d.scores[opponentId] ? d.scores[opponentId] : null;
                const opponentScoreVal = opponentScoreObj ? opponentScoreObj.score : '-';

                // Display formatting
                const scoreDisplay = `<span style="font-family:'Courier New', monospace; font-weight:bold; font-size:1.1rem; letter-spacing:1px; color:white;">${myScoreVal} - ${opponentScoreVal}</span>`;

                if (d.status === 'completed') {
                    cardStatusClass = 'status-completed';
                    const iWon = d.winner === myUid;
                    const tie = d.winner === 'tie';
                    const color = iWon ? '#4ade80' : (tie ? '#fbbf24' : '#f87171');
                    const text = iWon ? 'Gagné' : (tie ? 'Egalité' : 'Perdu');
                    statusBadge = `<div style="display:flex; align-items:center; gap:10px;">${scoreDisplay} <span style="color:${color}; font-weight:bold; text-transform:uppercase; font-size:0.8rem;">${text}</span></div>`;
                } else if (d.status === 'active') {
                    cardStatusClass = 'status-active';
                    // Check Data Integrity FIRST
                    if (!d.questions || d.questions.length < 10) {
                        statusBadge = `<span class="duel-badge" style="background:rgba(239,68,68,0.2); color:#f87171;">⚠️ Données corrompues</span>`;
                        actionBtn = `<button onclick="socialUI.confirmDeleteDuel('${d.id}')" class="btn-action-icon btn-delete" title="Supprimer"><i class="fa-solid fa-trash"></i></button>`;
                    } else if (myScoreVal !== '-') {
                        statusBadge = `<span class="duel-badge" style="color:#fbbf24;">En attente adversaire</span>`;
                    } else {
                        statusBadge = `<span class="duel-badge" style="background:var(--accent-blue); color:black;">À ton tour !</span>`;
                        actionBtn = `<button onclick="socialUI.playDuel('${d.id}')" class="btn-duel btn-glass-small"><i class="fa-solid fa-play"></i> Jouer</button>`;
                    }
                } else if (d.status.startsWith('pending')) {
                    cardStatusClass = 'status-pending';
                    if (isChallenger) {
                        statusBadge = `<span class="duel-badge" style="color:#aaa;">En attente ami...</span>`;
                        actionBtn = ''; // Container flex
                        if (d.status === 'pending_link') {
                            actionBtn += `<button onclick="socialUI.copyLink('${d.id}')" class="btn-glass-small" style="margin-right:5px;"><i class="fa-solid fa-link"></i> Lien</button>`;
                        }
                        actionBtn += `<button onclick="socialUI.confirmDeleteDuel('${d.id}')" class="btn-action-icon btn-delete"><i class="fa-solid fa-trash"></i></button>`;

                    } else {
                        statusBadge = `<span class="duel-badge" style="background:#38bdf8; color:black;">Défi reçu !</span>`;
                        actionBtn = `<button onclick="socialUI.acceptAndPlay('${d.id}')" class="btn-duel btn-glass-small"><i class="fa-solid fa-check"></i> Accepter</button>`;
                    }
                }

                html += `
                    <div class="duel-card ${cardStatusClass} animate-in">
                        <div class="duel-header">
                            <div>
                                <div class="duel-vs">Contre</div>
                                <div class="duel-opponent">${opponentName}</div>
                            </div>
                            <div style="text-align:right;">
                                ${statusBadge}
                            </div>
                        </div>
                        <div class="duel-meta">
                            <span style="opacity:0.7;"><i class="fa-regular fa-clock"></i> ${new Date(d.createdAt).toLocaleDateString()}</span>
                            <div style="display:flex; align-items:center; gap:5px;">
                                ${actionBtn}
                            </div>
                        </div>
                    </div>
                `;
            });
            // html += '</div>'; // Remove close

            list.innerHTML = html;

            // Check for newly completed duels to show popup
            socialUI.checkDuelCompletion(duels);
        });
    },

    checkDuelCompletion: (duels) => {
        // We need to track seen 'completed' duels to avoid identifying them as new on reload.
        // A simple way is to use localStorage to store IDs of completed duels we've already shown.
        // If a duel is completed AND not in local storage, we show it.
        const seen = JSON.parse(localStorage.getItem('seen_duel_results') || '[]');
        const myUid = window.auth.getCurrentUser().uid;

        duels.forEach(d => {
            if (d.status === 'completed' && !seen.includes(d.id)) {
                // Show Popup
                socialUI.showDuelResultPopup(d, myUid);
                // Mark as seen
                seen.push(d.id);
                localStorage.setItem('seen_duel_results', JSON.stringify(seen));
            }
        });
    },

    showDuelResultPopup: (duel, myUid) => {
        const iWon = duel.winner === myUid;
        const tie = duel.winner === 'tie';
        const isChallenger = duel.challengerId === myUid;
        const opponentName = isChallenger ? duel.opponentPseudo : duel.challengerPseudo;

        const myScore = duel.scores[myUid];
        const opponentId = isChallenger ? duel.opponentId : duel.challengerId;
        const opponentScore = duel.scores[opponentId];

        const title = iWon ? "Victoire ! 🎉" : (tie ? "Égalité ! 🤝" : "Défaite... 💀");
        const color = iWon ? "#4ade80" : (tie ? "#fbbf24" : "#f87171");

        // Create modal dynamically if simpler, or use hidden one.
        // Let's create a simple overlay div
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0'; div.style.left = '0'; div.style.width = '100%'; div.style.height = '100%';
        div.style.background = 'rgba(0,0,0,0.85)';
        div.style.zIndex = '10000';
        div.style.display = 'flex'; div.style.justifyContent = 'center'; div.style.alignItems = 'center';
        div.innerHTML = `
            <div class="glass-panel animate-in" style="padding:30px; text-align:center; max-width:90%; width:350px; border: 2px solid ${color}; box-shadow: 0 0 20px ${color}40;">
                <h2 style="color:${color}; font-size:2rem; margin-bottom:10px;">${title}</h2>
                <p style="color:#ccc; margin-bottom:20px;">Duel terminé contre <strong style="color:var(--accent-blue);">${opponentName}</strong></p>
                
                <div style="display:flex; justify-content:center; align-items:center; gap:20px; margin-bottom:30px;">
                    <div style="text-align:center;">
                        <span style="display:block; font-size:0.8rem; color:#aaa;">Toi</span>
                        <span style="font-size:2.5rem; font-weight:bold; color:white;">${myScoreVal}</span>
                    </div>
                    <span style="font-size:1.5rem; color:#555;">-</span>
                    <div style="text-align:center;">
                        <span style="display:block; font-size:0.8rem; color:#aaa;">Adversaire</span>
                        <span style="font-size:2.5rem; font-weight:bold; color:white;">${opponentScoreVal}</span>
                    </div>
                </div>

                <button id="closeDuelResultBtn" class="btn-glass" style="width:100%;">Fermer</button>
            </div>
        `;
        document.body.appendChild(div);

        document.getElementById('closeDuelResultBtn').onclick = () => {
            div.remove();
        };
    },


    startNewDuel: () => {
        document.getElementById('socialModal').classList.add('hidden');
        document.getElementById('duelConfigModal').classList.remove('hidden');
    },

    setDuelMode: (mode) => {
        socialUI.currentDuelMode = mode;
        const btnLink = document.getElementById('btnDuelLink');
        const btnFriend = document.getElementById('btnDuelFriend');
        const friendSelect = document.getElementById('duelFriendSelect');

        if (mode === 'link') {
            btnLink.classList.add('active'); btnFriend.classList.remove('active');
            friendSelect.classList.add('hidden');
        } else {
            btnFriend.classList.add('active'); btnLink.classList.remove('active');
            friendSelect.classList.remove('hidden');
            socialUI.updateDuelFriendList();
        }
    },

    updateDuelFriendList: async () => {
        const container = document.getElementById('duelFriendList');
        if (!container) return; // Guard

        container.innerHTML = '<div class="loader-spinner"></div>';
        const friends = await window.auth.getFriends();

        if (friends.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#aaa; padding:1rem;">Vous n\'avez pas encore d\'amis.</p>';
            return;
        }

        // Fetch fresh data for avatars/pseudos
        const friendIds = friends.map(f => f.uid);
        const friendsData = await window.auth.getFriendsData(friendIds);

        let html = '';
        friends.forEach(f => {
            const data = friendsData[f.uid] || { status: 'offline', pseudo: f.pseudo };
            const initial = data.pseudo.charAt(0).toUpperCase();
            const statusColor = data.status === 'online' ? '#4ade80' : '#64748b';

            // OnClick, we select this card
            html += `
                <div class="friend-card clickable-card" data-pseudo="${data.pseudo}" onclick="socialUI.selectDuelOpponent(this, '${data.pseudo.replace(/'/g, "\\'")}')"
                     style="cursor:pointer; border:1px solid rgba(255,255,255,0.1); margin-bottom:0.5rem;">
                    <div class="friend-info">
                        <div class="friend-avatar" style="width:36px; height:36px; font-size:1rem;">
                            ${initial}
                             <div class="friend-status-dot" style="background:${statusColor}; border-color:var(--bg-card);"></div>
                        </div>
                        <span class="friend-name">${data.pseudo}</span>
                    </div>
                    <div class="selection-indicator">
                        <i class="fa-regular fa-circle" style="color:#666;"></i>
                    </div>
                </div>
             `;
        });
        container.innerHTML = html;

        const hiddenInput = document.getElementById('selectedDuelFriendId');
        if (hiddenInput) hiddenInput.value = '';

        // Handle Preselection
        if (socialUI.pendingPreselect) {
            const card = container.querySelector(`.friend-card[data-pseudo="${socialUI.pendingPreselect}"]`);
            if (card) {
                socialUI.selectDuelOpponent(card, socialUI.pendingPreselect);
                // Scroll to card
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            socialUI.pendingPreselect = null;
        }
    },

    selectDuelOpponent: (cardEl, pseudo) => {
        // Deselect all
        const allCards = document.querySelectorAll('#duelFriendList .friend-card');
        allCards.forEach(c => {
            c.classList.remove('selected');
            c.style.borderColor = 'rgba(255,255,255,0.1)';
            c.style.background = 'rgba(255,255,255,0.03)';
            c.querySelector('.selection-indicator').innerHTML = '<i class="fa-regular fa-circle" style="color:#666;"></i>';
        });

        // Select Current
        cardEl.classList.add('selected');
        cardEl.style.borderColor = 'var(--accent-gold)';
        cardEl.style.background = 'rgba(251, 191, 36, 0.1)';
        cardEl.querySelector('.selection-indicator').innerHTML = '<i class="fa-solid fa-check-circle" style="color:var(--accent-gold);"></i>';

        // Update Hidden Input
        document.getElementById('selectedDuelFriendId').value = pseudo;
    },

    startDuelWith: (pseudo) => {
        socialUI.startNewDuel();
        socialUI.pendingPreselect = pseudo; // Set flag
        socialUI.setDuelMode('friend');
        // setDuelMode calls updateDuelFriendList, which will use the flag
    },

    launchDuel: async () => {
        const config = { eras: [], onlyWatched: false };
        let opponentPseudo = null;
        if (socialUI.currentDuelMode === 'friend') {
            const inputVal = document.getElementById('selectedDuelFriendId').value;
            opponentPseudo = inputVal;
            if (!opponentPseudo) return alert("Veuillez sélectionner un ami.");
        }

        const duelId = await window.social.createDuel(config, opponentPseudo);
        if (duelId) {
            document.getElementById('duelConfigModal').classList.add('hidden');
            socialUI.playDuel(duelId);
        }
    },

    playDuel: async (duelId) => {
        const duelRef = window.db.collection('duels').doc(duelId);
        const doc = await duelRef.get();
        if (!doc.exists) return;

        const data = doc.data();
        const questions = data.questions;

        console.log("🐛 PLAY DUEL DATA:", questions);
        if (!questions) alert("Attention: Pas de questions dans la base de données !");

        window.quiz.startDuel(duelId, questions);
    },

    acceptAndPlay: async (duelId) => {
        const success = await window.social.acceptDuel(duelId);
        if (success) socialUI.playDuel(duelId);
    },

    copyLink: (duelId) => {
        const url = `${window.location.origin}${window.location.pathname}?duel=${duelId}`;
        navigator.clipboard.writeText(url).then(() => alert("Lien copié !"));
    },

    handleSendRequest: async () => {
        const input = document.getElementById('addFriendInput');
        const feedback = document.getElementById('requestFeedback');
        const pseudo = input.value.trim();

        if (!pseudo) return;

        // Reset feedback
        if (feedback) feedback.innerHTML = '<span style="color:#aaa;">Envoi...</span>';

        try {
            const result = await window.auth.sendFriendRequest(pseudo);

            if (feedback) {
                if (result.success) {
                    feedback.innerHTML = `<span style="color:#4ade80;"><i class="fa-solid fa-check"></i> ${result.message}</span>`;
                    input.value = ''; // Clear input
                } else {
                    feedback.innerHTML = `<span style="color:#f87171;"><i class="fa-solid fa-circle-exclamation"></i> ${result.message}</span>`;
                }
            } else {
                // Fallback if container missing
                alert(result.message);
                if (result.success) input.value = '';
            }
        } catch (err) {
            console.error(err);
            if (feedback) feedback.innerHTML = `<span style="color:#f87171;">Erreur: ${err.message || "Inconnue"}</span>`;
        }
    },

    // Confirm Deletion with Custom UI
    confirmDeleteDuel: (duelId) => {
        socialUI.showConfirmModal(
            "Supprimer ce défi ?",
            "Cette action est irréversible.",
            async () => {
                await window.social.deleteDuel(duelId);
                socialUI.showToast("Défi supprimé avec succès !");
            }
        );
    },

    showConfirmModal: (title, message, onConfirm) => {
        const div = document.createElement('div');
        div.id = 'customConfirmModal';
        div.style.position = 'fixed';
        div.style.top = '0'; div.style.left = '0'; div.style.width = '100%'; div.style.height = '100%';
        div.style.background = 'rgba(0,0,0,0.8)';
        div.style.zIndex = '20000';
        div.style.display = 'flex'; div.style.justifyContent = 'center'; div.style.alignItems = 'center';

        div.innerHTML = `
            <div class="glass-panel animate-in" style="padding:25px; text-align:center; max-width:90%; width:320px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color:white; font-size:1.2rem; margin-bottom:10px;">${title}</h3>
                <p style="color:#ccc; margin-bottom:20px; font-size:0.95rem;">${message}</p>
                <div style="display:flex; justify-content:center; gap:15px;">
                    <button id="btnCancelConfirm" class="btn-glass-small" style="background:rgba(255,255,255,0.1);">Annuler</button>
                    <button id="btnOkConfirm" class="btn-glass-small" style="background:var(--accent-red); color:white;">Supprimer</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        document.getElementById('btnCancelConfirm').onclick = () => div.remove();
        document.getElementById('btnOkConfirm').onclick = async () => {
            div.remove();
            if (onConfirm) await onConfirm();
        };
    },

    showToast: (message) => {
        const div = document.createElement('div');
        div.className = 'toast animate-in';
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.background = 'rgba(0,0,0,0.9)';
        div.style.border = '1px solid var(--accent-gold)';
        div.style.color = 'white';
        div.style.padding = '10px 20px';
        div.style.borderRadius = '30px';
        div.style.zIndex = '30000';
        div.style.fontSize = '0.9rem';
        div.innerText = message;
        document.body.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 500);
        }, 3000);
    },

    // Notification System
    counts: { requests: 0, duels: 0 },

    initListeners: () => {
        if (!window.auth || typeof window.auth.getCurrentUser !== 'function' || !window.auth.getCurrentUser()) return;

        // Listen for Friend Requests
        window.auth.getPendingRequests((reqs) => {
            socialUI.counts.requests = reqs.length;
            socialUI.updateBadge();
        });

        // Listen for Duels (Turn to play)
        window.social.subscribeToDuels((duels) => {
            const myUid = window.auth.getCurrentUser().uid;
            let actionCount = 0;
            duels.forEach(d => {
                if (d.status === 'active') {
                    // It's active, check if I played
                    if (!d.scores[myUid]) actionCount++;
                } else if (d.status.startsWith('pending')) {
                    if (d.opponentId === myUid) actionCount++; // Invite for me
                    else if (d.challengerId === myUid && !d.scores[myUid]) actionCount++; // I created but haven't played
                }
            });
            socialUI.counts.duels = actionCount;
            socialUI.updateBadge();
        });
    },

    updateBadge: () => {
        const total = socialUI.counts.requests + socialUI.counts.duels;
        const badge = document.getElementById('socialBadge');
        if (!badge) return;

        if (total > 0) {
            badge.textContent = total > 9 ? '9+' : total;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

window.socialUI = socialUI;
