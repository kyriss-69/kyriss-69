import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "assets", "generated");
const configPath = path.join(root, "profile.config.json");
const statsPath = path.join(root, "data", "public-stats.json");

const config = JSON.parse(await readFile(configPath, "utf8"));
let stats = JSON.parse(await readFile(statsPath, "utf8"));

if (process.argv.includes("--refresh-stats")) {
  try {
    stats = await fetchPublicStats(config.username);
    await writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  } catch (err) {
    console.warn("Could not refresh stats from GitHub API, using cached:", err.message);
  }
}

const themes = {
  dark: {
    background: "#090510",
    backgroundEnd: "#170b28",
    panel: "#130924",
    panelBorder: "#3b1569",
    text: "#f5f3ff",
    muted: "#a78bfa",
    accent: "#a855f7",
    accentTwo: "#c084fc",
    accentThree: "#ec4899",
    grid: "#240f42"
  },
  light: {
    background: "#faf5ff",
    backgroundEnd: "#f3e8ff",
    panel: "#ffffff",
    panelBorder: "#e9d5ff",
    text: "#2e1065",
    muted: "#6b21a8",
    accent: "#7e22ce",
    accentTwo: "#9333ea",
    accentThree: "#c026d3",
    grid: "#e9d5ff"
  }
};

await mkdir(outputDirectory, { recursive: true });

for (const [name, theme] of Object.entries(themes)) {
  await writeSvg(`banner-${name}.svg`, renderBanner(theme));
  await writeSvg(`stack-${name}.svg`, renderStack(theme));
  await writeSvg(`metrics-${name}.svg`, renderMetrics(theme));
  await writeSvg(`footer-${name}.svg`, renderFooter(theme));
}

console.log(`Generated 8 SVG assets in ${path.relative(root, outputDirectory)}`);

