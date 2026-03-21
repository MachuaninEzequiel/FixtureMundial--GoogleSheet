export function calculateGroupStandings(matches, simResults, tiebreakers = {}) {
  const standings = {};

  matches.forEach(m => {
    if (m.phase !== 'groups') return;
    const g = m.group_name;
    if (!standings[g]) standings[g] = {};
    if (!standings[g][m.team_a]) standings[g][m.team_a] = { team: m.team_a, flag: m.flag_a, pts: 0, gf: 0, gc: 0, gd: 0, played: 0 };
    if (!standings[g][m.team_b]) standings[g][m.team_b] = { team: m.team_b, flag: m.flag_b, pts: 0, gf: 0, gc: 0, gd: 0, played: 0 };
  });

  matches.forEach(m => {
    if (m.phase !== 'groups') return;
    const res = simResults[m.id];
    if (!res) return;

    const { score_a, score_b } = res;
    const statsA = standings[m.group_name][m.team_a];
    const statsB = standings[m.group_name][m.team_b];

    statsA.played++;
    statsB.played++;
    statsA.gf += score_a;
    statsB.gf += score_b;
    statsA.gc += score_b;
    statsB.gc += score_a;

    if (score_a > score_b) {
      statsA.pts += 3;
    } else if (score_b > score_a) {
      statsB.pts += 3;
    } else {
      statsA.pts += 1;
      statsB.pts += 1;
    }

    statsA.gd = statsA.gf - statsA.gc;
    statsB.gd = statsB.gf - statsB.gc;
  });

  const sorted = {};
  const tiedGroups = {}; // store groups that have unresolved ties

  // Helper to check if two teams are tied
  const areTied = (a, b) => a.pts === b.pts && a.gd === b.gd && a.gf === b.gf;

  for (const [group, teams] of Object.entries(standings)) {
    const groupTiebreakers = tiebreakers[group] || [];
    
    sorted[group] = Object.values(teams).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      
      // If we reach here, they are exactly tied on standard metrics.
      // Use manual tiebreakers if available.
      const idxA = groupTiebreakers.indexOf(a.team);
      const idxB = groupTiebreakers.indexOf(b.team);
      
      // If both are in the manual tiebreaker array, honor that order
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      
      // Fallback: alphabetical to ensure stable sort before tiebreaker is applied
      return a.team.localeCompare(b.team);
    });

    // Detect if there are unresolved ties among the top 3 (since we only care about advancing spots)
    const topTeams = sorted[group].slice(0, 3);
    let hasTie = false;
    for (let i = 0; i < topTeams.length - 1; i++) {
      if (areTied(topTeams[i], topTeams[i+1])) {
        // If they are tied, check if they are ALREADY covered by the manual tiebreaker array
        if (!groupTiebreakers.includes(topTeams[i].team) || !groupTiebreakers.includes(topTeams[i+1].team)) {
          hasTie = true;
          break;
        }
      }
    }
    
    if (hasTie) {
      tiedGroups[group] = topTeams.filter((t, idx, arr) => 
        arr.some((other, oIdx) => idx !== oIdx && areTied(t, other))
      ).map(t => t.team);
    }
  }

  return { sorted, tiedGroups };
}

export function getAdvancingTeams(groupStandings, tiebreakers = {}) {
  const firsts = {};
  const seconds = {};
  const thirds = [];

  for (const [group, teams] of Object.entries(groupStandings)) {
    if (teams.length >= 1 && teams[0].played === 3) firsts[group] = teams[0];
    if (teams.length >= 2 && teams[1].played === 3) seconds[group] = teams[1];
    if (teams.length >= 3 && teams[2].played === 3) {
      thirds.push({ ...teams[2], sourceGroup: group });
    }
  }

  const thirdsTiebreakers = tiebreakers['thirds'] || [];

  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;

    // Use manual global third-place tiebreakers
    const idxA = thirdsTiebreakers.indexOf(a.team);
    const idxB = thirdsTiebreakers.indexOf(b.team);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;

    return a.team.localeCompare(b.team);
  });

  const bestThirds = thirds.slice(0, 8);

  // Detect unresolved ties at the cut-off boundary (around 8th place)
  let thirdsTied = false;
  let tiedThirdTeams = [];

  if (thirds.length > 8) {
    const eighth = bestThirds[7];
    const ninth = thirds[8];

    // If 8th and 9th are tied, we need user input to resolve all teams that share that exact tie level
    if (eighth && ninth && eighth.pts === ninth.pts && eighth.gd === ninth.gd && eighth.gf === ninth.gf) {
      // Are they already resolved via tiebreakers array?
      if (!thirdsTiebreakers.includes(eighth.team) || !thirdsTiebreakers.includes(ninth.team)) {
        thirdsTied = true;
        
        // Find all thirds involved in this tie
        tiedThirdTeams = thirds.filter(t => t.pts === eighth.pts && t.gd === eighth.gd && t.gf === eighth.gf).map(t => t.team);
      }
    }
  }
  
  return { firsts, seconds, bestThirds, allThirds: thirds, thirdsTied, tiedThirdTeams };
}


