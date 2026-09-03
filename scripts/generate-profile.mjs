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
    googleBlue: "#60a5fa",
    googleGreen: "#34d399",
    googleYellow: "#fbbf24",
    googleRed: "#f87171",
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
    googleBlue: "#2563eb",
    googleGreen: "#059669",
    googleYellow: "#d97706",
    googleRed: "#dc2626",
    grid: "#e9d5ff"
  }
};

await mkdir(outputDirectory, { recursive: true });

for (const [name, theme] of Object.entries(themes)) {
  await writeSvg(`banner-${name}.svg`, renderBanner(theme));
  await writeSvg(`bio-${name}.svg`, renderBio(theme));
  await writeSvg(`signal-${name}.svg`, renderSignal(theme));
  await writeSvg(`signal-v2-${name}.svg`, renderSignal(theme));
  await writeSvg(`saas-focus-${name}.svg`, renderSignal(theme));
  await writeSvg(`google-clean-${name}.svg`, renderGoogleClean(theme));
  await writeSvg(`google-suite-${name}.svg`, renderGoogleClean(theme));
  await writeSvg(`google-final-${name}.svg`, renderGoogleClean(theme));
  await writeSvg(`stack-${name}.svg`, renderStack(theme));
  await writeSvg(`tools-${name}.svg`, renderStack(theme));
  await writeSvg(`metrics-${name}.svg`, renderMetrics(theme));
  await writeSvg(`footer-${name}.svg`, renderFooter(theme));
}

