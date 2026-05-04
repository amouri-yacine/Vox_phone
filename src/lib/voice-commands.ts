// Maps a spoken phrase to an IR command for the TV or AC.
// All matching is done lowercased & accent-stripped.

export type VoiceTarget = "tv" | "ac";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 +\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TV_RULES: Array<{ phrases: string[]; cmd: string }> = [
  { phrases: ["volume plus", "volume up", "monte le son", "plus fort", "augmente le volume", "vol +", "vol plus"], cmd: "v+" },
  { phrases: ["volume moins", "volume down", "baisse le son", "moins fort", "diminue le volume", "vol -", "vol moins"], cmd: "v-" },
  { phrases: ["chaine plus", "chaine suivante", "channel up", "next channel"], cmd: "c+" },
  { phrases: ["chaine moins", "chaine precedente", "channel down", "previous channel"], cmd: "c-" },
  { phrases: ["mute", "muet", "coupe le son", "silence"], cmd: "mute" },
  { phrases: ["allume", "allumer", "on", "demarre", "power on", "turn on"], cmd: "p" },
  { phrases: ["eteins", "eteindre", "off", "arrete", "power off", "turn off", "ferme la tv", "ferme"], cmd: "p" },
  { phrases: ["power", "marche", "arret"], cmd: "p" },
  { phrases: ["home", "accueil", "menu principal"], cmd: "home" },
  { phrases: ["menu", "settings", "parametres", "reglages"], cmd: "settings" },
  { phrases: ["info", "infos", "information"], cmd: "info" },
  { phrases: ["retour", "back", "precedent"], cmd: "back" },
  { phrases: ["exit", "quitter", "sortir"], cmd: "exit" },
  { phrases: ["ok", "valider", "entrer", "select"], cmd: "ok" },
  { phrases: ["haut", "up"], cmd: "up" },
  { phrases: ["bas", "down"], cmd: "down" },
  { phrases: ["gauche", "left"], cmd: "left" },
  { phrases: ["droite", "right"], cmd: "right" },
  { phrases: ["play", "lecture", "joue"], cmd: "play" },
  { phrases: ["pause"], cmd: "pause" },
  { phrases: ["stop", "arret lecture"], cmd: "stop" },
  { phrases: ["avance rapide", "fast forward", "avance"], cmd: "ff" },
  { phrases: ["retour rapide", "rewind", "recule"], cmd: "rew" },
  { phrases: ["netflix"], cmd: "netflix" },
  { phrases: ["prime", "amazon", "prime video"], cmd: "amazon" },
  { phrases: ["hdmi 1", "hdmi un", "hdmi1"], cmd: "hdmi1" },
  { phrases: ["hdmi 2", "hdmi deux", "hdmi2"], cmd: "hdmi2" },
  { phrases: ["hdmi 3", "hdmi trois", "hdmi3"], cmd: "hdmi3" },
  { phrases: ["hdmi 4", "hdmi quatre", "hdmi4"], cmd: "hdmi4" },
  { phrases: ["input", "source", "entree"], cmd: "input" },
  { phrases: ["liste", "list"], cmd: "list" },
];

const DIGIT_WORDS: Record<string, string> = {
  zero: "0", "0": "0",
  un: "1", one: "1", "1": "1",
  deux: "2", two: "2", "2": "2",
  trois: "3", three: "3", "3": "3",
  quatre: "4", four: "4", "4": "4",
  cinq: "5", five: "5", "5": "5",
  six: "6", "6": "6",
  sept: "7", seven: "7", "7": "7",
  huit: "8", eight: "8", "8": "8",
  neuf: "9", nine: "9", "9": "9",
};

function wordRe(phrase: string) {
  return new RegExp(`(^|\\s)${phrase.replace(/[+\-]/g, "\\$&")}(\\s|$)`);
}

export function matchTvCommand(transcript: string): string | null {
  const t = norm(transcript);
  if (!t) return null;

  const chMatch = t.match(/(?:chaine|channel)\s+(\w+)/);
  if (chMatch) {
    const d = DIGIT_WORDS[chMatch[1]];
    if (d) return d;
  }

  for (const rule of TV_RULES) {
    for (const phrase of rule.phrases) {
      if (wordRe(phrase).test(t)) return rule.cmd;
    }
  }

  if (DIGIT_WORDS[t]) return DIGIT_WORDS[t];
  return null;
}

// ---- AC ----
const AC_RULES: Array<{ phrases: string[]; cmd: string }> = [
  { phrases: ["allume la clim", "demarre la clim", "ac on", "clim on", "turn on ac", "allume clim"], cmd: "on" },
  { phrases: ["eteins la clim", "ferme la clim", "ac off", "clim off", "turn off ac", "stop clim"], cmd: "off" },
  { phrases: ["mode froid", "mode cool", "froid", "cool", "refroidis", "refroidir"], cmd: "cool" },
  { phrases: ["mode chaud", "mode hot", "chaud", "hot", "chauffe", "heat", "chauffage"], cmd: "hot" },
  { phrases: ["mode ventilation", "ventilation", "ventilateur", "fan mode"], cmd: "fan" },
  { phrases: ["mode sec", "deshumidificateur", "dry"], cmd: "dry" },
  { phrases: ["swing", "oscillation", "balayage"], cmd: "swing" },
  { phrases: ["ventilation auto", "fan auto", "vitesse auto"], cmd: "fan_auto" },
  { phrases: ["ventilation faible", "fan low", "vitesse faible", "low fan"], cmd: "fan_low" },
  { phrases: ["ventilation moyenne", "fan med", "vitesse moyenne", "medium fan"], cmd: "fan_med" },
  { phrases: ["ventilation forte", "fan high", "vitesse forte", "high fan", "vitesse maximale"], cmd: "fan_high" },
];

export function matchAcCommand(transcript: string): string | null {
  const t = norm(transcript);
  if (!t) return null;

  // Temperature: "22 degres", "mets a 24", "temperature 26"
  const tempMatch = t.match(/(?:^|\s)(1[6-9]|2\d|30)(?:\s|$)/);
  if (tempMatch) {
    const n = Number(tempMatch[1]);
    if (n >= 16 && n <= 30) return String(n);
  }

  for (const rule of AC_RULES) {
    for (const phrase of rule.phrases) {
      if (wordRe(phrase).test(t)) return rule.cmd;
    }
  }
  return null;
}

export interface VoiceMatch {
  target: VoiceTarget;
  cmd: string;
}

// Decide which device the user is talking to.
// Prefer explicit keywords ("tv", "clim"), otherwise try AC first if a temp/AC keyword is present, else TV.
export function matchVoice(transcript: string): VoiceMatch | null {
  const t = norm(transcript);
  if (!t) return null;

  const mentionsTv = /(^|\s)(tv|television|tele)(\s|$)/.test(t);
  const mentionsAc = /(^|\s)(clim|climatiseur|climatisation|ac|air condition(?:er|ne)?)(\s|$)/.test(t);

  if (mentionsAc && !mentionsTv) {
    const c = matchAcCommand(t);
    if (c) return { target: "ac", cmd: c };
  }
  if (mentionsTv && !mentionsAc) {
    const c = matchTvCommand(t);
    if (c) return { target: "tv", cmd: c };
  }

  // No explicit target: try AC first (temperatures, modes), fallback TV.
  const ac = matchAcCommand(t);
  if (ac) return { target: "ac", cmd: ac };
  const tv = matchTvCommand(t);
  if (tv) return { target: "tv", cmd: tv };
  return null;
}

