const episodeTitle_123 = "1240 : Soundiata Keïta - Le Roi Lion du Mali";

const data_ep123 = [
    {
        id: 12301,
        category: "Légende",
        content: "L'enfant infirme",
        date: "Naissance",
        detail: "Soundiata Keïta est né infirme, incapable de marcher. On se moquait de lui ('il rampe comme un vers'). Un jour, humilié pour sa mère, il s'est levé en s'appuyant sur une barre de fer qui s'est tordue sous sa force (arc de triomphe). Il a marché. <br><br><strong>Anecdote:</strong> C'est le 'Miracle de la barre de fer', fondateur de l'épopée.",
        tags: ["Handicap", "Miracle", "Force"],
        img: "assets/images/ep123_iron_bar.png"
    },
    {
        id: 12302,
        category: "Adversaire",
        content: "Soumaoro Kanté",
        date: "Le Roi Sorcier",
        detail: "Son ennemi était Soumaoro Kanté, le roi forgeron-sorcier du Sosso. Il portait des vêtements en peau humaine et décorait sa chambre avec des têtes coupées. Il était réputé invulnérable aux armes de fer. <br><br><strong>Anecdote:</strong> L'archétype du méchant absolu.",
        tags: ["Magie", "Méchant", "Sosso"],
        img: "assets/images/ep123_soumaoro.png"
    },
    {
        id: 12303,
        category: "Guerre",
        content: "Bataille de Kirina",
        date: "1235",
        detail: "La bataille finale. Pour vaincre Soumaoro (invulnérable au fer), Soundiata a utilisé une flèche munie d'un ergot de coq blanc (le seul totem qui pouvait percer sa magie). Touché, Soumaoro s'est enfui dans une grotte et a disparu à jamais. <br><br><strong>Anecdote:</strong> L'UNESCO considère Kirina comme une bataille décisive de l'histoire africaine.",
        tags: ["Bataille", "Magie", "Victoire"],
        img: "assets/images/ep123_kirina_battle.png"
    },
    {
        id: 12304,
        category: "Politique",
        content: "Mansa (Empereur)",
        date: "Empire du Mali",
        detail: "Soundiata unifie les royaumes Mandingues et fonde l'Empire du Mali. Il prend le titre de 'Mansa' (Roi des Rois). L'empire deviendra l'un des plus riches du monde grâce à l'or. <br><br><strong>Anecdote:</strong> C'est la base de la richesse qui rendra célèbre son descendant Mansa Moussa.",
        tags: ["Empire", "Or", "Politique"],
        img: "assets/images/ep123_mali_map.png"
    },
    {
        id: 12305,
        category: "Loi",
        content: "Charte du Manden",
        date: "1236",
        detail: "À Kurukan Fuga, Soundiata proclame une 'Constitution' orale. Elle abolit l'esclavage par razzia entre clans, organise la société en castes de métiers (forgerons, griots...) et déclare : 'Une vie est une vie. Aucune vie n'est supérieure à une autre'. <br><br><strong>Anecdote:</strong> C'est l'une des premières déclarations des droits de l'homme, bien avant 1789.",
        tags: ["Constitution", "Droits", "UNESCO"],
        img: "assets/images/ep123_kurukan_fuga.png"
    },
    {
        id: 12306,
        category: "Culture",
        content: "Les Griots (Djoliba)",
        date: "Mémoire",
        detail: "Soundiata a institutionnalisé le rôle des Griots (les maîtres de la parole). Ils sont les gardiens de l'histoire et les conseillers des rois. Sans eux, pas d'histoire écrite, donc pas de mémoire. <br><br><strong>Anecdote:</strong> L'épopée de Soundiata est racontée de bouche à oreille depuis 800 ans par la famille Kouyaté.",
        tags: ["Oralité", "Musique", "Histoire"],
        img: "assets/images/ep123_griot_kora.png"
    },
    {
        id: 12307,
        category: "Société",
        content: "Le cousinage à plaisanterie",
        date: "Sanankouya",
        detail: "La charte a instauré le 'Sanankouya' : l'obligation de se moquer gentiment de certains clans alliés. Cela permet de désamorcer les conflits par le rire ('Tu es un mangeur de haricots !'). <br><br><strong>Anecdote:</strong> Cette tradition existe toujours en Afrique de l'Ouest et préserve la paix sociale.",
        tags: ["Paix", "Humour", "Société"],
        img: "assets/images/ep123_joking_relationship.png"
    },
    {
        id: 12308,
        category: "Religion",
        content: "Islam et Animisme",
        date: "Syncrétisme",
        detail: "Soundiata était musulman (pour le commerce avec le Nord) mais restait un grand sorcier chasseur (pour la légitimité locale). Il mélangeait les deux traditions sans conflit. <br><br><strong>Anecdote:</strong> L'Empire du Mali sera un modèle d'Islam tolérant et africain.",
        tags: ["Islam", "Magie", "Mélange"],
        img: "assets/images/ep123_mosque_djenne.png"
    },
    {
        id: 12309,
        category: "Mythe",
        content: "Le Roi Lion",
        date: "Disney ?",
        detail: "Soundiata est souvent appelé le 'Roi Lion' (Jata signifie Lion). Certains disent que l'histoire de Disney s'inspire de lui (l'exil, le retour, l'oncle méchant Scar/Soumaoro). <br><br><strong>Anecdote:</strong> 'Simba' veut dire lion en Swahili (Afrique de l'Est), pas en Mandingue, mais le parallèle est troublant.",
        tags: ["Disney", "Lion", "CulturePop"],
        img: "assets/images/ep123_lion_king_poster.png"
    },
    {
        id: 12310,
        category: "Objet",
        content: "Le Balafon sacré",
        date: "Sosso Bala",
        detail: "Soundiata a volé le 'Sosso Bala', le balafon magique de Soumaoro Kanté. Cet instrument existe toujours ! Il est gardé dans un village en Guinée (Niagassola) par la famille Kouyaté. <br><br><strong>Anecdote:</strong> C'est un patrimoine immatériel de l'humanité (UNESCO).",
        tags: ["Musique", "Relique", "UNESCO"],
        img: "assets/images/ep123_sosso_bala.png"
    },
    {
        id: 12311,
        category: "Économie",
        content: "L'Or et le Sel",
        date: "Richesse",
        detail: "L'empire contrôlait les mines d'or du Bambouk et du Bouré. Ils échangeaient l'or contre le sel du Sahara (poids pour poids !). <br><br><strong>Anecdote:</strong> L'Europe médiévale frappait ses monnaies avec l'or du Mali sans le savoir.",
        tags: ["Or", "Commerce", "Sahara"],
        img: "assets/images/ep123_gold_salt_trade.png"
    },
    {
        id: 12312,
        category: "Géographie",
        content: "Niani, la capitale perdue",
        date: "Mystère",
        detail: "Soundiata a fondé sa capitale à Niani. On a longtemps cherché où c'était. Les archéologues pensent l'avoir trouvée à la frontière Guinée-Mali, mais elle a disparu sous la végétation. <br><br><strong>Anecdote:</strong> Une Atlantide africaine.",
        tags: ["Archéologie", "Ville", "Afrique"],
        img: "assets/images/ep123_niani_ruins.png"
    },
    {
        id: 12313,
        category: "Femmes",
        content: "Sogolon",
        date: "La Mère",
        detail: "Sa mère, Sogolon 'la femmebuffle', était laide et bossue, mais possédait un grand pouvoir spirituel (le 'Baraka'). C'est d'elle que Soundiata tire sa force. L'épopée valorise énormément le rôle des mères. <br><br><strong>Anecdote:</strong> Un proverbe malien dit : 'On peut tout changer, sauf la mère'.",
        tags: ["Femme", "Mère", "Magie"],
        img: "assets/images/ep123_sogolon.png"
    },
    {
        id: 12314,
        category: "Mort",
        content: "Mort dans l'eau ?",
        date: "1255",
        detail: "La mort de Soundiata est mystérieuse. Il se serait noyé dans la rivière Sankarani et serait devenu un hippopotame (esprit de l'eau). Sa tombe est un secret gardé par les initiés. <br><br><strong>Anecdote:</strong> Il n'est pas mort, il est 'parti'.",
        tags: ["Mort", "Légende", "Eau"],
        img: "assets/images/ep123_hippo_spirit.png"
    },
    {
        id: 12315,
        category: "Héritage",
        content: "L'Afrique Impériale",
        date: "Fierté",
        detail: "L'épopée de Soundiata est fondamentale pour la fierté africaine. Elle prouve que l'Afrique avait des grands empires, des constitutions et des philosophies complexes bien avant l'arrivée des Européens. <br><br><strong>Anecdote:</strong> C'est le cœur de l'identité mandingue (Mali, Guinée, Sénégal, Gambie...).",
        tags: ["Identité", "Afrique", "Histoire"],
        img: "assets/images/ep123_statue_bamako.png"
    }
];
