// firebase-config.js
// Configuration Firebase

const firebaseConfig = {
    apiKey: "AIzaSyA7mHBxznWk8HCLRfYU1wx030V3knthi48",
    authDomain: "chronoexplorer-8bee6.firebaseapp.com",
    projectId: "chronoexplorer-8bee6",
    storageBucket: "chronoexplorer-8bee6.firebasestorage.app",
    messagingSenderId: "891156663692",
    appId: "1:891156663692:web:70756cba34d7cf44599aa9",
    measurementId: "G-Y51K0BQRPL"
};

// Initialisation de Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);

    // Initialisation des services
    // Nous utilisons window.auth et window.db pour les rendre accessibles globalement si besoin,
    // mais auth.js utilise déjà les variables globales créées par le SDK compat.

    // Initialisation des services
    // On attache à window pour accès global
    window.firebaseAuth = firebase.auth();
    window.db = firebase.firestore();

    // Fallback variables for older scripts if needed (though we should use window.firebaseAuth)
    var auth = window.firebaseAuth;
    var db = window.db;

    console.log("🔥 Firebase connecté avec succès au projet:", firebaseConfig.projectId);

    // Activer la persistance hors ligne pour Firestore si possible
    db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.log("Persistence failed: multiple tabs open");
            } else if (err.code == 'unimplemented') {
                console.log("Persistence not supported by browser");
            }
        });

} else {
    console.error("Le SDK Firebase n'est pas chargé correctment.");
}