console.log(`Generated SVG assets in ${path.relative(root, outputDirectory)}`);

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
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 360" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(config.name)} — ${escapeXml(config.identity)}</title>
  <desc id="description">Bannière haute fidélité pour le profil de Kyrris avec terminal de code et texte dynamique.</desc>
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

    <!-- Chemins animés pour l'effet texte dactylographié en boucle (3 phrases) -->
    <path id="typePath0">
      <animate id="t0" attributeName="d" begin="0s;t2.end" dur="4.2s" fill="remove"
        values="m108,277 h0 ; m108,277 h540 ; m108,277 h540 ; m108,277 h0"
        keyTimes="0; 0.45; 0.82; 1" />
    </path>
    <path id="typePath1">
      <animate id="t1" attributeName="d" begin="t0.end" dur="4.2s" fill="remove"
        values="m108,277 h0 ; m108,277 h540 ; m108,277 h540 ; m108,277 h0"
        keyTimes="0; 0.45; 0.82; 1" />
    </path>
    <path id="typePath2">
      <animate id="t2" attributeName="d" begin="t1.end" dur="4.2s" fill="remove"
        values="m108,277 h0 ; m108,277 h540 ; m108,277 h540 ; m108,277 h0"
        keyTimes="0; 0.45; 0.82; 1" />
    </path>
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

  <!-- GAUCHE: IDENTITÉ & SLOGAN -->
  <path d="M42 40H246" stroke="url(#signal)" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="42" cy="40" r="5" fill="${theme.accent}" filter="url(#soft-glow)"/>
  
  <text x="72" y="93" class="mono" fill="${theme.accent}" font-size="16" font-weight="700" letter-spacing="3">${escapeXml(config.username.toUpperCase())} // ${escapeXml(config.identity)}</text>
  <text x="68" y="169" class="sans" fill="${theme.text}" font-size="58" font-weight="800" letter-spacing="-1.2">${escapeXml(config.name.toUpperCase())}</text>
  <text x="72" y="214" class="mono" fill="${theme.muted}" font-size="16" font-weight="600" letter-spacing="1.4">${escapeXml(config.headline)}</text>
  
  <!-- Pilule avec effet texte dactylographié (s'écrit, s'efface et boucle) -->
  <g transform="translate(68 252)">
    <rect width="615" height="50" rx="25" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.6"/>
    <circle cx="25" cy="25" r="6" fill="${theme.accent}" filter="url(#soft-glow)"/>
  </g>

  <!-- Textes animés le long des chemins dynamiques -->
  <text class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="0.4" dominant-baseline="middle">
    <textPath href="#typePath0" xlink:href="#typePath0">FRONTEND : NUXT 3 · VUE 3 · TAILWIND · PINIA 🌐</textPath>
  </text>
  <text class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="0.4" dominant-baseline="middle">
    <textPath href="#typePath1" xlink:href="#typePath1">BACKEND : NESTJS 11 · PRISMA · POSTGRESQL · REDIS ⚙️</textPath>
  </text>
  <text class="mono" fill="${theme.text}" font-size="12" font-weight="650" letter-spacing="0.4" dominant-baseline="middle">
    <textPath href="#typePath2" xlink:href="#typePath2">SPÉCIALISATION GOOGLE : ANTIGRAVITY 2.0 &amp; GEMINI 🌌</textPath>
  </text>

  <!-- DROITE: FENÊTRE TERMINAL IDE CODE AVEC SYNTAXE ÉCLATANTE -->
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

    <!-- Code TypeScript moderne avec accolades, flèches et ponctuation parfaitement visibles -->
    <g class="mono" font-size="12" letter-spacing="0.2" fill="#f5f3ff">
      <text x="18" y="70" fill="#8b5cf6" font-weight="600">1</text>
      <text x="42" y="70"><tspan fill="#ec4899" font-weight="700">const</tspan> <tspan fill="${theme.accentTwo}">developer</tspan> <tspan fill="#ec4899" font-weight="700">=</tspan> <tspan fill="#f5f3ff" font-weight="700">{</tspan></text>

      <text x="18" y="96" fill="#8b5cf6" font-weight="600">2</text>
      <text x="56" y="96"><tspan fill="${theme.accentTwo}">name</tspan><tspan fill="#a78bfa" font-weight="700">:</tspan> <tspan fill="#a7f3d0">"Kyrris"</tspan><tspan fill="#f5f3ff" font-weight="700">,</tspan></text>

      <text x="18" y="122" fill="#8b5cf6" font-weight="600">3</text>
      <text x="56" y="122"><tspan fill="${theme.accentTwo}">frontend</tspan><tspan fill="#a78bfa" font-weight="700">:</tspan> <tspan fill="#f5f3ff" font-weight="700">[</tspan><tspan fill="#a7f3d0">"Nuxt 3"</tspan><tspan fill="#f5f3ff">, </tspan><tspan fill="#a7f3d0">"Vue 3"</tspan><tspan fill="#f5f3ff">, </tspan><tspan fill="#a7f3d0">"Pinia"</tspan><tspan fill="#f5f3ff" font-weight="700">],</tspan></text>

      <text x="18" y="148" fill="#8b5cf6" font-weight="600">4</text>
      <text x="56" y="148"><tspan fill="${theme.accentTwo}">backend</tspan><tspan fill="#a78bfa" font-weight="700">:</tspan> <tspan fill="#f5f3ff" font-weight="700">[</tspan><tspan fill="#a7f3d0">"NestJS 11"</tspan><tspan fill="#f5f3ff">, </tspan><tspan fill="#a7f3d0">"Prisma"</tspan><tspan fill="#f5f3ff" font-weight="700">],</tspan></text>

      <text x="18" y="174" fill="#8b5cf6" font-weight="600">5</text>
      <text x="56" y="174"><tspan fill="${theme.accentTwo}">ai_suite</tspan><tspan fill="#a78bfa" font-weight="700">:</tspan> <tspan fill="#f5f3ff" font-weight="700">[</tspan><tspan fill="#60a5fa">"Antigravity 2.0"</tspan><tspan fill="#f5f3ff">, </tspan><tspan fill="#c084fc">"Gemini"</tspan><tspan fill="#f5f3ff" font-weight="700">],</tspan></text>

      <text x="18" y="200" fill="#8b5cf6" font-weight="600">6</text>
      <text x="56" y="200"><tspan fill="${theme.accentTwo}">runtime</tspan><tspan fill="#a78bfa" font-weight="700">:</tspan> <tspan fill="#f5f3ff">()</tspan> <tspan fill="#ec4899" font-weight="800">=&gt;</tspan> <tspan fill="#fbcfe8">"⚡ Turborepo + Bun"</tspan></text>

      <text x="18" y="226" fill="#8b5cf6" font-weight="600">7</text>
      <text x="42" y="226"><tspan fill="#f5f3ff" font-weight="700">};</tspan></text>

      <text x="18" y="252" fill="#8b5cf6" font-weight="600">8</text>
      <text x="42" y="252"><tspan fill="#ec4899" font-weight="700">export default</tspan> <tspan fill="${theme.accentTwo}">developer</tspan><tspan fill="#f5f3ff" font-weight="700">;</tspan><rect class="cursor" x="242" y="240" width="7" height="14" rx="1" fill="${theme.accent}"/></text>
    </g>
  </g>

  <rect x="1" y="1" width="1198" height="358" rx="23" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderBio(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 150" role="img" aria-labelledby="title description">
  <title id="title">Vision &amp; Présentation de ${escapeXml(config.username)}</title>
  <desc id="description">Vision et spécialisation technique de Kyrris.</desc>
  <defs>
    <linearGradient id="bio-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="33%" stop-color="#a855f7"/>
      <stop offset="66%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#34a853"/>
    </linearGradient>
    <radialGradient id="bio-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
  </style>

  <!-- Fond global & bordure -->
  <rect width="1200" height="150" rx="22" fill="${theme.background}"/>
  <rect x="1" y="1" width="1198" height="148" rx="21" fill="none" stroke="${theme.panelBorder}"/>

  <!-- Panneau central vitré glassmorphic -->
  <rect x="60" y="14" width="1080" height="122" rx="16" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.3"/>
  <circle cx="600" cy="75" r="280" fill="url(#bio-glow)"/>

  <!-- Ligne lumineuse en haut du panneau -->
  <path d="M60 14 H1140" stroke="url(#bio-gradient)" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>

  <!-- Pastille décorative gauche -->
  <circle cx="102" cy="75" r="18" fill="${theme.background === '#090510' ? '#1c0e35' : '#f3e8ff'}" stroke="${theme.accent}" stroke-width="1.2"/>
  <text x="102" y="81" text-anchor="middle" font-size="15">⚡</text>

  <!-- Textes avec typographie soignée -->
  <g transform="translate(142 0)">
    <text x="0" y="52" class="sans" fill="${theme.text}" font-size="17" font-weight="750" letter-spacing="-0.2">
      Spécialisé dans les stacks techniques SaaS modernes et l&apos;écosystème Google AI // Google Cloud.
    </text>
    <text x="0" y="81" class="sans" fill="${theme.muted}" font-size="13.5" font-weight="500">
      Passionné d&apos;open source, de modèles d&apos;IA et de R&amp;D logicielle, j&apos;aime transformer des idées ambitieuses
    </text>
    <text x="0" y="103" class="sans" fill="${theme.muted}" font-size="13.5" font-weight="500">
      en solutions concrètes grâce aux outils avancés de l&apos;écosystème Google AI.
    </text>
  </g>

  <!-- Pastille décorative droite -->
  <circle cx="1098" cy="75" r="18" fill="${theme.background === '#090510' ? '#1c0e35' : '#f3e8ff'}" stroke="${theme.accentTwo}" stroke-width="1.2"/>
  <text x="1098" y="81" text-anchor="middle" font-size="15">🌌</text>
</svg>`;
}

function renderSignal(theme) {
  const cards = [
    {
      x: 60,
      icon: "🚀",
      title: "EXPERTISE SAAS",
      badge: null,
      lines: [
        "Spécialiste des stacks techniques SaaS :",
        "architectures monorepo, dashboards réactifs,",
        "flux temps réel et backends scalables & robustes."
      ],
      tags: "TURBOREPO · NUXT 3 · NESTJS 11"
    },
    {
      x: 428,
      icon: "🧪",
      title: "VEILLE & IA",
      badge: "EXPÉRIMENTATION",
      badgeColor: theme.accentTwo,
      lines: [
        "Exploration continue des technos émergentes :",
        "intégration de modèles d'IA, benchmarks",
        "et prototypage d'architectures modernes."
      ],
      tags: "LLM · AGENTS · BENCHMARKS"
    },
    {
      x: 796,
      icon: "🎯",
      title: "NOUVEAUX DÉFIS",
      badge: "DISPONIBLE",
      badgeColor: "#10b981",
      lines: [
        "En quête permanente de progression et de",
        "challenges stimulants : ouvert aux missions",
        "freelance, collaborations et projets pro."
      ],
      tags: "COLLABORATIONS · FREELANCE"
    }
  ];

  const renderedCards = cards.map(c => `
    <g transform="translate(${c.x} 80)">
      <rect width="344" height="174" rx="16" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.4"/>
      
      <text x="20" y="34" class="sans" fill="${theme.text}" font-size="16" font-weight="750" letter-spacing="-0.3">${c.icon}  ${escapeXml(c.title)}</text>
      
      ${c.badge ? `
      <g transform="translate(200 18)">
        <rect width="124" height="22" rx="11" fill="${theme.background === '#090510' ? '#1c0e35' : '#f3e8ff'}" stroke="${theme.panelBorder}" stroke-width="1"/>
        <circle cx="10" cy="11" r="3.5" fill="${c.badgeColor}"/>
        <text x="18" y="15" class="mono" fill="${theme.text}" font-size="9" font-weight="700" letter-spacing="0.5">${escapeXml(c.badge)}</text>
      </g>` : ''}

      <line x1="20" y1="48" x2="324" y2="48" stroke="${theme.panelBorder}" stroke-width="0.9" opacity="0.6"/>

      <text class="sans" fill="${theme.muted}" font-size="12.5" font-weight="500">
        <tspan x="20" y="72">${escapeXml(c.lines[0])}</tspan>
        <tspan x="20" y="92">${escapeXml(c.lines[1])}</tspan>
        <tspan x="20" y="112">${escapeXml(c.lines[2])}</tspan>
      </text>

      <g transform="translate(20 134)">
        <rect width="304" height="26" rx="6" fill="${theme.background === '#090510' ? '#0d0618' : '#faf5ff'}" stroke="${theme.panelBorder}" stroke-width="0.8"/>
        <text x="152" y="17" text-anchor="middle" class="mono" fill="${theme.accentTwo}" font-size="10" font-weight="650" letter-spacing="0.8">${escapeXml(c.tags)}</text>
      </g>
    </g>
  `).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 280" role="img" aria-labelledby="title description">
  <title id="title">Signal actuel de ${escapeXml(config.username)}</title>
  <desc id="description">Axes stratégiques et projets en cours de ${escapeXml(config.username)}.</desc>
  <defs>
    <linearGradient id="accent-signal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
  </style>
  <rect width="1200" height="280" rx="22" fill="${theme.background}"/>
  <text x="60" y="48" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">SIGNAL ACTUEL // EXPERTISE SAAS &amp; PROJETS EN COURS</text>
  <path d="M780 43H1140" stroke="url(#accent-signal)" stroke-width="2" stroke-linecap="round"/>
  ${renderedCards}
  <rect x="1" y="1" width="1198" height="278" rx="21" fill="none" stroke="${theme.panelBorder}"/>
</svg>`;
}

