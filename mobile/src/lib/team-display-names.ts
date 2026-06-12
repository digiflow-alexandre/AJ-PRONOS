/**
 * Traduction FR des équipes nationales (foot + tennis) pour l'affichage.
 *
 * IMPORTANT : c'est une couche COSMÉTIQUE pure. La DB et les appels API
 * gardent les noms originaux (anglais API-Football). Tous les matching,
 * lookups standings et auto-tracking utilisent les noms bruts.
 *
 * Pour les CLUBS, on ne traduit pas (Bayern München reste Bayern München).
 * Seulement les équipes nationales — convention médias FR (L'Équipe,
 * Eurosport, Winamax).
 */

/** Map : nom anglais (API-Football) → nom français affiché. */
const NATION_FR: Record<string, string> = {
  // === Europe ===
  Albania: 'Albanie',
  Andorra: 'Andorre',
  Armenia: 'Arménie',
  Austria: 'Autriche',
  Azerbaijan: 'Azerbaïdjan',
  Belarus: 'Biélorussie',
  Belgium: 'Belgique',
  'Bosnia and Herzegovina': 'Bosnie-Herzégovine',
  Bulgaria: 'Bulgarie',
  Croatia: 'Croatie',
  Cyprus: 'Chypre',
  'Czech Republic': 'République Tchèque',
  Czechia: 'République Tchèque',
  Denmark: 'Danemark',
  England: 'Angleterre',
  Estonia: 'Estonie',
  'Faroe Islands': 'Îles Féroé',
  Finland: 'Finlande',
  France: 'France',
  Georgia: 'Géorgie',
  Germany: 'Allemagne',
  Gibraltar: 'Gibraltar',
  Greece: 'Grèce',
  Hungary: 'Hongrie',
  Iceland: 'Islande',
  Ireland: 'Irlande',
  Israel: 'Israël',
  Italy: 'Italie',
  Kazakhstan: 'Kazakhstan',
  Kosovo: 'Kosovo',
  Latvia: 'Lettonie',
  Liechtenstein: 'Liechtenstein',
  Lithuania: 'Lituanie',
  Luxembourg: 'Luxembourg',
  Malta: 'Malte',
  Moldova: 'Moldavie',
  Montenegro: 'Monténégro',
  Netherlands: 'Pays-Bas',
  'North Macedonia': 'Macédoine du Nord',
  'Northern Ireland': 'Irlande du Nord',
  Norway: 'Norvège',
  Poland: 'Pologne',
  Portugal: 'Portugal',
  Romania: 'Roumanie',
  Russia: 'Russie',
  'San Marino': 'Saint-Marin',
  Scotland: 'Écosse',
  Serbia: 'Serbie',
  Slovakia: 'Slovaquie',
  Slovenia: 'Slovénie',
  Spain: 'Espagne',
  Sweden: 'Suède',
  Switzerland: 'Suisse',
  Turkey: 'Turquie',
  Türkiye: 'Turquie',
  Ukraine: 'Ukraine',
  Wales: 'Pays de Galles',

  // === Amériques ===
  Argentina: 'Argentine',
  Bolivia: 'Bolivie',
  Brazil: 'Brésil',
  Canada: 'Canada',
  Chile: 'Chili',
  Colombia: 'Colombie',
  'Costa Rica': 'Costa Rica',
  Cuba: 'Cuba',
  'Dominican Republic': 'République Dominicaine',
  Ecuador: 'Équateur',
  'El Salvador': 'Salvador',
  Guatemala: 'Guatemala',
  Haiti: 'Haïti',
  Honduras: 'Honduras',
  Jamaica: 'Jamaïque',
  Mexico: 'Mexique',
  Nicaragua: 'Nicaragua',
  Panama: 'Panama',
  Paraguay: 'Paraguay',
  Peru: 'Pérou',
  'Trinidad and Tobago': 'Trinité-et-Tobago',
  'United States': 'États-Unis',
  USA: 'États-Unis',
  Uruguay: 'Uruguay',
  Venezuela: 'Venezuela',

  // === Asie ===
  Afghanistan: 'Afghanistan',
  Australia: 'Australie',
  Bahrain: 'Bahreïn',
  Bangladesh: 'Bangladesh',
  Bhutan: 'Bhoutan',
  Cambodia: 'Cambodge',
  China: 'Chine',
  'China PR': 'Chine',
  'Hong Kong': 'Hong Kong',
  India: 'Inde',
  Indonesia: 'Indonésie',
  Iran: 'Iran',
  Iraq: 'Irak',
  Japan: 'Japon',
  Jordan: 'Jordanie',
  Kuwait: 'Koweït',
  Kyrgyzstan: 'Kirghizstan',
  Laos: 'Laos',
  Lebanon: 'Liban',
  Malaysia: 'Malaisie',
  Maldives: 'Maldives',
  Mongolia: 'Mongolie',
  Myanmar: 'Birmanie',
  Nepal: 'Népal',
  'North Korea': 'Corée du Nord',
  Oman: 'Oman',
  Pakistan: 'Pakistan',
  Palestine: 'Palestine',
  Philippines: 'Philippines',
  Qatar: 'Qatar',
  'Saudi Arabia': 'Arabie Saoudite',
  Singapore: 'Singapour',
  'South Korea': 'Corée du Sud',
  'Sri Lanka': 'Sri Lanka',
  Syria: 'Syrie',
  Tajikistan: 'Tadjikistan',
  Thailand: 'Thaïlande',
  Turkmenistan: 'Turkménistan',
  'United Arab Emirates': 'Émirats Arabes Unis',
  Uzbekistan: 'Ouzbékistan',
  Vietnam: 'Vietnam',
  Yemen: 'Yémen',

  // === Afrique ===
  Algeria: 'Algérie',
  Angola: 'Angola',
  Benin: 'Bénin',
  Botswana: 'Botswana',
  'Burkina Faso': 'Burkina Faso',
  Burundi: 'Burundi',
  Cameroon: 'Cameroun',
  'Cape Verde': 'Cap-Vert',
  'Cape Verde Islands': 'Cap-Vert',
  'Central African Republic': 'République Centrafricaine',
  Chad: 'Tchad',
  Comoros: 'Comores',
  Congo: 'Congo',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  'Ivory Coast': 'Côte d\'Ivoire',
  Djibouti: 'Djibouti',
  Egypt: 'Égypte',
  'Equatorial Guinea': 'Guinée Équatoriale',
  Eritrea: 'Érythrée',
  Eswatini: 'Eswatini',
  Ethiopia: 'Éthiopie',
  Gabon: 'Gabon',
  Gambia: 'Gambie',
  Ghana: 'Ghana',
  Guinea: 'Guinée',
  'Guinea-Bissau': 'Guinée-Bissau',
  Kenya: 'Kenya',
  Lesotho: 'Lesotho',
  Liberia: 'Libéria',
  Libya: 'Libye',
  Madagascar: 'Madagascar',
  Malawi: 'Malawi',
  Mali: 'Mali',
  Mauritania: 'Mauritanie',
  Mauritius: 'Maurice',
  Morocco: 'Maroc',
  Mozambique: 'Mozambique',
  Namibia: 'Namibie',
  Niger: 'Niger',
  Nigeria: 'Nigéria',
  Rwanda: 'Rwanda',
  'Sao Tome and Principe': 'Sao Tomé-et-Principe',
  Senegal: 'Sénégal',
  Seychelles: 'Seychelles',
  'Sierra Leone': 'Sierra Leone',
  Somalia: 'Somalie',
  'South Africa': 'Afrique du Sud',
  'South Sudan': 'Soudan du Sud',
  Sudan: 'Soudan',
  Tanzania: 'Tanzanie',
  Togo: 'Togo',
  Tunisia: 'Tunisie',
  Uganda: 'Ouganda',
  Zambia: 'Zambie',
  Zimbabwe: 'Zimbabwe',

  // === Océanie ===
  'New Zealand': 'Nouvelle-Zélande',
  Fiji: 'Fidji',
  'Papua New Guinea': 'Papouasie-Nouvelle-Guinée',
  'Solomon Islands': 'Îles Salomon',
  Tahiti: 'Tahiti',
  Vanuatu: 'Vanuatu',
};

