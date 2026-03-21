require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('./db');

const ts = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

// ISO 3166-1 alpha-2 codes for flagcdn.com
const matches = [
  { phase: 'groups', group_name: 'A', team_a: 'México', flag_a: 'mx', team_b: 'Sudáfrica', flag_b: 'za', match_date: ts('2026-06-11T16:00:00-03:00'), venue: 'Ciudad de México' },
  { phase: 'groups', group_name: 'A', team_a: 'Corea del Sur', flag_a: 'kr', team_b: 'UEFA 4', flag_b: '', match_date: ts('2026-06-11T23:00:00-03:00'), venue: 'Guadalajara' },
  { phase: 'groups', group_name: 'B', team_a: 'Canadá', flag_a: 'ca', team_b: 'UEFA 1', flag_b: '', match_date: ts('2026-06-12T16:00:00-03:00'), venue: 'Toronto' },
  { phase: 'groups', group_name: 'D', team_a: 'Estados Unidos', flag_a: 'us', team_b: 'Paraguay', flag_b: 'py', match_date: ts('2026-06-12T22:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'groups', group_name: 'B', team_a: 'Qatar', flag_a: 'qa', team_b: 'Suiza', flag_b: 'ch', match_date: ts('2026-06-13T16:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'groups', group_name: 'C', team_a: 'Brasil', flag_a: 'br', team_b: 'Marruecos', flag_b: 'ma', match_date: ts('2026-06-13T19:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'groups', group_name: 'C', team_a: 'Haití', flag_a: 'ht', team_b: 'Escocia', flag_b: 'gb-sct', match_date: ts('2026-06-13T22:00:00-03:00'), venue: 'Boston' },
  { phase: 'groups', group_name: 'D', team_a: 'Australia', flag_a: 'au', team_b: 'UEFA 3', flag_b: '', match_date: ts('2026-06-13T01:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'groups', group_name: 'E', team_a: 'Alemania', flag_a: 'de', team_b: 'Curazao', flag_b: 'cw', match_date: ts('2026-06-14T14:00:00-03:00'), venue: 'Houston' },
  { phase: 'groups', group_name: 'F', team_a: 'Países Bajos', flag_a: 'nl', team_b: 'Japón', flag_b: 'jp', match_date: ts('2026-06-14T17:00:00-03:00'), venue: 'Dallas' },
  { phase: 'groups', group_name: 'E', team_a: 'Costa de Marfil', flag_a: '', team_b: 'Ecuador', flag_b: 'ec', match_date: ts('2026-06-14T20:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'groups', group_name: 'F', team_a: 'UEFA 2', flag_a: '', team_b: 'Túnez', flag_b: 'tn', match_date: ts('2026-06-14T23:00:00-03:00'), venue: 'Monterrey' },
  { phase: 'groups', group_name: 'H', team_a: 'España', flag_a: 'es', team_b: 'Cabo Verde', flag_b: 'cv', match_date: ts('2026-06-15T13:00:00-03:00'), venue: 'Atlanta' },
  { phase: 'groups', group_name: 'G', team_a: 'Bélgica', flag_a: 'be', team_b: 'Egipto', flag_b: 'eg', match_date: ts('2026-06-15T16:00:00-03:00'), venue: 'Seattle' },
  { phase: 'groups', group_name: 'H', team_a: 'Arabia Saudita', flag_a: 'sa', team_b: 'Uruguay', flag_b: 'uy', match_date: ts('2026-06-15T19:00:00-03:00'), venue: 'Miami' },
  { phase: 'groups', group_name: 'G', team_a: 'Irán', flag_a: 'ir', team_b: 'Nueva Zelanda', flag_b: 'nz', match_date: ts('2026-06-15T22:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'groups', group_name: 'I', team_a: 'Francia', flag_a: 'fr', team_b: 'Senegal', flag_b: 'sn', match_date: ts('2026-06-16T16:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'groups', group_name: 'I', team_a: 'FIFA 2', flag_a: '', team_b: 'Noruega', flag_b: 'no', match_date: ts('2026-06-16T19:00:00-03:00'), venue: 'Boston' },
  { phase: 'groups', group_name: 'J', team_a: 'Argentina', flag_a: 'ar', team_b: 'Argelia', flag_b: 'dz', match_date: ts('2026-06-16T22:00:00-03:00'), venue: 'Kansas City' },
  { phase: 'groups', group_name: 'J', team_a: 'Austria', flag_a: 'at', team_b: 'Jordania', flag_b: 'jo', match_date: ts('2026-06-16T01:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'groups', group_name: 'K', team_a: 'Portugal', flag_a: 'pt', team_b: 'FIFA 1', flag_b: '', match_date: ts('2026-06-17T14:00:00-03:00'), venue: 'Houston' },
  { phase: 'groups', group_name: 'L', team_a: 'Inglaterra', flag_a: 'gb-eng', team_b: 'Croacia', flag_b: 'hr', match_date: ts('2026-06-17T17:00:00-03:00'), venue: 'Dallas' },
  { phase: 'groups', group_name: 'L', team_a: 'Ghana', flag_a: 'gh', team_b: 'Panamá', flag_b: 'pa', match_date: ts('2026-06-17T20:00:00-03:00'), venue: 'Toronto' },
  { phase: 'groups', group_name: 'K', team_a: 'Uzbekistán', flag_a: 'uz', team_b: 'Colombia', flag_b: 'co', match_date: ts('2026-06-17T23:00:00-03:00'), venue: 'Ciudad de México' },
  { phase: 'groups', group_name: 'A', team_a: 'UEFA 4', flag_a: '', team_b: 'Sudáfrica', flag_b: 'za', match_date: ts('2026-06-18T13:00:00-03:00'), venue: 'Atlanta' },
  { phase: 'groups', group_name: 'B', team_a: 'Suiza', flag_a: 'ch', team_b: 'UEFA 1', flag_b: '', match_date: ts('2026-06-18T16:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'groups', group_name: 'B', team_a: 'Canadá', flag_a: 'ca', team_b: 'Qatar', flag_b: 'qa', match_date: ts('2026-06-18T19:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'groups', group_name: 'A', team_a: 'México', flag_a: 'mx', team_b: 'Corea del Sur', flag_b: 'kr', match_date: ts('2026-06-18T22:00:00-03:00'), venue: 'Guadalajara' },
  { phase: 'groups', group_name: 'D', team_a: 'Estados Unidos', flag_a: 'us', team_b: 'Australia', flag_b: 'au', match_date: ts('2026-06-19T16:00:00-03:00'), venue: 'Seattle' },
  { phase: 'groups', group_name: 'C', team_a: 'Escocia', flag_a: 'gb-sct', team_b: 'Marruecos', flag_b: 'ma', match_date: ts('2026-06-19T19:00:00-03:00'), venue: 'Boston' },
  { phase: 'groups', group_name: 'C', team_a: 'Brasil', flag_a: 'br', team_b: 'Haití', flag_b: 'ht', match_date: ts('2026-06-19T22:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'groups', group_name: 'D', team_a: 'UEFA 3', flag_a: '', team_b: 'Paraguay', flag_b: 'py', match_date: ts('2026-06-19T01:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'groups', group_name: 'F', team_a: 'Países Bajos', flag_a: 'nl', team_b: 'UEFA 2', flag_b: '', match_date: ts('2026-06-20T14:00:00-03:00'), venue: 'Houston' },
  { phase: 'groups', group_name: 'E', team_a: 'Alemania', flag_a: 'de', team_b: 'Costa de Marfil', flag_b: '', match_date: ts('2026-06-20T17:00:00-03:00'), venue: 'Toronto' },
  { phase: 'groups', group_name: 'E', team_a: 'Ecuador', flag_a: 'ec', team_b: 'Curazao', flag_b: 'cw', match_date: ts('2026-06-20T21:00:00-03:00'), venue: 'Kansas City' },
  { phase: 'groups', group_name: 'F', team_a: 'Túnez', flag_a: 'tn', team_b: 'Japón', flag_b: 'jp', match_date: ts('2026-06-20T01:00:00-03:00'), venue: 'Monterrey' },
  { phase: 'groups', group_name: 'H', team_a: 'España', flag_a: 'es', team_b: 'Arabia Saudita', flag_b: 'sa', match_date: ts('2026-06-21T13:00:00-03:00'), venue: 'Atlanta' },
  { phase: 'groups', group_name: 'G', team_a: 'Bélgica', flag_a: 'be', team_b: 'Irán', flag_b: 'ir', match_date: ts('2026-06-21T16:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'groups', group_name: 'H', team_a: 'Uruguay', flag_a: 'uy', team_b: 'Cabo Verde', flag_b: 'cv', match_date: ts('2026-06-21T19:00:00-03:00'), venue: 'Miami' },
  { phase: 'groups', group_name: 'G', team_a: 'Nueva Zelanda', flag_a: 'nz', team_b: 'Egipto', flag_b: 'eg', match_date: ts('2026-06-21T22:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'groups', group_name: 'J', team_a: 'Argentina', flag_a: 'ar', team_b: 'Austria', flag_b: 'at', match_date: ts('2026-06-22T14:00:00-03:00'), venue: 'Dallas' },
  { phase: 'groups', group_name: 'I', team_a: 'Francia', flag_a: 'fr', team_b: 'FIFA 2', flag_b: '', match_date: ts('2026-06-22T18:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'groups', group_name: 'I', team_a: 'Noruega', flag_a: 'no', team_b: 'Senegal', flag_b: 'sn', match_date: ts('2026-06-22T21:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'groups', group_name: 'J', team_a: 'Jordania', flag_a: 'jo', team_b: 'Argelia', flag_b: 'dz', match_date: ts('2026-06-22T00:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'groups', group_name: 'K', team_a: 'Portugal', flag_a: 'pt', team_b: 'Uzbekistán', flag_b: 'uz', match_date: ts('2026-06-23T14:00:00-03:00'), venue: 'Houston' },
  { phase: 'groups', group_name: 'L', team_a: 'Inglaterra', flag_a: 'gb-eng', team_b: 'Ghana', flag_b: 'gh', match_date: ts('2026-06-23T17:00:00-03:00'), venue: 'Boston' },
  { phase: 'groups', group_name: 'L', team_a: 'Panamá', flag_a: 'pa', team_b: 'Croacia', flag_b: 'hr', match_date: ts('2026-06-23T20:00:00-03:00'), venue: 'Toronto' },
  { phase: 'groups', group_name: 'K', team_a: 'Colombia', flag_a: 'co', team_b: 'FIFA 1', flag_b: '', match_date: ts('2026-06-23T23:00:00-03:00'), venue: 'Guadalajara' },
  { phase: 'groups', group_name: 'B', team_a: 'Suiza', flag_a: 'ch', team_b: 'Canadá', flag_b: 'ca', match_date: ts('2026-06-24T16:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'groups', group_name: 'B', team_a: 'UEFA 1', flag_a: '', team_b: 'Qatar', flag_b: 'qa', match_date: ts('2026-06-24T16:00:00-03:00'), venue: 'Lumen Field, Seattle' },
  { phase: 'groups', group_name: 'C', team_a: 'Marruecos', flag_a: 'ma', team_b: 'Haití', flag_b: 'ht', match_date: ts('2026-06-24T19:00:00-03:00'), venue: 'Atlanta' },
  { phase: 'groups', group_name: 'C', team_a: 'Brasil', flag_a: 'br', team_b: 'Escocia', flag_b: 'gb-sct', match_date: ts('2026-06-24T19:00:00-03:00'), venue: 'Miami' },
  { phase: 'groups', group_name: 'A', team_a: 'Sudáfrica', flag_a: 'za', team_b: 'Corea del Sur', flag_b: 'kr', match_date: ts('2026-06-24T22:00:00-03:00'), venue: 'Monterrey' },
  { phase: 'groups', group_name: 'A', team_a: 'UEFA 4', flag_a: '', team_b: 'México', flag_b: 'mx', match_date: ts('2026-06-24T22:00:00-03:00'), venue: 'Ciudad de México' },
  { phase: 'groups', group_name: 'E', team_a: 'Curazao', flag_a: 'cw', team_b: 'Costa de Marfil', flag_b: '', match_date: ts('2026-06-25T17:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'groups', group_name: 'E', team_a: 'Ecuador', flag_a: 'ec', team_b: 'Alemania', flag_b: 'de', match_date: ts('2026-06-25T17:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'groups', group_name: 'F', team_a: 'Japón', flag_a: 'jp', team_b: 'UEFA 2', flag_b: '', match_date: ts('2026-06-25T20:00:00-03:00'), venue: 'Dallas' },
  { phase: 'groups', group_name: 'F', team_a: 'Túnez', flag_a: 'tn', team_b: 'Países Bajos', flag_b: 'nl', match_date: ts('2026-06-25T20:00:00-03:00'), venue: 'Kansas City' },
  { phase: 'groups', group_name: 'D', team_a: 'Paraguay', flag_a: 'py', team_b: 'Australia', flag_b: 'au', match_date: ts('2026-06-25T23:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'groups', group_name: 'D', team_a: 'UEFA 3', flag_a: '', team_b: 'Estados Unidos', flag_b: 'us', match_date: ts('2026-06-25T23:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'groups', group_name: 'I', team_a: 'Noruega', flag_a: 'no', team_b: 'Francia', flag_b: 'fr', match_date: ts('2026-06-26T16:00:00-03:00'), venue: 'Boston' },
  { phase: 'groups', group_name: 'I', team_a: 'Senegal', flag_a: 'sn', team_b: 'FIFA 2', flag_b: '', match_date: ts('2026-06-26T16:00:00-03:00'), venue: 'Toronto' },
  { phase: 'groups', group_name: 'H', team_a: 'Cabo Verde', flag_a: 'cv', team_b: 'Arabia Saudita', flag_b: 'sa', match_date: ts('2026-06-26T21:00:00-03:00'), venue: 'Houston' },
  { phase: 'groups', group_name: 'H', team_a: 'Uruguay', flag_a: 'uy', team_b: 'España', flag_b: 'es', match_date: ts('2026-06-26T21:00:00-03:00'), venue: 'Guadalajara' },
  { phase: 'groups', group_name: 'G', team_a: 'Egipto', flag_a: 'eg', team_b: 'Irán', flag_b: 'ir', match_date: ts('2026-06-26T00:00:00-03:00'), venue: 'Seattle' },
  { phase: 'groups', group_name: 'G', team_a: 'Nueva Zelanda', flag_a: 'nz', team_b: 'Bélgica', flag_b: 'be', match_date: ts('2026-06-26T00:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'groups', group_name: 'L', team_a: 'Croacia', flag_a: 'hr', team_b: 'Ghana', flag_b: 'gh', match_date: ts('2026-06-27T18:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'groups', group_name: 'L', team_a: 'Panamá', flag_a: 'pa', team_b: 'Inglaterra', flag_b: 'gb-eng', match_date: ts('2026-06-27T18:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'groups', group_name: 'K', team_a: 'Colombia', flag_a: 'co', team_b: 'Portugal', flag_b: 'pt', match_date: ts('2026-06-27T20:30:00-03:00'), venue: 'Miami' },
  { phase: 'groups', group_name: 'K', team_a: 'FIFA 1', flag_a: '', team_b: 'Uzbekistán', flag_b: 'uz', match_date: ts('2026-06-27T20:30:00-03:00'), venue: 'Atlanta' },
  { phase: 'groups', group_name: 'J', team_a: 'Argelia', flag_a: 'dz', team_b: 'Austria', flag_b: 'at', match_date: ts('2026-06-27T23:00:00-03:00'), venue: 'Kansas City' },
  { phase: 'groups', group_name: 'J', team_a: 'Jordania', flag_a: 'jo', team_b: 'Argentina', flag_b: 'ar', match_date: ts('2026-06-27T23:00:00-03:00'), venue: 'Dallas' },
  // ---------------------------------------------------------
  // ROUND OF 32 (16avos de Final)
  // Left Side (Cruces 1 al 8) -> Matches 73-80
  { phase: 'round_of_32', group_name: null, match_number: 73, team_a: '1º Grupo E', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-06-28T16:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'round_of_32', group_name: null, match_number: 74, team_a: '1º Grupo I', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-06-29T16:00:00-03:00'), venue: 'Boston' },
  { phase: 'round_of_32', group_name: null, match_number: 75, team_a: '2º Grupo A', flag_a: '', team_b: '2º Grupo B', flag_b: '', match_date: ts('2026-06-29T16:00:00-03:00'), venue: 'Monterrey' },
  { phase: 'round_of_32', group_name: null, match_number: 76, team_a: '1º Grupo F', flag_a: '', team_b: '2º Grupo C', flag_b: '', match_date: ts('2026-06-29T16:00:00-03:00'), venue: 'Houston' },
  { phase: 'round_of_32', group_name: null, match_number: 77, team_a: '2º Grupo K', flag_a: '', team_b: '2º Grupo L', flag_b: '', match_date: ts('2026-06-30T16:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'round_of_32', group_name: null, match_number: 78, team_a: '1º Grupo H', flag_a: '', team_b: '2º Grupo J', flag_b: '', match_date: ts('2026-06-30T16:00:00-03:00'), venue: 'Dallas' },
  { phase: 'round_of_32', group_name: null, match_number: 79, team_a: '1º Grupo D', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-06-30T16:00:00-03:00'), venue: 'Ciudad de México' },
  { phase: 'round_of_32', group_name: null, match_number: 80, team_a: '1º Grupo G', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-07-01T16:00:00-03:00'), venue: 'Atlanta' },
  
  // Right Side (Cruces 9 al 16) -> Matches 81-88
  { phase: 'round_of_32', group_name: null, match_number: 81, team_a: '1º Grupo C', flag_a: '', team_b: '2º Grupo F', flag_b: '', match_date: ts('2026-07-01T16:00:00-03:00'), venue: 'San Francisco' },
  { phase: 'round_of_32', group_name: null, match_number: 82, team_a: '2º Grupo E', flag_a: '', team_b: '2º Grupo I', flag_b: '', match_date: ts('2026-07-01T16:00:00-03:00'), venue: 'Seattle' },
  { phase: 'round_of_32', group_name: null, match_number: 83, team_a: '1º Grupo A', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-07-02T16:00:00-03:00'), venue: 'Toronto' },
  { phase: 'round_of_32', group_name: null, match_number: 84, team_a: '1º Grupo L', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-07-02T16:00:00-03:00'), venue: 'Los Ángeles' },
  { phase: 'round_of_32', group_name: null, match_number: 85, team_a: '1º Grupo J', flag_a: '', team_b: '2º Grupo H', flag_b: '', match_date: ts('2026-07-02T16:00:00-03:00'), venue: 'Vancouver' },
  { phase: 'round_of_32', group_name: null, match_number: 86, team_a: '2º Grupo D', flag_a: '', team_b: '2º Grupo G', flag_b: '', match_date: ts('2026-07-03T16:00:00-03:00'), venue: 'Miami' },
  { phase: 'round_of_32', group_name: null, match_number: 87, team_a: '1º Grupo B', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-07-03T16:00:00-03:00'), venue: 'Kansas City' },
  { phase: 'round_of_32', group_name: null, match_number: 88, team_a: '1º Grupo K', flag_a: '', team_b: 'TERCERO', flag_b: '', match_date: ts('2026-07-03T16:00:00-03:00'), venue: 'Dallas' },

  // ---------------------------------------------------------
  // ROUND OF 16 (Octavos de Final)
  // Left Side (Octavos 1 al 4) -> Matches 89-92
  { phase: 'round_of_16', group_name: null, match_number: 89, team_a: 'Ganador Partido 73', flag_a: '', team_b: 'Ganador Partido 74', flag_b: '', match_date: ts('2026-07-04T16:00:00-03:00'), venue: 'Philadelphia' },
  { phase: 'round_of_16', group_name: null, match_number: 90, team_a: 'Ganador Partido 75', flag_a: '', team_b: 'Ganador Partido 76', flag_b: '', match_date: ts('2026-07-04T16:00:00-03:00'), venue: 'Houston' },
  { phase: 'round_of_16', group_name: null, match_number: 91, team_a: 'Ganador Partido 77', flag_a: '', team_b: 'Ganador Partido 78', flag_b: '', match_date: ts('2026-07-05T16:00:00-03:00'), venue: 'Nueva Jersey' },
  { phase: 'round_of_16', group_name: null, match_number: 92, team_a: 'Ganador Partido 79', flag_a: '', team_b: 'Ganador Partido 80', flag_b: '', match_date: ts('2026-07-05T16:00:00-03:00'), venue: 'Ciudad de México' },

  // Right Side (Octavos 5 al 8) -> Matches 93-96
  { phase: 'round_of_16', group_name: null, match_number: 93, team_a: 'Ganador Partido 81', flag_a: '', team_b: 'Ganador Partido 82', flag_b: '', match_date: ts('2026-07-06T16:00:00-03:00'), venue: 'Dallas' },
  { phase: 'round_of_16', group_name: null, match_number: 94, team_a: 'Ganador Partido 83', flag_a: '', team_b: 'Ganador Partido 84', flag_b: '', match_date: ts('2026-07-06T16:00:00-03:00'), venue: 'Seattle' },
  { phase: 'round_of_16', group_name: null, match_number: 95, team_a: 'Ganador Partido 85', flag_a: '', team_b: 'Ganador Partido 86', flag_b: '', match_date: ts('2026-07-07T16:00:00-03:00'), venue: 'Atlanta' },
  { phase: 'round_of_16', group_name: null, match_number: 96, team_a: 'Ganador Partido 87', flag_a: '', team_b: 'Ganador Partido 88', flag_b: '', match_date: ts('2026-07-07T16:00:00-03:00'), venue: 'Vancouver' },

  // ---------------------------------------------------------
  // QUARTERFINALS (Cuartos de Final)
  // Left Side (Cuartos 1 y 2) -> Matches 97-98
  { phase: 'quarterfinals', group_name: null, match_number: 97, team_a: 'Ganador Partido 89', flag_a: '', team_b: 'Ganador Partido 90', flag_b: '', match_date: ts('2026-07-09T16:00:00-03:00'), venue: 'Boston' },
  { phase: 'quarterfinals', group_name: null, match_number: 98, team_a: 'Ganador Partido 91', flag_a: '', team_b: 'Ganador Partido 92', flag_b: '', match_date: ts('2026-07-10T16:00:00-03:00'), venue: 'Los Ángeles' },

  // Right Side (Cuartos 3 y 4) -> Matches 99-100
  { phase: 'quarterfinals', group_name: null, match_number: 99, team_a: 'Ganador Partido 93', flag_a: '', team_b: 'Ganador Partido 94', flag_b: '', match_date: ts('2026-07-11T16:00:00-03:00'), venue: 'Miami' },
  { phase: 'quarterfinals', group_name: null, match_number: 100, team_a: 'Ganador Partido 95', flag_a: '', team_b: 'Ganador Partido 96', flag_b: '', match_date: ts('2026-07-11T16:00:00-03:00'), venue: 'Kansas City' },

  // ---------------------------------------------------------
  // SEMIFINALS (Semifinales)
  // Semifinal 1 (Left Side Winners) -> Match 101
  { phase: 'semifinals', group_name: null, match_number: 101, team_a: 'Ganador Partido 97', flag_a: '', team_b: 'Ganador Partido 98', flag_b: '', match_date: ts('2026-07-14T16:00:00-03:00'), venue: 'Dallas' },
  // Semifinal 2 (Right Side Winners) -> Match 102
  { phase: 'semifinals', group_name: null, match_number: 102, team_a: 'Ganador Partido 99', flag_a: '', team_b: 'Ganador Partido 100', flag_b: '', match_date: ts('2026-07-15T16:00:00-03:00'), venue: 'Atlanta' },

  // ---------------------------------------------------------
  // THIRD PLACE & FINAL
  { phase: 'third_place', group_name: null, match_number: 103, team_a: 'Perdedor Partido 101', flag_a: '', team_b: 'Perdedor Partido 102', flag_b: '', match_date: ts('2026-07-18T16:00:00-03:00'), venue: 'Miami' },
  { phase: 'final', group_name: null, match_number: 104, team_a: 'Ganador Partido 101', flag_a: '', team_b: 'Ganador Partido 102', flag_b: '', match_date: ts('2026-07-19T16:00:00-03:00'), venue: 'Nueva Jersey' },
];


// Clear existing matches and re-seed
db.prepare('DELETE FROM matches').run();

const insert = db.prepare(`
  INSERT INTO matches (phase, group_name, match_number, team_a, flag_a, team_b, flag_b, match_date, venue)
  VALUES (@phase, @group_name, @match_number, @team_a, @flag_a, @team_b, @flag_b, @match_date, @venue)
`);

const seedAll = db.transaction(() => {
  for (const match of matches) {
    insert.run({ ...match, match_number: match.match_number || null });
  }
});

seedAll();
console.log(`✅ Re-seeded ${matches.length} matches with ISO flag codes.`);