function renderGoogleClean(theme) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 380" role="img" aria-labelledby="title description">
  <title id="title">Spécialisation Écosystème Google &amp; IA de Kyrris</title>
  <desc id="description">Présentation de la spécialisation dans les outils Google, Antigravity et Gemini.</desc>
  <defs>
    <linearGradient id="google-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="33%" stop-color="#a855f7"/>
      <stop offset="66%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#34a853"/>
    </linearGradient>
    <linearGradient id="gemini-logo-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1ba1e3"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ea4335"/>
    </linearGradient>
    <linearGradient id="antigravity-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <radialGradient id="ai-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.32"/>
      <stop offset="60%" stop-color="#4285f4" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .rotate-orbit { transform-origin: 945px 200px; animation: rot-orbit 20s linear infinite; }
    .pulse-gemini { transform-origin: 945px 200px; animation: pulse-gem 3.5s ease-in-out infinite; }
    @keyframes rot-orbit { to { transform: rotate(360deg); } }
    @keyframes pulse-gem { 0%, 100% { transform: scale(0.92); opacity: 0.85; } 50% { transform: scale(1.08); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .rotate-orbit, .pulse-gemini { animation: none; } }
  </style>

  <!-- Fond & Bordure externe -->
  <rect width="1200" height="380" rx="22" fill="${theme.background}"/>
  <rect x="1" y="1" width="1198" height="378" rx="21" fill="none" stroke="${theme.panelBorder}"/>

  <!-- En-tête -->
  <text x="60" y="46" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">SPÉCIALISATION // ÉCOSYSTÈME GOOGLE &amp; IA AGENTIQUE</text>
  <path d="M780 41H1140" stroke="url(#google-gradient)" stroke-width="2.5" stroke-linecap="round"/>

  <!-- PANNEAU GAUCHE : LES 3 PILIERS GOOGLE AVEC VRAIS LOGOS & 30PX DE MARGE EN BAS -->
  <g transform="translate(60 66)">
    <rect width="640" height="282" rx="18" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.4"/>

    <!-- PILIER 1 : GOOGLE ANTIGRAVITY (2.0 & IDE) -->
    <g transform="translate(24 16)">
      <!-- VRAI LOGO GOOGLE ANTIGRAVITY (Marque AGY / Prisme dimensionnel en suspension zéro-G) -->
      <g transform="translate(0 2)">
        <circle cx="20" cy="20" r="19" fill="#1b0e33" stroke="#a855f7" stroke-width="1.3"/>
        <polygon points="20,9 29,26 11,26" fill="none" stroke="url(#antigravity-grad)" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="20,13 25,24 15,24" fill="url(#antigravity-grad)" opacity="0.85"/>
        <circle cx="20" cy="21" r="2.2" fill="#ffffff" filter="url(#glow-filter)"/>
        <ellipse cx="20" cy="28" rx="8" ry="2.5" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.75"/>
      </g>
      
      <text x="54" y="24" class="sans" fill="${theme.text}" font-size="16" font-weight="750" letter-spacing="-0.2">Google Antigravity (2.0 &amp; IDE)</text>

      <text x="54" y="47" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        Maîtrise avancée du développement assisté par agents : subagents autonomes,
      </text>
      <text x="54" y="63" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        protocoles MCP (Model Context Protocol), skills et orchestration de contextes complexes.
      </text>
    </g>

    <!-- Séparateur 1 -->
    <line x1="24" y1="96" x2="616" y2="96" stroke="${theme.panelBorder}" stroke-width="0.8" opacity="0.6"/>

    <!-- PILIER 2 : GOOGLE GEMINI -->
    <g transform="translate(24 108)">
      <!-- VRAI LOGO GOOGLE GEMINI (Étoile 4 branches avec dégradé officiel) -->
      <g transform="translate(0 2)">
        <circle cx="20" cy="20" r="19" fill="#101738" stroke="#60a5fa" stroke-width="1.3"/>
        <path d="M 20 7 Q 20 20 7 20 Q 20 20 20 33 Q 20 20 33 20 Q 20 20 20 7 Z" fill="url(#gemini-logo-grad)" filter="url(#glow-filter)"/>
        <circle cx="20" cy="20" r="2" fill="#ffffff"/>
      </g>
      
      <text x="54" y="24" class="sans" fill="${theme.text}" font-size="16" font-weight="750" letter-spacing="-0.2">Google Gemini</text>

      <text x="54" y="47" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        Exploitation de l&apos;intelligence artificielle Google : contexte étendu, function calling,
      </text>
      <text x="54" y="63" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        raisonnement multimodal et intégration directe dans des APIs TypeScript (Nest/Nuxt).
      </text>
    </g>

    <!-- Séparateur 2 -->
    <line x1="24" y1="188" x2="616" y2="188" stroke="${theme.panelBorder}" stroke-width="0.8" opacity="0.6"/>

    <!-- PILIER 3 : GOOGLE CLOUD & VERTEX AI (30PX DE RESPIRATION EN BAS) -->
    <g transform="translate(24 200)">
      <!-- VRAI LOGO GOOGLE CLOUD MULTICOLORE -->
      <g transform="translate(0 2)">
        <circle cx="20" cy="20" r="19" fill="#0d2424" stroke="#34d399" stroke-width="1.3"/>
        <g transform="translate(8.5 11) scale(0.95)">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4"/>
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.12 0-2.18.28-3.13.77l2.87 2.87c.25-.04.5-.08.76-.08 2.21 0 4 1.79 4 4 0 .34-.05.67-.14.98l2.99 2.99c1.23-.74 2.05-2.07 2.05-3.57 0-2.64-2.05-4.78-4.65-4.96z" fill="#EA4335"/>
          <path d="M6 20h13c.47 0 .91-.07 1.34-.18l-3.21-3.21C16.7 16.85 16.36 17 16 17H6c-1.66 0-3-1.34-3-3 0-1.42.99-2.6 2.33-2.91l-1.92-1.92C1.4 10.15 0 11.9 0 14c0 3.31 2.69 6 6 6z" fill="#34A853"/>
          <path d="M12 4c-.7 0-1.37.12-2 .33l3.29 3.29c.23-.05.47-.08.71-.08 1.1 0 2.1.45 2.83 1.17l2.12-2.12C17.38 5.12 14.86 4 12 4z" fill="#FBBC05"/>
        </g>
      </g>
      
      <text x="54" y="24" class="sans" fill="${theme.text}" font-size="16" font-weight="750" letter-spacing="-0.2">Google Cloud &amp; Vertex AI</text>

      <text x="54" y="47" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        Déploiement conteneurisé sur Cloud Run, gestion d&apos;infrastructures modernes,
      </text>
      <text x="54" y="63" class="sans" fill="${theme.muted}" font-size="12" font-weight="500">
        intégration d&apos;APIs d&apos;intelligence artificielle et cloud sécurisé.
      </text>
    </g>
  </g>

  <!-- PANNEAU DROIT : 4 SATELLITES POSITIONNÉS (HAUT, BAS, GAUCHE, DROITE) SANS CHEVAUCHEMENT -->
  <g id="google-hologram">
    <!-- Halo d'ambiance -->
    <circle cx="945" cy="200" r="120" fill="url(#ai-glow)"/>

    <!-- Anneau radar extérieur avec rotation -->
    <circle cx="945" cy="200" r="82" fill="none" stroke="${theme.panelBorder}" stroke-width="1.4"/>
    <circle cx="945" cy="200" r="82" fill="none" stroke="url(#google-gradient)" stroke-width="2" stroke-dasharray="12 28 6 16" class="rotate-orbit"/>

    <!-- Anneau intermédiaire -->
    <circle cx="945" cy="200" r="58" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.3"/>

    <!-- Étoile Gemini 4 branches centrale pulsante -->
    <g class="pulse-gemini">
      <path d="M 945 168 Q 945 200 977 200 Q 945 200 945 232 Q 945 200 913 200 Q 945 200 945 168 Z" 
            fill="url(#google-gradient)" filter="url(#glow-filter)"/>
      <circle cx="945" cy="200" r="4.5" fill="#ffffff"/>
    </g>

    <!-- Ticks pointillés de liaison technique -->
    <line x1="945" y1="104" x2="945" y2="118" stroke="#a855f7" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="945" y1="282" x2="945" y2="296" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="846" y1="200" x2="862" y2="200" stroke="#34d399" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="1028" y1="200" x2="1044" y2="200" stroke="#ec4899" stroke-width="1.2" stroke-dasharray="2 2"/>

    <!-- 1. AU-DESSUS (12H) : ANTIGRAVITY // 2.0 & IDE -->
    <g transform="translate(850 76)">
      <rect width="190" height="26" rx="13" fill="${theme.panel}" stroke="#a855f7" stroke-width="1.2"/>
      <circle cx="14" cy="13" r="3.5" fill="#c084fc"/>
      <text x="26" y="17" class="mono" fill="${theme.text}" font-size="10" font-weight="700" letter-spacing="0.5">ANTIGRAVITY // 2.0 &amp; IDE</text>
    </g>

    <!-- 2. EN-DESSOUS (6H) : GOOGLE GEMINI -->
    <g transform="translate(875 298)">
      <rect width="140" height="26" rx="13" fill="${theme.panel}" stroke="#60a5fa" stroke-width="1.2"/>
      <circle cx="14" cy="13" r="3.5" fill="#60a5fa"/>
      <text x="26" y="17" class="mono" fill="${theme.text}" font-size="10" font-weight="700" letter-spacing="0.8">GOOGLE GEMINI</text>
    </g>

    <!-- 3. À GAUCHE (9H) : GOOGLE CLOUD -->
    <g transform="translate(712 187)">
      <rect width="134" height="26" rx="13" fill="${theme.panel}" stroke="#34d399" stroke-width="1.2"/>
      <circle cx="14" cy="13" r="3.5" fill="#34d399"/>
      <text x="26" y="17" class="mono" fill="${theme.text}" font-size="10" font-weight="700" letter-spacing="0.6">GOOGLE CLOUD</text>
    </g>

    <!-- 4. À DROITE (3H) : VERTEX AI -->
    <g transform="translate(1044 187)">
      <rect width="112" height="26" rx="13" fill="${theme.panel}" stroke="#ec4899" stroke-width="1.2"/>
      <circle cx="14" cy="13" r="3.5" fill="#ec4899"/>
      <text x="24" y="17" class="mono" fill="${theme.text}" font-size="10" font-weight="700" letter-spacing="0.8">VERTEX AI</text>
    </g>
  </g>
</svg>`;
}

function renderStack(theme) {
  const cardWidth = 344;
  const cardHeight = 54;
  const gapX = 24;
  const gapY = 16;
  const startX = 60;
  const startY = 74;

  const softwareList = [
    {
      label: "Hugging Face",
      logo: `
        <circle cx="12" cy="12" r="11" fill="#FFD21E"/>
        <path d="M7.5 10c0-1.2 1-1.8 1.8-1.8s1.8.6 1.8 1.8" stroke="#333333" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <path d="M12.9 10c0-1.2 1-1.8 1.8-1.8s1.8.6 1.8 1.8" stroke="#333333" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <path d="M8 14c1 2 2.5 2.8 4 2.8s3-.8 4-2.8" stroke="#333333" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <path d="M2.5 14.5c.8-.8 2-.6 2.5.5" stroke="#FFA000" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M21.5 14.5c-.8-.8-2-.6-2.5.5" stroke="#FFA000" stroke-width="2.2" stroke-linecap="round"/>
      `
    },
    {
      label: "Ollama",
      logo: `
        <path d="M8 21v-5h1.5v-3.5L8 10V6.5l1.5-2 1.5 2v2.5l2-1 2 1V6.5l1.5-2 1.5 2V10l-1.5 2.5V16H18v5" fill="${theme.text}"/>
        <circle cx="10.5" cy="8.5" r="1" fill="${theme.background === '#090510' ? '#090510' : '#ffffff'}"/>
        <circle cx="15.5" cy="8.5" r="1" fill="${theme.background === '#090510' ? '#090510' : '#ffffff'}"/>
      `
    },
    {
      label: "LM Studio",
      logo: `
        <polygon points="12,3 20,7.5 12,12 4,7.5" fill="#c084fc"/>
        <polygon points="4,7.5 12,12 12,21 4,16.5" fill="#7e22ce"/>
        <polygon points="12,12 20,7.5 20,16.5 12,21" fill="#a855f7"/>
        <circle cx="12" cy="12" r="2" fill="#ffffff"/>
      `
    },
    {
      label: "Antigravity 2.0 & IDE",
      logo: `
        <polygon points="12,4 20,17 4,17" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linejoin="round"/>
        <polygon points="12,7 16.5,15.5 7.5,15.5" fill="#a855f7" opacity="0.85"/>
        <circle cx="12" cy="13.5" r="1.8" fill="#ffffff"/>
        <ellipse cx="12" cy="19.5" rx="6.5" ry="2" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.8"/>
      `
    },
    {
      label: "Open Code",
      logo: `
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0284c7" opacity="0.2"/>
        <path d="M7 8l-4 4 4 4" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 8l4 4-4 4" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 6l-4 12" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
      `
    },
    {
      label: "Obsidian",
      logo: `
        <polygon points="12,2 5,7.5 7,18.5 12,22 17,18.5 19,7.5" fill="#6d28d9"/>
        <polygon points="12,2 19,7.5 12,12" fill="#8b5cf6"/>
        <polygon points="12,2 5,7.5 12,12" fill="#a78bfa"/>
        <polygon points="12,12 19,7.5 17,18.5 12,22" fill="#7c3aed"/>
        <polygon points="12,12 5,7.5 7,18.5 12,22" fill="#5b21b6"/>
        <circle cx="12" cy="12" r="1.5" fill="#ffffff" opacity="0.9"/>
      `
    },
    {
      label: "Docker",
      logo: `
        <rect x="5" y="8" width="2.2" height="2" fill="#2496ED"/>
        <rect x="8" y="8" width="2.2" height="2" fill="#2496ED"/>
        <rect x="11" y="8" width="2.2" height="2" fill="#2496ED"/>
        <rect x="8" y="5.2" width="2.2" height="2" fill="#2496ED"/>
        <rect x="11" y="5.2" width="2.2" height="2" fill="#2496ED"/>
        <rect x="14" y="8" width="2.2" height="2" fill="#2496ED"/>
        <path d="M22 12.5c-.3 0-1.4.2-2.2.8-.8-.4-1.8-.4-2.8 0-.4-1.4-1.8-2.3-3.2-2.3H3c-.5 0-1 .4-1 1 0 4.8 3.2 8.5 9.5 8.5 6 0 9.2-3.5 9.5-7.8.1 0 .2 0 .2-.1.6-.4.8-1 .8-1.7H22z" fill="#2496ED"/>
        <circle cx="4.5" cy="13.5" r="0.7" fill="#ffffff"/>
      `
    },
    {
      label: "GitHub",
      logo: `
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="${theme.text}"/>
      `
    },
    {
      label: "Open Source",
      logo: `
        <path d="M12 2.5a9.5 9.5 0 0 0-8.5 13.8l3.9-2.6a5.7 5.7 0 0 1 1.6-4.5 5.7 5.7 0 0 1 5.9 0 5.7 5.7 0 0 1 1.6 4.5l3.9 2.6A9.5 9.5 0 0 0 12 2.5z" fill="#22c55e"/>
        <path d="M12 9a3 3 0 0 0-3 3v7.5a3 3 0 0 0 6 0V12a3 3 0 0 0-3-3z" fill="#22c55e"/>
      `
    }
  ];

  const renderedGrid = softwareList.map((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    return `
      <g transform="translate(${x} ${y})">
        <rect width="${cardWidth}" height="${cardHeight}" rx="14" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.3"/>
        
        <!-- Boîte de logo avec fond dédié -->
        <rect x="10" y="9" width="36" height="36" rx="9" fill="${theme.background === '#090510' ? '#180e30' : '#f3e8ff'}" stroke="${theme.panelBorder}" stroke-width="0.9"/>
        <g transform="translate(16 15)">
          ${item.logo}
        </g>
        
        <!-- Nom du logiciel -->
        <text x="58" y="33" class="sans" fill="${theme.text}" font-size="15" font-weight="750" letter-spacing="-0.2">${escapeXml(item.label)}</text>
      </g>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" role="img" aria-labelledby="title description">
  <title id="title">Boîte à outils logicielle de ${escapeXml(config.username)}</title>
  <desc id="description">Logiciels et outils maîtrisés : Hugging Face, Ollama, LM Studio, Antigravity 2.0 &amp; IDE, Open Code, Obsidian, Docker, GitHub, Open Source.</desc>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.accent}"/><stop offset=".55" stop-color="${theme.accentTwo}"/><stop offset="1" stop-color="${theme.accentThree}"/></linearGradient>
  </defs>
  <style>
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
  </style>
  <rect width="1200" height="300" rx="22" fill="${theme.background}"/>
  <text x="60" y="46" class="mono" fill="${theme.accent}" font-size="14" font-weight="700" letter-spacing="3">BOÎTE À OUTILS // LOGICIELS, ÉCOSYSTÈME IA &amp; OPEN SOURCE</text>
  <path d="M780 41H1140" stroke="url(#accent)" stroke-width="2" stroke-linecap="round"/>
  ${renderedGrid}
  <rect x="1" y="1" width="1198" height="298" rx="21" fill="none" stroke="${theme.panelBorder}"/>
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
