// ============================================================
// MINECRAFT STATS VIEWER - ENGINE & LOGIC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let processedPlayers = [];
  let filteredPlayers = [];
  let currentPage = 1;
  const pageSize = 20;

  // Cached Usernames
  const usernameCache = JSON.parse(localStorage.getItem('mc_usernames') || '{}');

  // Core Category Configs & Labels
  const STAT_CONFIG = {
    play_time: { label: 'Temps de jeu', unit: 'time', key: 'play_time' },
    leave_game: { label: 'Connexions', unit: 'num', key: 'leave_game' },
    time_since_death: { label: 'Survie Actuelle', unit: 'time', key: 'time_since_death' },
    total_mined: { label: 'Total Miné', unit: 'num', key: 'total_mined' },
    mined_diamond: { label: 'Diamants Minés', unit: 'num', key: 'mined_diamond' },
    mined_debris: { label: 'Débris Antiques', unit: 'num', key: 'mined_debris' },
    mined_emerald: { label: 'Émeraudes', unit: 'num', key: 'mined_emerald' },
    mined_gold: { label: 'Or Miné', unit: 'num', key: 'mined_gold' },
    mined_iron: { label: 'Fer Miné', unit: 'num', key: 'mined_iron' },
    mined_stone: { label: 'Pierre & Abîme', unit: 'num', key: 'mined_stone' },
    mined_wood: { label: 'Bois Coupé', unit: 'num', key: 'mined_wood' },
    mob_kills: { label: 'Mobs Tués', unit: 'num', key: 'mob_kills' },
    deaths: { label: 'Morts', unit: 'num', key: 'deaths' },
    player_kills: { label: 'Joueurs Tués', unit: 'num', key: 'player_kills' },
    damage_dealt: { label: 'Dégâts Infligés', unit: 'num', key: 'damage_dealt' },
    damage_taken: { label: 'Dégâts Subis', unit: 'num', key: 'damage_taken' },
    distance_walked: { label: 'Distance Marche', unit: 'km', key: 'distance_walked' },
    fly_one_cm: { label: 'Distance Vol', unit: 'km', key: 'fly_one_cm' },
    jump: { label: 'Sauts', unit: 'num', key: 'jump' },
    traded_with_villager: { label: 'Échanges Villageois', unit: 'num', key: 'traded_with_villager' },
    animals_bred: { label: 'Animaux Reproduits', unit: 'num', key: 'animals_bred' },
    fish_caught: { label: 'Poissons Pêchés', unit: 'num', key: 'fish_caught' },
    enchant_item: { label: 'Enchantements', unit: 'num', key: 'enchant_item' }
  };

  // 1. Initialize Application
  init();

  function init() {
    if (typeof STATS_DATA === 'undefined' || !Array.isArray(STATS_DATA)) {
      alert("Erreur: Impossible de charger data.js");
      return;
    }

    processRawData();
    calculateServerOverview();
    setupEventListeners();
    updateLeaderboard();
  }

  // 2. Extract and Process Player Stats
  function processRawData() {
    processedPlayers = STATS_DATA.map(item => {
      const uuid = item.uuid;
      const stats = item.stats || {};
      const custom = stats['minecraft:custom'] || {};
      const mined = stats['minecraft:mined'] || {};
      const killed = stats['minecraft:killed'] || {};

      // Play time (ticks)
      const play_time = custom['minecraft:play_time'] || 0;

      // Sum all mined blocks
      let total_mined = 0;
      for (const key in mined) {
        total_mined += mined[key] || 0;
      }

      // Specific blocks
      const mined_diamond = (mined['minecraft:diamond_ore'] || 0) + (mined['minecraft:deepslate_diamond_ore'] || 0);
      const mined_debris = mined['minecraft:ancient_debris'] || 0;
      const mined_emerald = (mined['minecraft:emerald_ore'] || 0) + (mined['minecraft:deepslate_emerald_ore'] || 0);
      const mined_gold = (mined['minecraft:gold_ore'] || 0) + (mined['minecraft:deepslate_gold_ore'] || 0);
      const mined_iron = (mined['minecraft:iron_ore'] || 0) + (mined['minecraft:deepslate_iron_ore'] || 0);
      const mined_stone = (mined['minecraft:stone'] || 0) + (mined['minecraft:deepslate'] || 0) + (mined['minecraft:cobblestone'] || 0);

      // Wood logs sum
      let mined_wood = 0;
      for (const k in mined) {
        if (k.endsWith('_log') || k.endsWith('_stem')) {
          mined_wood += mined[k];
        }
      }

      // Combat stats
      const mob_kills = custom['minecraft:mob_kills'] || 0;
      const deaths = custom['minecraft:deaths'] || 0;
      const player_kills = custom['minecraft:player_kills'] || 0;
      const damage_dealt = custom['minecraft:damage_dealt'] || 0;
      const damage_taken = custom['minecraft:damage_taken'] || 0;

      // Distance (cm to km)
      const walk_one_cm = custom['minecraft:walk_one_cm'] || 0;
      const sprint_one_cm = custom['minecraft:sprint_one_cm'] || 0;
      const crouch_one_cm = custom['minecraft:crouch_one_cm'] || 0;
      const distance_walked = Number(((walk_one_cm + sprint_one_cm + crouch_one_cm) / 100000).toFixed(2));
      const fly_one_cm = Number(((custom['minecraft:fly_one_cm'] || 0) / 100000).toFixed(2));

      // Other stats
      const leave_game = custom['minecraft:leave_game'] || 0;
      const time_since_death = custom['minecraft:time_since_death'] || 0;
      const jump = custom['minecraft:jump'] || 0;
      const traded_with_villager = custom['minecraft:traded_with_villager'] || 0;
      const animals_bred = custom['minecraft:animals_bred'] || 0;
      const fish_caught = custom['minecraft:fish_caught'] || 0;
      const enchant_item = custom['minecraft:enchant_item'] || 0;

      // Default name fallback
      const cachedName = usernameCache[uuid];
      const name = item.name || cachedName || `Player_${uuid.substring(0, 5)}`;

      return {
        uuid,
        name,
        rawStats: stats,
        metrics: {
          play_time,
          total_mined,
          mined_diamond,
          mined_debris,
          mined_emerald,
          mined_gold,
          mined_iron,
          mined_stone,
          mined_wood,
          mob_kills,
          deaths,
          player_kills,
          damage_dealt,
          damage_taken,
          distance_walked,
          fly_one_cm,
          jump,
          traded_with_villager,
          animals_bred,
          fish_caught,
          enchant_item,
          leave_game,
          time_since_death
        }
      };
    });
  }

  // 3. Compute Server Averages & Totals
  function calculateServerOverview() {
    const activePlayers = processedPlayers.filter(p => p.metrics.play_time > 12000); // > 10 min
    const totalCount = activePlayers.length || 1;

    let sumPlaytime = 0;
    let sumMined = 0;
    let sumDiamonds = 0;
    let sumKills = 0;

    processedPlayers.forEach(p => {
      sumPlaytime += p.metrics.play_time;
      sumMined += p.metrics.total_mined;
      sumDiamonds += p.metrics.mined_diamond;
      sumKills += p.metrics.mob_kills;
    });

    document.getElementById('server-status-text').textContent = `${processedPlayers.length} Joueurs Enregistrés`;
    document.getElementById('total-playtime').textContent = formatPlaytime(sumPlaytime);
    document.getElementById('avg-playtime').textContent = formatPlaytime(Math.round(sumPlaytime / totalCount));

    document.getElementById('total-mined').textContent = formatNumber(sumMined);
    document.getElementById('avg-mined').textContent = formatNumber(Math.round(sumMined / totalCount));

    document.getElementById('total-diamonds').textContent = formatNumber(sumDiamonds);
    document.getElementById('avg-diamonds').textContent = formatNumber(Math.round(sumDiamonds / totalCount));

    document.getElementById('total-kills').textContent = formatNumber(sumKills);
    document.getElementById('avg-kills').textContent = formatNumber(Math.round(sumKills / totalCount));
  }

  // 4. Update & Render Leaderboard Table
  function updateLeaderboard() {
    const categoryKey = document.getElementById('sort-category').value;
    const sortOrder = document.getElementById('sort-order').value;
    const filterActive = document.getElementById('filter-active-only').checked;
    const searchQuery = document.getElementById('player-search').value.toLowerCase().trim();

    // 1. Filter
    filteredPlayers = processedPlayers.filter(player => {
      if (filterActive && player.metrics.play_time < 12000) return false;
      if (searchQuery) {
        const nameMatch = player.name.toLowerCase().includes(searchQuery);
        const uuidMatch = player.uuid.toLowerCase().includes(searchQuery);
        if (!nameMatch && !uuidMatch) return false;
      }
      return true;
    });

    // 2. Sort
    filteredPlayers.sort((a, b) => {
      const valA = a.metrics[categoryKey] || 0;
      const valB = b.metrics[categoryKey] || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    // 3. Update Category Average Indicator
    const catConfig = STAT_CONFIG[categoryKey] || { label: 'Statistique', unit: 'num' };
    document.getElementById('table-stat-title').textContent = catConfig.label;

    let catSum = 0;
    filteredPlayers.forEach(p => { catSum += (p.metrics[categoryKey] || 0); });
    const catAvg = filteredPlayers.length > 0 ? catSum / filteredPlayers.length : 0;
    
    document.getElementById('current-stat-avg').textContent = formatStatValue(catAvg, catConfig.unit);
    document.getElementById('showing-count').textContent = filteredPlayers.length;
    document.getElementById('total-count').textContent = processedPlayers.length;

    // 4. Paginate
    const totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const pagePlayers = filteredPlayers.slice(startIndex, startIndex + pageSize);

    // 5. Render Table Body
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    if (pagePlayers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--text-muted);">Aucun joueur ne correspond aux critères.</td></tr>`;
      return;
    }

    pagePlayers.forEach((player, idx) => {
      const globalRank = startIndex + idx + 1;
      const tr = document.createElement('tr');
      tr.setAttribute('data-uuid', player.uuid);

      // Rank Badge Class
      let rankBadgeClass = 'rank-other';
      if (globalRank === 1) rankBadgeClass = 'rank-1';
      else if (globalRank === 2) rankBadgeClass = 'rank-2';
      else if (globalRank === 3) rankBadgeClass = 'rank-3';

      // Current stat value & Diff vs Average
      const mainStatVal = player.metrics[categoryKey] || 0;
      const formattedMainStat = formatStatValue(mainStatVal, catConfig.unit);

      let diffBadge = '';
      if (catAvg > 0) {
        const pctDiff = Math.round(((mainStatVal - catAvg) / catAvg) * 100);
        const sign = pctDiff >= 0 ? '+' : '';
        const diffClass = pctDiff >= 0 ? 'diff-positive' : 'diff-negative';
        diffBadge = `<span class="diff-badge ${diffClass}">${sign}${pctDiff}%</span>`;
      } else {
        diffBadge = `<span class="diff-badge diff-positive">0%</span>`;
      }

      tr.innerHTML = `
        <td class="col-rank">
          <span class="rank-badge ${rankBadgeClass}">${globalRank}</span>
        </td>
        <td class="col-player">
          <div class="player-cell">
            <img class="player-avatar" src="https://mc-heads.net/avatar/${player.uuid}/64" alt="Skin" loading="lazy" onerror="this.src='https://crafatar.com/avatars/steve?size=64'">
            <div class="player-name-box">
              <span class="player-name name-target-${player.uuid}">${escapeHtml(player.name)}</span>
              <span class="player-uuid-sub">${player.uuid.substring(0, 8)}...</span>
            </div>
          </div>
        </td>
        <td class="col-main-stat">
          <span class="main-stat-val">${formattedMainStat}</span>
        </td>
        <td class="col-sub">
          <span class="sub-stat-val">${formatNumber(player.metrics.total_mined)}</span>
        </td>
        <td class="col-sub">
          <span class="sub-stat-val">💎 ${formatNumber(player.metrics.mined_diamond)}</span>
        </td>
        <td class="col-sub">
          <span class="sub-stat-val">⚔️ ${formatNumber(player.metrics.mob_kills)}</span>
        </td>
        <td class="col-sub">
          <span class="sub-stat-val">☠️ ${formatNumber(player.metrics.deaths)}</span>
        </td>
        <td class="col-diff">${diffBadge}</td>
        <td class="col-action">
          <button class="btn btn-detail" data-uuid="${player.uuid}">Voir Stats</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Update Pagination UI
    document.getElementById('page-indicator').textContent = `Page ${currentPage} / ${totalPages}`;
    document.getElementById('btn-prev-page').disabled = currentPage <= 1;
    document.getElementById('btn-next-page').disabled = currentPage >= totalPages;

    // LAZY LOAD: Resolve usernames ONLY for the currently displayed page of players!
    resolveVisiblePageUsernames(pagePlayers);
  }

  // 5. Open Player Detail Modal
  function openPlayerModal(uuid) {
    const player = processedPlayers.find(p => p.uuid === uuid);
    if (!player) return;

    // Header Info
    document.getElementById('modal-player-skin').src = `https://mc-heads.net/avatar/${player.uuid}/128`;
    document.getElementById('modal-player-name').textContent = player.name;
    document.getElementById('modal-player-uuid').textContent = player.uuid;

    // Player Badges
    const badgesBox = document.getElementById('modal-player-badges');
    badgesBox.innerHTML = '';
    
    if (player.metrics.play_time > 36000000) { // 500+ hours
      badgesBox.innerHTML += `<span class="badge-tag">👑 Vétéran</span>`;
    }
    if (player.metrics.mined_diamond > 200) {
      badgesBox.innerHTML += `<span class="badge-tag">💎 Diamantologue</span>`;
    }
    if (player.metrics.mob_kills > 5000) {
      badgesBox.innerHTML += `<span class="badge-tag">⚔️ Tueur de Mobs</span>`;
    }
    if (player.metrics.distance_walked > 500) {
      badgesBox.innerHTML += `<span class="badge-tag">🏃 Explorateur</span>`;
    }

    // Overview Tab Stats
    document.getElementById('m-playtime').textContent = formatPlaytime(player.metrics.play_time);
    document.getElementById('m-total-mined').textContent = formatNumber(player.metrics.total_mined);
    document.getElementById('m-diamonds').textContent = formatNumber(player.metrics.mined_diamond);
    document.getElementById('m-mobs').textContent = formatNumber(player.metrics.mob_kills);
    document.getElementById('m-deaths').textContent = formatNumber(player.metrics.deaths);
    document.getElementById('m-distance').textContent = `${player.metrics.distance_walked} km`;

    // Populate Mined List
    const minedList = document.getElementById('modal-mined-list');
    minedList.innerHTML = '';
    const minedStats = player.rawStats['minecraft:mined'] || {};
    const minedArray = Object.keys(minedStats).map(key => ({
      name: key.replace('minecraft:', '').replace(/_/g, ' '),
      count: minedStats[key]
    })).sort((a, b) => b.count - a.count);

    if (minedArray.length === 0) {
      minedList.innerHTML = `<div class="resource-item">Aucun bloc miné</div>`;
    } else {
      minedArray.slice(0, 18).forEach(item => {
        minedList.innerHTML += `
          <div class="resource-item">
            <span class="resource-name">${capitalizeFirst(item.name)}</span>
            <span class="resource-count">${formatNumber(item.count)}</span>
          </div>
        `;
      });
    }

    // Populate Mob Combat List
    const combatList = document.getElementById('modal-combat-list');
    combatList.innerHTML = '';
    const killedStats = player.rawStats['minecraft:killed'] || {};
    const killedArray = Object.keys(killedStats).map(key => ({
      name: key.replace('minecraft:', '').replace(/_/g, ' '),
      count: killedStats[key]
    })).sort((a, b) => b.count - a.count);

    if (killedArray.length === 0) {
      combatList.innerHTML = `<div class="resource-item">Aucun mob tué</div>`;
    } else {
      killedArray.forEach(item => {
        combatList.innerHTML += `
          <div class="resource-item">
            <span class="resource-name">${capitalizeFirst(item.name)}</span>
            <span class="resource-count">☠️ ${formatNumber(item.count)}</span>
          </div>
        `;
      });
    }

    // Populate Exploration List
    const expList = document.getElementById('modal-exploration-list');
    expList.innerHTML = `
      <div class="resource-item">
        <span class="resource-name">Distance Marche/Sprint</span>
        <span class="resource-count">${player.metrics.distance_walked} km</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Distance Vol Élytres</span>
        <span class="resource-count">${player.metrics.fly_one_cm} km</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Nombre de Sauts</span>
        <span class="resource-count">${formatNumber(player.metrics.jump)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Échanges avec Villageois</span>
        <span class="resource-count">${formatNumber(player.metrics.traded_with_villager)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Animaux Reproduits</span>
        <span class="resource-count">${formatNumber(player.metrics.animals_bred)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Poissons Pêchés</span>
        <span class="resource-count">${formatNumber(player.metrics.fish_caught)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Objets Enchantés</span>
        <span class="resource-count">${formatNumber(player.metrics.enchant_item)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Connexions au Serveur</span>
        <span class="resource-count">${formatNumber(player.metrics.leave_game)}</span>
      </div>
    `;

    document.getElementById('player-modal').classList.remove('hidden');
  }

  // 6. On-Demand / Lazy Load Username Resolver (Visible Page Only)
  async function resolveVisiblePageUsernames(visiblePlayers) {
    const unresolvable = visiblePlayers.filter(p => !p.name || p.name.startsWith('Player_'));
    if (unresolvable.length === 0) return;

    for (const player of unresolvable) {
      if (usernameCache[player.uuid]) {
        player.name = usernameCache[player.uuid];
        updatePlayerDomName(player.uuid, player.name);
        continue;
      }

      // Fetch on demand for this visible player
      const name = await fetchSingleUsername(player.uuid);
      if (name) {
        player.name = name;
        usernameCache[player.uuid] = name;
        localStorage.setItem('mc_usernames', JSON.stringify(usernameCache));
        updatePlayerDomName(player.uuid, name);
      }
    }
  }

  function updatePlayerDomName(uuid, name) {
    const el = document.querySelector(`.name-target-${uuid}`);
    if (el) el.textContent = name;
  }

  async function fetchSingleUsername(uuid) {
    const cleanUuid = uuid.replace(/-/g, '');
    
    // 1. Try PlayerDB API
    try {
      const res = await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.player && data.data.player.username) {
          return data.data.player.username;
        }
      }
    } catch (e) {}

    // 2. Try Mojang Session API
    try {
      const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) return data.name;
      }
    } catch (e) {}

    // 3. Try Ashcon API
    try {
      const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${uuid}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.username) return data.username;
      }
    } catch (e) {}

    return null;
  }

  // 7. Event Listeners Setup
  function setupEventListeners() {
    document.getElementById('sort-category').addEventListener('change', () => {
      currentPage = 1;
      updateLeaderboard();
    });

    document.getElementById('sort-order').addEventListener('change', () => {
      currentPage = 1;
      updateLeaderboard();
    });

    document.getElementById('filter-active-only').addEventListener('change', () => {
      currentPage = 1;
      updateLeaderboard();
    });

    document.getElementById('player-search').addEventListener('input', () => {
      currentPage = 1;
      updateLeaderboard();
    });

    document.getElementById('btn-prev-page').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updateLeaderboard();
      }
    });

    document.getElementById('btn-next-page').addEventListener('click', () => {
      const totalPages = Math.ceil(filteredPlayers.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        updateLeaderboard();
      }
    });

    // Delegate click for "Voir Stats" buttons
    document.getElementById('leaderboard-body').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-detail');
      if (btn) {
        const uuid = btn.getAttribute('data-uuid');
        openPlayerModal(uuid);
      }
    });

    // Modal Close Button & Backdrop Click
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('player-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
      }
    });

    // Modal Tabs Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }

  function closeModal() {
    document.getElementById('player-modal').classList.add('hidden');
  }

  // Helper Utility Functions
  function formatPlaytime(ticks) {
    if (!ticks || ticks <= 0) return '0h';
    const totalSeconds = Math.floor(ticks / 20);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours >= 24) {
      const days = (hours / 24).toFixed(1);
      return `${days}j (${hours}h)`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatStatValue(val, unit) {
    if (unit === 'time') return formatPlaytime(val);
    if (unit === 'km') return `${val.toFixed(1)} km`;
    return formatNumber(Math.round(val));
  }

  function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('fr-FR');
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
