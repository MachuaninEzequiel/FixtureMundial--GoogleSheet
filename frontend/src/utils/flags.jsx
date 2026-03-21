// Flag utility — maps team names to ISO 3166-1 alpha-2 codes
// Uses flagcdn.com: https://flagcdn.com/w40/{code}.png

export const TEAM_FLAGS = {
  // Group A
  'Qatar': 'qa',
  'Ecuador': 'ec',
  'Senegal': 'sn',
  'Netherlands': 'nl',
  // Group B
  'England': 'gb-eng',
  'Iran': 'ir',
  'USA': 'us',
  'Wales': 'gb-wls',
  // Group C
  'Argentina': 'ar',
  'Arabia Saudita': 'sa',
  'México': 'mx',
  'Polonia': 'pl',
  // Group D
  'Francia': 'fr',
  'Australia': 'au',
  'Dinamarca': 'dk',
  'Túnez': 'tn',
  // Group E
  'España': 'es',
  'Alemania': 'de',
  'Japón': 'jp',
  'Costa Rica': 'cr',
  // Group F
  'Bélgica': 'be',
  'Canadá': 'ca',
  'Marruecos': 'ma',
  'Croacia': 'hr',
  // Group G
  'Brasil': 'br',
  'Serbia': 'rs',
  'Suiza': 'ch',
  'Camerún': 'cm',
  // Group H
  'Portugal': 'pt',
  'Ghana': 'gh',
  'Uruguay': 'uy',
  'Corea del Sur': 'kr',
};

export function getFlagUrl(isoCode, size = 40) {
  if (!isoCode || isoCode.length === 0) return null;
  return `https://flagcdn.com/w${size}/${isoCode.toLowerCase()}.png`;
}

/**
 * TeamFlag - renders a flag as <img> with text fallback
 */
export function TeamFlag({ iso, name, size = 24, className = '' }) {
  const url = getFlagUrl(iso);
  if (!url) {
    return (
      <span
        className={`team-flag-fallback ${className}`}
        style={{ fontSize: size * 0.8 + 'px' }}
        role="img"
        aria-label={name || iso}
      >
        🏳
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={name || iso}
      className={`team-flag-img ${className}`}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ display: 'inline-block', objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
      loading="lazy"
    />
  );
}

export default TeamFlag;