async function fetchPublicStats(username) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${username}-profile-generator`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const encodedUsername = encodeURIComponent(username);
  const [user, repositories, pullRequests, issues] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodedUsername}`, headers),
    fetchJson(`https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=public`, headers),
    fetchJson(`https://api.github.com/search/issues?q=${encodeURIComponent(`author:${username} type:pr`)}`, headers),
    fetchJson(`https://api.github.com/search/issues?q=${encodeURIComponent(`author:${username} type:issue`)}`, headers)
  ]);
  const originalRepositories = (repositories || []).filter((repository) => !repository.fork);

  return {
    publicRepos: user.public_repos || 0,
    originalPublicRepos: originalRepositories.length,
    starsEarned: originalRepositories.reduce((total, repository) => total + repository.stargazers_count, 0),
    publicPullRequests: pullRequests.total_count || 0,
    publicIssues: issues.total_count || 0,
    followers: user.followers || 0,
    memberSince: new Date(user.created_at || Date.now()).getUTCFullYear(),
    updatedAt: new Date().toISOString()
  };
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}`);
  }
  return response.json();
}

async function writeSvg(fileName, content) {
  const normalized = content
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
  await writeFile(path.join(outputDirectory, fileName), `${normalized}\n`, "utf8");
}

function renderBanner(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(config.name)} — ${escapeXml(config.identity)}</title>
  <desc id="description">Bannière haute fidélité pour le profil de Kyrris.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.background}"/>
      <stop offset="1" stop-color="${theme.backgroundEnd}"/>
    </linearGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${theme.accent}"/>
      <stop offset="0.55" stop-color="${theme.accentTwo}"/>
      <stop offset="1" stop-color="${theme.accentThree}"/>
    </linearGradient>
    <radialGradient id="card-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${theme.grid}" stroke-width="1"/>
    </pattern>
    <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, "Fira Code", monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .cursor { animation: blink 1.1s steps(2, start) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .cursor { animation: none; } }
  </style>
  <rect width="1200" height="360" rx="24" fill="url(#background)"/>
  <rect width="1200" height="360" rx="24" fill="url(#grid)" opacity=".75"/>

  <!-- Halo lumineux d'ambiance néon -->
  <circle cx="940" cy="180" r="230" fill="url(#card-glow)"/>

  <!-- GAUCHE: IDENTITÉ & BADGES PROPRES -->
  <path d="M42 40H246" stroke="url(#signal)" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="42" cy="40" r="5" fill="${theme.accent}" filter="url(#soft-glow)"/>
  
  <text x="72" y="93" class="mono" fill="${theme.accent}" font-size="16" font-weight="700" letter-spacing="3">${escapeXml(config.username.toUpperCase())} // ${escapeXml(config.identity)}</text>
  <text x="68" y="169" class="sans" fill="${theme.text}" font-size="58" font-weight="800" letter-spacing="-1.2">${escapeXml(config.name.toUpperCase())}</text>
  <text x="72" y="214" class="mono" fill="${theme.muted}" font-size="16.5" font-weight="600" letter-spacing="1.6">${escapeXml(config.headline)}</text>
  
  <!-- Badges de statut aérés et impeccables -->
  <g transform="translate(70 252)">
    <rect width="185" height="38" rx="19" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.4"/>
    <circle cx="20" cy="19" r="4.5" fill="#10b981" filter="url(#soft-glow)"/>
    <text x="35" y="24" class="mono" fill="${theme.text}" font-size="11.5" font-weight="650" letter-spacing="0.6">DISPONIBLE // ACTIF</text>
  </g>
  <g transform="translate(268 252)">
    <rect width="215" height="38" rx="19" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.4"/>
    <text x="20" y="24" class="mono" fill="${theme.accentTwo}" font-size="11.5" font-weight="650" letter-spacing="0.6">WEB FULLSTACK &amp; IA</text>
  </g>

  <!-- DROITE: FENÊTRE TERMINAL IDE CODE -->
  <g transform="translate(710 42)">
    <rect width="445" height="276" rx="16" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.6"/>
    
    <!-- En-tête de la fenêtre -->
    <path d="M0 16 C0 7.16 7.16 0 16 0 H429 C437.84 0 445 7.16 445 16 V40 H0 Z" fill="${theme.background === '#090510' ? '#180b30' : '#f3e8ff'}"/>
    <line x1="0" y1="40" x2="445" y2="40" stroke="${theme.panelBorder}" stroke-width="1"/>
    
    <!-- Boutons style macOS néon -->
    <circle cx="22" cy="20" r="5.5" fill="#ec4899"/>
    <circle cx="38" cy="20" r="5.5" fill="#c084fc"/>
    <circle cx="54" cy="20" r="5.5" fill="#a855f7"/>

    <!-- Onglet actif -->
    <rect x="74" y="8" width="138" height="26" rx="6" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1"/>
    <text x="88" y="25" class="mono" fill="${theme.accentTwo}" font-size="11.5" font-weight="600">kyrris.config.ts</text>

    <!-- Pastille statut en ligne -->
    <circle cx="418" cy="20" r="4" fill="#10b981" filter="url(#soft-glow)"/>
    <text x="364" y="24" class="mono" fill="${theme.muted}" font-size="10.5" font-weight="600">ONLINE</text>

    <!-- Code TypeScript moderne -->
    <g class="mono" font-size="12" letter-spacing="0.2">
      <text x="18" y="70" fill="#6d28d9" font-weight="600">1</text>
      <text x="42" y="70"><tspan fill="#ec4899" font-weight="700">const</tspan> <tspan fill="${theme.accentTwo}">developer</tspan> = {</text>

      <text x="18" y="96" fill="#6d28d9" font-weight="600">2</text>
      <text x="56" y="96"><tspan fill="${theme.muted}">name</tspan>: <tspan fill="#a7f3d0">"Kyrris"</tspan>,</text>

      <text x="18" y="122" fill="#6d28d9" font-weight="600">3</text>
      <text x="56" y="122"><tspan fill="${theme.muted}">role</tspan>: <tspan fill="#a7f3d0">"Fullstack &amp; AI Explorer"</tspan>,</text>

      <text x="18" y="148" fill="#6d28d9" font-weight="600">4</text>
      <text x="56" y="148"><tspan fill="${theme.muted}">stack</tspan>: [<tspan fill="#a7f3d0">"Next.js"</tspan>, <tspan fill="#a7f3d0">"React"</tspan>, <tspan fill="#a7f3d0">"Node.js"</tspan>],</text>

      <text x="18" y="174" fill="#6d28d9" font-weight="600">5</text>
      <text x="56" y="174"><tspan fill="${theme.muted}">passion</tspan>: <tspan fill="#a7f3d0">"AI Agents &amp; Modern Web"</tspan>,</text>

      <text x="18" y="200" fill="#6d28d9" font-weight="600">6</text>
      <text x="56" y="200"><tspan fill="${theme.accentTwo}">build</tspan>: () =&gt; <tspan fill="#fbcfe8">"🚀 Ship clean code"</tspan></text>

      <text x="18" y="226" fill="#6d28d9" font-weight="600">7</text>
      <text x="42" y="226">};</text>

      <text x="18" y="252" fill="#6d28d9" font-weight="600">8</text>
      <text x="42" y="252"><tspan fill="#ec4899" font-weight="700">export default</tspan> <tspan fill="${theme.accentTwo}">developer</tspan>;<rect class="cursor" x="238" y="240" width="7" height="14" rx="1" fill="${theme.accent}"/></text>
    </g>
  </g>

  <rect x="1" y="1" width="1198" height="358" rx="23" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderStack(theme) {
  const badgeWidth = 200;
  const badgeHeight = 48;
  const gap = 20;
  const startX = 60;
  const rows = config.stack.map((item, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const x = startX + column * (badgeWidth + gap);
    const y = 86 + row * 66;
    const dotStroke = item.label === "Next.js" && theme.background === "#faf5ff" ? "#000000" : item.color;
    return `
      <g transform="translate(${x} ${y})">
        <rect width="${badgeWidth}" height="${badgeHeight}" rx="14" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
        <circle cx="25" cy="24" r="8" fill="${escapeXml(item.color)}" stroke="${dotStroke}"/>
        <text x="44" y="30" class="mono" fill="${theme.text}" font-size="15" font-weight="650">${escapeXml(item.label)}</text>
      </g>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 230" role="img" aria-labelledby="title description">
  <title id="title">Boîte à outils technique de Kyrris</title>
  <desc id="description">Badges générés pour les langages, frameworks et outils maîtrisés par Kyrris.</desc>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>.mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }</style>
  <rect width="1200" height="230" rx="22" fill="${theme.background}"/>
  <text x="60" y="48" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">BOÎTE À OUTILS // STACK TECHNIQUE</text>
  <path d="M850 43H1140" stroke="url(#accent)" stroke-width="2" stroke-linecap="round"/>
  ${rows}
  <rect x="1" y="1" width="1198" height="228" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderMetrics(theme) {
  const values = [
    { value: stats.publicRepos, label: "DÉPÔTS PUBLICS", color: theme.accent, icon: "repo" },
    { value: stats.originalPublicRepos, label: "PROJETS ORIGINAUX PUBLICS", color: theme.accentTwo, icon: "project" },
    { value: stats.starsEarned, label: "ÉTOILES REÇUES", color: theme.accentThree, icon: "star" },
    { value: stats.publicPullRequests, label: "PULL REQUESTS PUBLIQUES", color: theme.accent, icon: "pull" },
    { value: stats.followers, label: "ABONNÉS GITHUB", color: theme.accentTwo, icon: "users" }
  ];
  const rows = values.map((item, index) => {
    const y = 112 + index * 42;
    return `
      <g transform="translate(82 ${y})">
        <use href="#icon-${item.icon}" x="0" y="-13" width="20" height="20" fill="none" stroke="${item.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="36" y="2" class="mono" fill="${theme.muted}" font-size="13" font-weight="650" letter-spacing="1">${item.label}</text>
        <text x="620" y="2" text-anchor="end" class="sans" fill="${theme.text}" font-size="18" font-weight="750">${escapeXml(String(item.value))}</text>
        ${index < values.length - 1 ? `<path d="M36 17H620" stroke="${theme.panelBorder}" opacity=".55"/>` : ""}
      </g>`;
  }).join("");

  const updated = new Date(stats.updatedAt).toISOString().slice(0, 10);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 350" role="img" aria-labelledby="title description">
  <title id="title">Pouls GitHub public de ${escapeXml(config.username)}</title>
  <desc id="description">Statistiques GitHub publiques de Kyrris.</desc>
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
    <radialGradient id="metric-glow"><stop stop-color="${theme.accent}" stop-opacity=".2"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    <symbol id="icon-repo" viewBox="0 0 24 24"><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18M9 8h5"/></symbol>
    <symbol id="icon-project" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 4v5"/></symbol>
    <symbol id="icon-star" viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></symbol>
    <symbol id="icon-pull" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M6 7.5V16a3 3 0 0 0 3 3h6.5M18 16.5V9a4 4 0 0 0-4-4h-2M14 2l-3 3 3 3"/></symbol>
    <symbol id="icon-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14.5a5 5 0 0 1 3.5 4.8"/></symbol>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .ring { stroke-dasharray: 490; stroke-dashoffset: 490; animation: draw-ring 2.4s cubic-bezier(.2,.8,.2,1) forwards, breathe 4.5s ease-in-out 2.4s infinite; }
    .orbit { transform-origin: 955px 188px; animation: orbit 12s linear infinite; }
    .signal-node { animation: node-pulse 3s ease-in-out infinite; }
    @keyframes draw-ring { to { stroke-dashoffset: 62; } }
    @keyframes breathe { 0%, 100% { opacity: .72; } 50% { opacity: 1; } }
    @keyframes orbit { to { transform: rotate(360deg); } }
    @keyframes node-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .ring { animation: none; stroke-dashoffset: 62; } .orbit, .signal-node { animation: none; } }
  </style>
  <rect width="1200" height="350" rx="22" fill="${theme.background}"/>
  <text x="60" y="50" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">POULS GITHUB // ${escapeXml(config.username.toUpperCase())}</text>
  <text x="1140" y="50" text-anchor="end" class="mono" fill="${theme.muted}" font-size="11">MIS À JOUR ${updated}</text>
  <rect x="60" y="76" width="680" height="234" rx="18" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
  ${rows}
  <g>
    <circle cx="955" cy="188" r="128" fill="url(#metric-glow)"/>
    <circle cx="955" cy="188" r="78" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="10"/>
    <circle class="ring" cx="955" cy="188" r="78" fill="none" stroke="url(#ring)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 955 188)"/>
    <g class="orbit"><circle cx="955" cy="100" r="5" fill="${theme.accentTwo}"/></g>
    <g class="signal-node" fill="${theme.accent}"><circle cx="934" cy="160" r="5"/><circle cx="976" cy="160" r="5"/><circle cx="955" cy="139" r="5"/></g>
    <path d="M934 160 955 139l21 21-21 25z" fill="none" stroke="${theme.accent}" stroke-width="2" opacity=".8"/>
    <text x="955" y="212" text-anchor="middle" class="sans" fill="${theme.text}" font-size="28" font-weight="800">${stats.memberSince}</text>
    <text x="955" y="235" text-anchor="middle" class="mono" fill="${theme.muted}" font-size="10" font-weight="700" letter-spacing="2">PRÉSENT DEPUIS</text>
    <text x="955" y="304" text-anchor="middle" class="mono" fill="${theme.accentTwo}" font-size="11" font-weight="700" letter-spacing="2">DÉVELOPPEUR ACTIF</text>
  </g>
  <rect x="1" y="1" width="1198" height="348" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderFooter(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" role="img" aria-labelledby="title description">
  <title id="title">Pied de page de Kyrris</title>
  <desc id="description">Pied de page esthétique refermant le profil de Kyrris.</desc>
  <defs>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>.mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }</style>
  <rect width="1200" height="120" rx="20" fill="${theme.background}"/>
  <g fill="none" stroke="url(#line)" stroke-linecap="round">
    <path d="M0 76C170 18 320 104 495 60S830 16 1200 70" opacity=".55"/>
    <path d="M0 94C220 50 330 126 560 72S916 46 1200 88" opacity=".28"/>
  </g>
  <circle cx="495" cy="60" r="4" fill="${theme.accent}"/>
  <circle cx="804" cy="38" r="4" fill="${theme.accentTwo}"/>
  <rect x="420" y="28" width="360" height="38" rx="19" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
  <text x="600" y="52" text-anchor="middle" class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="2">CONSTRUIRE AVEC PASSION // EXPLORER L'AVENIR</text>
  <rect x="1" y="1" width="1198" height="118" rx="19" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
