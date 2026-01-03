const episodeTitle_100 = "451 : Les Champs Catalauniques";
const data_ep100 = [
    // --- ÉPISODE 100 : 451 LES CHAMPS CATALAUNIQUES (VERSION ÉTENDUE) ---
    {
        id: 10001,
        theme: "qhfd",
        type: "flashcard",
        category: "Menace",
        content: "Le Fléau de Dieu.",
        detail: "Attila, roi des Huns, a unifié les tribus des steppes. Il a ravagé l'Empire d'Orient, qui lui paie un tribut humiliant en or. Maintenant, il tourne son regard vers l'Occident. Il prétend vouloir épouser la sœur de l'Empereur (Honoria) et demande la moitié de l'empire comme dot. Refus. Il envahit la Gaule.",
        priority: 1,
        tags: ["Personnage", "Guerre"]
    },
    {
        id: 10002,
        theme: "qhfd",
        type: "flashcard",
        category: "Terreur",
        content: "L'herbe ne repousse pas.",
        detail: "La légende dit : 'Là où passe le cheval d'Attila, l'herbe ne repousse pas'. Les Huns sont terrifiants : visages scarifiés dès l'enfance, vie à cheval (ils mangent et dorment à cheval), archers hors pair. Ils brûlent Metz, Reims... Paris tremble.",
        priority: 2,
        tags: ["Légende", "Peur"]
    },
    {
        id: 10003,
        theme: "qhfd",
        type: "flashcard",
        category: "Miracle",
        content: "Sainte Geneviève.",
        detail: "À Paris (Lutèce), la panique règne. Une une jeune moniale, Geneviève, exhorte les hommes à ne pas fuir : 'Que les hommes fuient s'ils veulent, nous les femmes nous prierons Dieu'. Attila contourne finalement Paris pour aller vers Orléans. Geneviève devient la patronne de Paris.",
        priority: 2,
        tags: ["Religion", "Paris"]
    },
    {
        id: 10004,
        theme: "qhfd",
        type: "flashcard",
        category: "Héros",
        content: "Aetius : le Dernier des Romains.",
        detail: "Face à Attila, un homme se dresse : Flavius Aetius. C'est le généralissime romain. Ironie : il a vécu otage chez les Huns dans sa jeunesse, il est ami d'enfance d'Attila ! Il connaît leurs tactiques. Il sait qu'il ne peut pas vaincre seul avec une armée romaine en ruine.",
        priority: 1,
        tags: ["Personnage", "Rival"]
    },
    {
        id: 10005,
        theme: "qhfd",
        type: "flashcard",
        category: "Alliance",
        content: "L'union sacrée.",
        detail: "Aetius réussit l'impossible : coaliser les Romains et leurs ennemis barbares (Wisigoths, Francs, Burgondes) contre le danger commun. Théodoric, roi des Wisigoths (les anciens pilleurs de Rome !), accepte de combattre aux côtés d'Aetius pour sauver l'Occident.",
        priority: 1,
        tags: ["Diplomatie", "Europe"]
    },
    {
        id: 10006,
        theme: "qhfd",
        type: "flashcard",
        category: "Bataille",
        content: "Le choc des nations.",
        detail: "La bataille a lieu près de Troyes (site exact incertain, 'Campus Mauriacus'). C'est gigantesque. Des dizaines de milliers de cavaliers s'affrontent. C'est l'une des batailles les plus sanglantes de l'Antiquité. Huns contre Goths, Romains contre Ostrogoths (alliés d'Attila). Une guerre civile européenne.",
        priority: 1,
        tags: ["Guerre", "Sang"]
    },
    {
        id: 10007,
        theme: "qhfd",
        type: "flashcard",
        category: "Sacrifice",
        content: "La mort du Roi.",
        detail: "Le vieux roi Wisigoth Théodoric est tué dans la charge, piétiné par ses propres cavaliers. Son fils Thorismond est proclamé roi sur le champ de bataille, élevé sur les boucliers. Fous de rage, les Wisigoths chargent et brisent les lignes des Huns.",
        priority: 2,
        tags: ["Mort", "Héroïsme"]
    },
    {
        id: 10008,
        theme: "qhfd",
        type: "flashcard",
        category: "Siège",
        content: "Attila encerclé.",
        detail: "Attila, vaincu, se retranche dans son camp de chariots. Il fait dresser un immense bûcher avec les selles de ses chevaux. Il est prêt à s'y jeter pour brûler vif plutôt que d'être capturé. C'est la première fois qu'il connaît la défaite.",
        priority: 2,
        tags: ["Désespoir", "Honneur"]
    },
    {
        id: 10009,
        theme: "qhfd",
        type: "flashcard",
        category: "Politique",
        content: "L'erreur d'Aetius ?",
        detail: "Au matin, Aetius ne donne pas l'assaut final. Il laisse Attila s'enfuir. Pourquoi ? Il craint que si les Huns sont anéantis, les Wisigoths deviendront trop puissants et détruiront Rome. Il veut garder un équilibre de la terreur. Machiavélique.",
        priority: 2,
        tags: ["Stratégie", "Calcul"]
    },
    {
        id: 10010,
        theme: "qhfd",
        type: "flashcard",
        category: "Conséquence",
        content: "Le mythe sauvé.",
        detail: "L'Occident chrétien est sauvé de la domination nomade. Attila reviendra l'année suivante en Italie (rencontrant le Pape Léon Ier), mais son aura d'invincibilité est brisée. Il mourra peu après, officiellement d'un saignement de nez lors d'une nuit de noce (ou empoisonné ?).",
        priority: 1,
        tags: ["Histoire", "Religion"]
    },
    {
        id: 10011,
        theme: "qhfd",
        type: "flashcard",
        category: "Francs",
        content: "Mérovée était là.",
        detail: "Parmi les alliés d'Aetius, il y avait les Francs Saliens, dirigés peut-être par le légendaire Mérovée, grand-père de Clovis. C'est ici que les Francs entrent vraiment dans la grande histoire comme défenseurs de la Gaule.",
        priority: 2,
        tags: ["France", "Origine"]
    },
    {
        id: 10012,
        theme: "qhfd",
        type: "flashcard",
        category: "Archéologie",
        content: "Le trésor de Pouan.",
        detail: "Au XIXe siècle, on a trouvé près de Troyes une tombe princière avec des bijoux en or et grenat et une épée magnifique. On a cru que c'était Théodoric. Aujourd'hui, on pense que c'est un noble germanique de l'entourage d'Attila. Une trace tangible du carnage.",
        priority: 3,
        tags: ["Objet", "Or"]
    },
    {
        id: 10013,
        theme: "qhfd",
        type: "flashcard",
        category: "Fin",
        content: "La fin d'Aetius.",
        detail: "Le sauveur de l'Empire sera mal récompensé. L'empereur Valentinien III, jaloux de sa gloire, l'assassine de sa propre main en 454. Un courtisan dira : 'Vous venez de couper votre main droite avec votre main gauche'. Rome tombe définitivement 20 ans plus tard.",
        priority: 2,
        tags: ["Trahison", "Chute"]
    },
    {
        id: 10014,
        theme: "qhfd",
        type: "flashcard",
        category: "Culture",
        content: "Les Nibelungen.",
        detail: "Le souvenir de ces guerres contre les Huns (Etzel) et les Burgondes (Gunther) se transformera au fil des siècles pour devenir la Chanson des Nibelungen, l'épopée nationale allemande qui inspirera Wagner. L'histoire devient mythe.",
        priority: 3,
        tags: ["Mythe", "Opéra"]
    },
    {
        id: 10015,
        theme: "qhfd",
        type: "flashcard",
        category: "Bilan",
        content: "Une bataille décisive ?",
        detail: "Les historiens débattent. Pour certains, c'est l'un des '15 batailles décisives du monde' (ne pas parler hunnique aujourd'hui). Pour d'autres, l'Empire était déjà mort, et ce n'était qu'un dernier baroud d'honneur d'un monde en fusion.",
        priority: 2,
        tags: ["Débat", "Bilan"]
    }
];