const BRACKET_MAP = {
  // Round of 32
  73: ['1º Grupo E', 'TERCERO'],
  74: ['1º Grupo I', 'TERCERO'],
  75: ['2º Grupo A', '2º Grupo B'],
  76: ['1º Grupo F', '2º Grupo C'],
  77: ['2º Grupo K', '2º Grupo L'],
  78: ['1º Grupo H', '2º Grupo J'],
  79: ['1º Grupo D', 'TERCERO'],
  80: ['1º Grupo G', 'TERCERO'],
  81: ['1º Grupo C', '2º Grupo F'],
  82: ['2º Grupo E', '2º Grupo I'],
  83: ['1º Grupo A', 'TERCERO'],
  84: ['1º Grupo L', 'TERCERO'],
  85: ['1º Grupo J', '2º Grupo H'],
  86: ['2º Grupo D', '2º Grupo G'],
  87: ['1º Grupo B', 'TERCERO'],
  88: ['1º Grupo K', 'TERCERO'],
  // Round of 16
  89: ['Ganador Partido 73', 'Ganador Partido 74'],
  90: ['Ganador Partido 75', 'Ganador Partido 76'],
  91: ['Ganador Partido 77', 'Ganador Partido 78'],
  92: ['Ganador Partido 79', 'Ganador Partido 80'],
  93: ['Ganador Partido 81', 'Ganador Partido 82'],
  94: ['Ganador Partido 83', 'Ganador Partido 84'],
  95: ['Ganador Partido 85', 'Ganador Partido 86'],
  96: ['Ganador Partido 87', 'Ganador Partido 88'],
  // Quarterfinals
  97: ['Ganador Partido 89', 'Ganador Partido 90'],
  98: ['Ganador Partido 91', 'Ganador Partido 92'],
  99: ['Ganador Partido 93', 'Ganador Partido 94'],
  100: ['Ganador Partido 95', 'Ganador Partido 96'],
  // Semifinals
  101: ['Ganador Partido 97', 'Ganador Partido 98'],
  102: ['Ganador Partido 99', 'Ganador Partido 100'],
  // Third Place
  103: ['Perdedor Partido 101', 'Perdedor Partido 102'],
  // Final
  104: ['Ganador Partido 101', 'Ganador Partido 102']
};

export function injectSimulatedBracket(matches, simResults, tiebreakers = {}) {
  const { sorted: standings } = calculateGroupStandings(matches, simResults, tiebreakers);
  const { firsts, seconds, bestThirds } = getAdvancingTeams(standings, tiebreakers);

  const resolveTeamStr = (str) => {
    // 1º Grupo E -> group E first
    const firstMatch = str.match(/1º Grupo ([A-L])/);
    if (firstMatch) {
      const g = firstMatch[1];
      if (firsts[g]) return { team: firsts[g].team, flag: firsts[g].flag };
    }
    
    // 2º Grupo A -> group A second
    const secMatch = str.match(/2º Grupo ([A-L])/);
    if (secMatch) {
      const g = secMatch[1];
      if (seconds[g]) return { team: seconds[g].team, flag: seconds[g].flag };
    }

    return null;
  };

  let bestThirdIndex = 0;

  // Clone matches & inject map
  let computedMatches = matches.map(m => {
    const newM = { ...m };
    if (BRACKET_MAP[newM.id]) {
      newM.team_a = BRACKET_MAP[newM.id][0];
      newM.team_b = BRACKET_MAP[newM.id][1];
      newM.match_number = newM.id; // ensure match_number is set for lookups
    }
    return newM;
  });

  // Round of 32 resolving
  computedMatches = computedMatches.map(m => {
    if (m.phase === 'round_of_32') {
      const newM = { ...m };
      
      // Team A
      if (m.team_a.includes('3º Grupo') || m.team_a === 'TERCERO') {
        const t = bestThirds[bestThirdIndex++];
        if (t) { newM.team_a = t.team; newM.flag_a = t.flag; }
      } else {
        const r = resolveTeamStr(m.team_a);
        if (r) { newM.team_a = r.team; newM.flag_a = r.flag; }
      }

      // Team B
      if (m.team_b.includes('3º Grupo') || m.team_b === 'TERCERO') {
        const t = bestThirds[bestThirdIndex++];
        if (t) { newM.team_b = t.team; newM.flag_b = t.flag; }
      } else {
        const r = resolveTeamStr(m.team_b);
        if (r) { newM.team_b = r.team; newM.flag_b = r.flag; }
      }
      return newM;
    }
    return m;
  });

  // Now sequential knockout resolving
  const resolveKnockoutTeam = (str, matchesSoFar) => {
    const rx = /(Ganador|Perdedor) Partido (\d+)/i;
    const parsed = str.match(rx);
    if (parsed) {
      const isLoser = parsed[1].toLowerCase() === 'perdedor';
      const matchNum = parseInt(parsed[2]);
      
      const targetMatch = matchesSoFar.find(x => x.match_number === matchNum);
      if (targetMatch) {
        const res = simResults[targetMatch.id];
        if (res) {
          const winnerIsA = res.score_a > res.score_b;
          if ((winnerIsA && !isLoser) || (!winnerIsA && isLoser)) {
            return { team: targetMatch.team_a, flag: targetMatch.flag_a };
          } else if ((!winnerIsA && !isLoser) || (winnerIsA && isLoser)) {
            return { team: targetMatch.team_b, flag: targetMatch.flag_b };
          }
        }
      }
    }
    return { team: str, flag: '' };
  };

  // We must resolve sequentially: R16 -> QF -> SF -> Third/Final
  const phasesOrder = ['round_of_16', 'quarterfinals', 'semifinals', 'third_place', 'final'];
  
  for (const phase of phasesOrder) {
    computedMatches = computedMatches.map(m => {
      if (m.phase === phase) {
        const newM = { ...m };
        
        const rA = resolveKnockoutTeam(m.team_a, computedMatches);
        // Only override if we effectively resolved it to a new team name, NOT if it's the same string
        if (rA.team !== m.team_a) {
          newM.team_a = rA.team;
          newM.flag_a = rA.flag;
        }

        const rB = resolveKnockoutTeam(m.team_b, computedMatches);
        if (rB.team !== m.team_b) {
          newM.team_b = rB.team;
          newM.flag_b = rB.flag;
        }

        return newM;
      }
      return m;
    });
  }

  return computedMatches;
}