/**
 * Map inverse pour le matcher d'équipes : "Allemagne" doit matcher "Germany"
 * en DB. Utilisé par team-name-matching pour comprendre les saisies admin
 * en français.
 */
const NATION_EN_BY_FR: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [en, fr] of Object.entries(NATION_FR)) {
    out[fr.toLowerCase()] = en;
  }
  return out;
})();

/**
 * Renvoie le nom affiché d'une équipe.
 * - Équipes nationales connues → traduit en français
 * - Tout le reste (clubs, équipes inconnues) → renvoyé tel quel
 *
 * Quand utiliser :
 *  - Cards de pronos (single + combo selections)
 *  - Fiche détail prono
 *  - MatchPicker / TeamPicker côté admin
 *  - Notifications push (titre + body)
 */
export function displayTeamName(rawName: string): string {
  if (!rawName) return rawName;
  // Match direct
  if (NATION_FR[rawName]) return NATION_FR[rawName];
  // Match insensible à la casse (au cas où API renvoie en majuscules)
  const found = Object.entries(NATION_FR).find(
    ([en]) => en.toLowerCase() === rawName.toLowerCase(),
  );
  return found ? found[1] : rawName;
}

/**
 * Retourne le nom anglais d'une équipe nationale FR. Si pas trouvé, renvoie
 * le nom tel quel. Utile pour le matching admin : "Allemagne" → "Germany".
 */
export function toEnglishNation(rawName: string): string {
  if (!rawName) return rawName;
  const fr = rawName.toLowerCase();
  return NATION_EN_BY_FR[fr] ?? rawName;
}

/** Helper pour tests : indique si un nom est une équipe nationale connue. */
export function isKnownNation(name: string): boolean {
  if (!name) return false;
  if (NATION_FR[name]) return true;
  return Object.keys(NATION_FR).some(
    (en) => en.toLowerCase() === name.toLowerCase(),
  );
}
