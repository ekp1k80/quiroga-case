export type SocialSeedPost = {
  author: string;
  handle: string;
  verified?: boolean;
  text: string;
};

export const SECTION_NEWS: SocialSeedPost[] = [
  { author: "Diario Nacional", handle: "@diarionacional", verified: true, text: "Hallan sin vida a empresario vinculado a una fundación juvenil. 2 disparos de 9mm. Investigan las circunstancias." },
  { author: "Noticias24", handle: "@noticias24", verified: true, text: "Segundo fallecimiento de un ex directivo ligado a programas de voluntariado baleado. No descartan relación." },
  { author: "El Observador", handle: "@elobservador", verified: true, text: "Confirman muerte de asesor financiero con vínculos a fundaciones privadas multiples disparos." },
  { author: "Canal 7", handle: "@canal7", verified: true, text: "Tres muertes en una semana. Todas con perfiles similares." },
  { author: "Redacción Judicial", handle: "@redaccionjud", verified: true, text: "Fuentes judiciales hablan de 'patrón emergente' en los últimos fallecimientos." },
];

export const SECTION_SIGNAL: SocialSeedPost[] = [
  { author: "Santi", handle: "@santi_89", text: "siempre los mismos tatuajes" },
  { author: "Anon", handle: "@_anon_", text: "después del after siempre pasa algo" },
  { author: "Pablo", handle: "@pablito", text: "en ese café no hay cámaras" },
  { author: "Meli", handle: "@meli", text: "¿nadie habla del puerto?" },
  { author: "Fer", handle: "@ferc", text: "todo termina en la misma fiscalía" },
];

export const SECTION_REACTION: SocialSeedPost[] = [
  { author: "María L.", handle: "@marialu", text: "mi hermano estuvo en esa fundación" },
  { author: "Nico", handle: "@nicof", text: "no puede ser casualidad" },
  { author: "Vale", handle: "@valen", text: "yo lo conocía" },
  { author: "Tomás R.", handle: "@tomasr", text: "esto se sabía hace años" },
  { author: "Carla", handle: "@carlitaok", text: "nadie quiso tomar la denuncia" },
  { author: "Lucas", handle: "@luchox", text: "💀" },
];

export const SECTION_NOISE_POOL: SocialSeedPost[] = [
  { author: "User138", handle: "@user138", text: "esto se fue al carajo" },
  { author: "User902", handle: "@user902", text: "no entiendo nada" },
  { author: "User56", handle: "@user56", text: "¿vieron eso?" },
  { author: "User7", handle: "@user7", text: "bro…" },
  { author: "User199", handle: "@user199", text: "hilo????" },
  { author: "User411", handle: "@user411", text: "ESTO ES REAL?" },
  { author: "User88", handle: "@user88", text: "qué miedo posta" },
  { author: "User501", handle: "@user501", text: "NOOOOO" },
  { author: "User31", handle: "@user31", text: "silencio total" },
  { author: "User72", handle: "@user72", text: "todo el mundo hablando de esto" },
  { author: "User666", handle: "@user666", text: "💀💀💀" },
  { author: "User240", handle: "@user240", text: "se viene algo grande" },
  { author: "User19", handle: "@user19", text: "no puedo creerlo" },
  { author: "User808", handle: "@user808", text: "se pudrió" },
  { author: "User14", handle: "@user14", text: "borraron comentarios" },
  { author: "User59", handle: "@user59", text: "alguien archive esto" },
  { author: "User420", handle: "@user420", text: "están apagando todo" },
  { author: "User305", handle: "@user305", text: "esto va a explotar más" },
  { author: "User101", handle: "@user101", text: "nadie duerme hoy" },
  { author: "User2", handle: "@user2", text: "ya está trend mundial" },
];

export const SECTION_INFINITE_SPAM: SocialSeedPost[] = SECTION_NOISE_POOL;
