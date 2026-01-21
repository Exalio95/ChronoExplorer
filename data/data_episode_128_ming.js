const episodeTitle_128 = "1368 : Fondation des Ming - Le Réveil du Dragon";

const data_ep128 = [
    {
        id: 12801,
        category: "Empereur",
        content: "Du mendiant au trône",
        date: "Hongwu",
        detail: "Zhu Yuanzhang est né paysan pauvre. Orphelin, il a mendié pour survivre, est devenu moine bouddhiste, puis chef rebelle. En 1368, il chasse les Mongols et fonde la dynastie Ming ('Brillante'). C'est l'un des rares empereurs de l'histoire chinoise, avec Liu Bang des Han, à être parti du plus bas de l'échelle sociale.",
        tags: ["Rebelle", "Empereur", "Ascension"],
        img: "assets/images/ep128_hongwu_portrait.png"
    },
    {
        id: 12802,
        category: "Politique",
        content: "Purges paranoïaques",
        date: "Terreur",
        detail: "Hongwu était maladivement paranoïaque. Craignant les complots, il a exécuté environ 100 000 personnes (fonctionnaires, généraux, familles) et aboli le poste de Premier Ministre pour concentrer tout le pouvoir. Il humiliait ses ministres en les obligeant à venir travailler à genoux devant lui.",
        tags: ["Terreur", "Pouvoir", "Paranoïa"],
        img: "assets/images/ep128_ming_purge.png"
    },
    {
        id: 12803,
        category: "Construction",
        content: "La Grande Muraille (la vraie)",
        date: "Pierre",
        detail: "Ce qu'on visite aujourd'hui (les murs de briques et de pierre), ce n'est pas la muraille antique, c'est celle des Ming. Pour empêcher le retour des Mongols, ils ont reconstruit la muraille sur 8800 km, plus solide que jamais. C'est le plus grand chantier militaire de l'histoire de l'humanité.",
        tags: ["Muraille", "Architecture", "Chine"],
        img: "assets/images/ep128_great_wall_ming.png"
    },
    {
        id: 12804,
        category: "Art",
        content: "Bleu et Blanc",
        date: "Porcelaine",
        detail: "L'époque Ming est l'âge d'or de la porcelaine 'Bleu et Blanc' (le bleu venait de cobalt importé de Perse). Ces vases valaient plus cher que l'or en Europe. Le mot 'Ming' est littéralement devenu synonyme de vase précieux dans la culture populaire occidentale.",
        tags: ["Art", "Vase", "Commerce"],
        img: "assets/images/ep128_ming_vase.png"
    },
    {
        id: 12805,
        category: "Ville",
        content: "La Cité Interdite",
        date: "1420",
        detail: "L'empereur Yongle a déplacé la capitale de Nankin à Pékin et construit la Cité Interdite : une ville dans la ville avec symboliquement 9999 pièces et demie (seul le Ciel en a 10 000). Aucun homme, sauf l'empereur et les eunuques, ne pouvait y dormir. Un million d'ouvriers ont travaillé dessus pendant 14 ans.",
        tags: ["Architecture", "Pékin", "Palais"],
        img: "assets/images/ep128_forbidden_city.png"
    },
    {
        id: 12806,
        category: "Livre",
        content: "Encyclopédie de Yongle",
        date: "Savoir",
        detail: "Yongle a commandé la plus grande encyclopédie papier de l'histoire : 11 095 volumes compilant tout le savoir chinois ! Une perte immense pour l'humanité : il en restait moins de 400 volumes après le pillage de Pékin par les armées occidentales en 1860 et 1900.",
        tags: ["Livre", "Savoir", "Perte"],
        img: "assets/images/ep128_yongle_encyclopedia.png"
    },
    {
        id: 12807,
        category: "Société",
        content: "Les Eunuques",
        date: "Contre-pouvoir",
        detail: "Pour contrer les lettrés confucéens, les empereurs Ming se sont appuyés sur les eunuques (castrés, donc sans descendance dynastique). Ils sont devenus une 'mafia' ultra-puissante qui contrôlait la police secrète. Le chef des eunuques de Zheng He, par exemple, était promu amiral de la flotte impériale.",
        tags: ["Politique", "Pouvoir", "Intrigue"],
        img: "assets/images/ep128_ming_eunuch.png"
    },
    {
        id: 12808,
        category: "Isolationnisme",
        content: "Fermeture (Haijin)",
        date: "Interdit",
        detail: "Après une période d'ouverture, les Ming ont interdit le commerce maritime privé (Haijin) : 'Pas une planche ne doit aller à la mer'. La Chine s'est refermée sur elle-même pour se protéger, laissant les océans aux Européens. Une erreur stratégique qui coûtera cher au 19ème siècle.",
        tags: ["Mer", "Erreur", "Fermeture"],
        img: "assets/images/ep128_burned_ships.png"
    },
    {
        id: 12809,
        category: "Agriculture",
        content: "La révolution de la patate",
        date: "Nouveau Monde",
        detail: "Vers la fin des Ming, les cultures américaines (maïs, patate douce) sont arrivées via les Portugais. Cela a permis une explosion démographique car elles poussaient sur les terres pauvres. La Chine moderne ne pourrait pas nourrir sa population gigantesque sans ces plantes importées.",
        tags: ["Agriculture", "Démographie", "Échange"],
        img: "assets/images/ep128_sweet_potato.png"
    },
    {
        id: 12810,
        category: "Littérature",
        content: "Le Voyage en Occident",
        date: "Roman",
        detail: "C'est sous les Ming que sont écrits les 'Quatre Livres Extraordinaires', dont 'Le Voyage en Occident' racontant les aventures du Roi-Singe. La littérature populaire explose. Pour l'anecdote, c'est ce roman qui a directement inspiré le manga Dragon Ball.",
        tags: ["Livre", "CulturePop", "Roman"],
        img: "assets/images/ep128_monkey_king.png"
    },
    {
        id: 12811,
        category: "Guerre",
        content: "Armes à feu",
        date: "Mosquet",
        detail: "Les Ming ont créé le 'Bataillon des Armes à Feu' (Shenjiying) à Pékin, utilisant arquebuses, canons et mines terrestres. Ils étaient technologiquement en avance sur l'Europe... jusqu'à ce qu'ils arrêtent d'innover et se fassent dépasser.",
        tags: ["Arme", "Poudre", "Technologie"],
        img: "assets/images/ep128_ming_firearms.png"
    },
    {
        id: 12812,
        category: "Économie",
        content: "Le piège de l'argent",
        date: "Monnaie",
        detail: "Les Ming sont revenus à l'argent métal comme monnaie. Mais la Chine n'ayant pas assez de mines, elle est devenue dépendante de l'argent importé du Japon et des Amériques (via les Espagnols). Quand ce flux s'est tari au 17ème siècle, l'économie Ming s'est écroulée.",
        tags: ["Argent", "Économie", "Crise"],
        img: "assets/images/ep128_silver_tael.png"
    },
    {
        id: 12813,
        category: "Religion",
        content: "Jésuites",
        date: "Matteo Ricci",
        detail: "Le jésuite italien Matteo Ricci arrive à Pékin et impressionne la cour avec ses cartes du monde et ses horloges, initiant les échanges intellectuels directs. Pour se faire accepter des élites, Ricci s'habillait et vivait comme un lettré confucéen chinois.",
        tags: ["Religion", "Science", "Rencontre"],
        img: "assets/images/ep128_matteo_ricci.png"
    },
    {
        id: 12814,
        category: "Fin",
        content: "L'arbre du pendu",
        date: "1644",
        detail: "En 1644, une révolte paysanne prend Pékin. Le dernier empereur Chongzhen monte sur la Colline de Charbon derrière la Cité Interdite et se pend à un arbre. Cet arbre (un sophora, ou du moins une replantation symbolique) existe toujours dans le parc Jingshan.",
        tags: ["Suicide", "Fin", "Arbre"],
        img: "assets/images/ep128_chongzhen_suicide.png"
    },
    {
        id: 12815,
        category: "Héritage",
        content: "La Chine 'Chinoise'",
        date: "Identité",
        detail: "Les Ming sont la dernière dynastie purement Han (les Qing suivants seront Mandchous). Ils représentent le 'cœur' de l'identité chinoise traditionnelle. Les costumes 'Hanfu' portés fièrement aujourd'hui par les jeunes sont souvent inspirés du style Ming.",
        tags: ["Identité", "Mode", "Histoire"],
        img: "assets/images/ep128_hanfu_ming.png"
    }
];
