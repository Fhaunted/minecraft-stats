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
    time_since_rest: { label: 'Temps Sans Dormir', unit: 'time', key: 'time_since_rest' },
    total_mined: { label: 'Total Miné', unit: 'num', key: 'total_mined' },
    mined_diamond: { label: 'Diamants Minés', unit: 'num', key: 'mined_diamond' },
    mined_debris: { label: 'Débris Antiques', unit: 'num', key: 'mined_debris' },
    mined_emerald: { label: 'Émeraudes', unit: 'num', key: 'mined_emerald' },
    mined_gold: { label: 'Or Miné', unit: 'num', key: 'mined_gold' },
    mined_iron: { label: 'Fer Miné', unit: 'num', key: 'mined_iron' },
    mined_copper: { label: 'Cuivre Miné', unit: 'num', key: 'mined_copper' },
    mined_lapis: { label: 'Lapis-Lazuli', unit: 'num', key: 'mined_lapis' },
    mined_redstone: { label: 'Redstone Minée', unit: 'num', key: 'mined_redstone' },
    mined_coal: { label: 'Charbon Miné', unit: 'num', key: 'mined_coal' },
    mined_stone: { label: 'Pierre & Abîme', unit: 'num', key: 'mined_stone' },
    mined_obsidian: { label: 'Obsidienne', unit: 'num', key: 'mined_obsidian' },
    mined_wood: { label: 'Bois Coupé', unit: 'num', key: 'mined_wood' },
    totem_popped: { label: 'Totems Utilisés (Pop)', unit: 'num', key: 'totem_popped' },
    golden_apple: { label: 'Pommes Dorées', unit: 'num', key: 'golden_apple' },
    enchanted_golden_apple: { label: 'Pommes Cheat (Notch)', unit: 'num', key: 'enchanted_golden_apple' },
    ender_pearl: { label: 'Perles de l\'Ender', unit: 'num', key: 'ender_pearl' },
    mob_kills: { label: 'Mobs Tués', unit: 'num', key: 'mob_kills' },
    deaths: { label: 'Morts Total', unit: 'num', key: 'deaths' },
    player_kills: { label: 'Joueurs Tués', unit: 'num', key: 'player_kills' },
    damage_dealt: { label: 'Dégâts Infligés', unit: 'num', key: 'damage_dealt' },
    damage_taken: { label: 'Dégâts Subis', unit: 'num', key: 'damage_taken' },
    damage_resisted: { label: 'Dégâts Résistés', unit: 'num', key: 'damage_resisted' },
    damage_blocked: { label: 'Dégâts Parés', unit: 'num', key: 'damage_blocked' },
    distance_walked: { label: 'Distance Marche', unit: 'km', key: 'distance_walked' },
    fly_one_cm: { label: 'Distance Vol', unit: 'km', key: 'fly_one_cm' },
    swim_one_cm: { label: 'Distance Nage', unit: 'km', key: 'swim_one_cm' },
    boat_one_cm: { label: 'Distance Bateau', unit: 'km', key: 'boat_one_cm' },
    horse_one_cm: { label: 'Distance Cheval', unit: 'km', key: 'horse_one_cm' },
    jump: { label: 'Sauts', unit: 'num', key: 'jump' },
    traded_with_villager: { label: 'Échanges Villageois', unit: 'num', key: 'traded_with_villager' },
    animals_bred: { label: 'Animaux Reproduits', unit: 'num', key: 'animals_bred' },
    fish_caught: { label: 'Poissons Pêchés', unit: 'num', key: 'fish_caught' },
    enchant_item: { label: 'Enchantements', unit: 'num', key: 'enchant_item' },
    total_crafted: { label: 'Items Craftés', unit: 'num', key: 'total_crafted' },
    total_picked_up: { label: 'Items Ramassés', unit: 'num', key: 'total_picked_up' },
    drop: { label: 'Items Jetés', unit: 'num', key: 'drop' }
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
    initComaData();
  }

  // 2. Extract and Process Player Stats
  function processRawData() {
    processedPlayers = STATS_DATA.map(item => {
      const uuid = item.uuid;
      const stats = item.stats || {};
      const custom = stats['minecraft:custom'] || {};
      const mined = stats['minecraft:mined'] || {};
      const killed = stats['minecraft:killed'] || {};
      const used = stats['minecraft:used'] || {};
      const crafted = stats['minecraft:crafted'] || {};
      const picked_up = stats['minecraft:picked_up'] || {};

      // Play time & survival
      const play_time = custom['minecraft:play_time'] || 0;
      const leave_game = custom['minecraft:leave_game'] || 0;
      const time_since_death = custom['minecraft:time_since_death'] || 0;
      const time_since_rest = custom['minecraft:time_since_rest'] || 0;

      // Used Items
      const totem_popped = used['minecraft:totem_of_undying'] || 0;
      const golden_apple = used['minecraft:golden_apple'] || 0;
      const enchanted_golden_apple = used['minecraft:enchanted_golden_apple'] || 0;
      const ender_pearl = used['minecraft:ender_pearl'] || 0;

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
      const mined_copper = (mined['minecraft:copper_ore'] || 0) + (mined['minecraft:deepslate_copper_ore'] || 0);
      const mined_lapis = (mined['minecraft:lapis_ore'] || 0) + (mined['minecraft:deepslate_lapis_ore'] || 0);
      const mined_redstone = (mined['minecraft:redstone_ore'] || 0) + (mined['minecraft:deepslate_redstone_ore'] || 0);
      const mined_coal = (mined['minecraft:coal_ore'] || 0) + (mined['minecraft:deepslate_coal_ore'] || 0);
      const mined_stone = (mined['minecraft:stone'] || 0) + (mined['minecraft:deepslate'] || 0) + (mined['minecraft:cobblestone'] || 0);
      const mined_obsidian = mined['minecraft:obsidian'] || 0;

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
      const damage_resisted = custom['minecraft:damage_resisted'] || 0;
      const damage_blocked = custom['minecraft:damage_blocked_by_shield'] || 0;

      // Distance (cm to km)
      const walk_one_cm = custom['minecraft:walk_one_cm'] || 0;
      const sprint_one_cm = custom['minecraft:sprint_one_cm'] || 0;
      const crouch_one_cm = custom['minecraft:crouch_one_cm'] || 0;
      const distance_walked = Number(((walk_one_cm + sprint_one_cm + crouch_one_cm) / 100000).toFixed(2));
      const fly_one_cm = Number(((custom['minecraft:fly_one_cm'] || 0) / 100000).toFixed(2));
      const swim_one_cm = Number(((custom['minecraft:swim_one_cm'] || 0) / 100000).toFixed(2));
      const boat_one_cm = Number(((custom['minecraft:boat_one_cm'] || 0) / 100000).toFixed(2));
      const horse_one_cm = Number(((custom['minecraft:horse_one_cm'] || 0) / 100000).toFixed(2));

      // Other stats
      const jump = custom['minecraft:jump'] || 0;
      const drop = custom['minecraft:drop'] || 0;
      const traded_with_villager = custom['minecraft:traded_with_villager'] || 0;
      const animals_bred = custom['minecraft:animals_bred'] || 0;
      const fish_caught = custom['minecraft:fish_caught'] || 0;
      const enchant_item = custom['minecraft:enchant_item'] || 0;

      // Crafted & Picked up total sums
      let total_crafted = 0;
      for (const k in crafted) total_crafted += crafted[k] || 0;

      let total_picked_up = 0;
      for (const k in picked_up) total_picked_up += picked_up[k] || 0;

      // Default name fallback
      const cachedName = usernameCache[uuid];
      const name = item.name || cachedName || `Player_${uuid.substring(0, 5)}`;

      return {
        uuid,
        name,
        rawStats: stats,
        metrics: {
          play_time,
          leave_game,
          time_since_death,
          time_since_rest,
          totem_popped,
          golden_apple,
          enchanted_golden_apple,
          ender_pearl,
          total_mined,
          mined_diamond,
          mined_debris,
          mined_emerald,
          mined_gold,
          mined_iron,
          mined_copper,
          mined_lapis,
          mined_redstone,
          mined_coal,
          mined_stone,
          mined_obsidian,
          mined_wood,
          mob_kills,
          deaths,
          player_kills,
          damage_dealt,
          damage_taken,
          damage_resisted,
          damage_blocked,
          distance_walked,
          fly_one_cm,
          swim_one_cm,
          boat_one_cm,
          horse_one_cm,
          jump,
          traded_with_villager,
          animals_bred,
          fish_caught,
          enchant_item,
          total_crafted,
          total_picked_up,
          drop
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
    let sumTotems = 0;
    let sumKills = 0;

    processedPlayers.forEach(p => {
      sumPlaytime += p.metrics.play_time;
      sumMined += p.metrics.total_mined;
      sumDiamonds += p.metrics.mined_diamond;
      sumTotems += p.metrics.totem_popped;
      sumKills += p.metrics.mob_kills;
    });

    const setElText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setElText('server-status-text', `${processedPlayers.length} Joueurs Enregistrés`);
    setElText('total-playtime', formatPlaytime(sumPlaytime));
    setElText('avg-playtime', formatPlaytime(Math.round(sumPlaytime / totalCount)));
    setElText('total-mined', formatNumber(sumMined));
    setElText('avg-mined', formatNumber(Math.round(sumMined / totalCount)));
    setElText('total-diamonds', formatNumber(sumDiamonds));
    setElText('avg-diamonds', formatNumber(Math.round(sumDiamonds / totalCount)));
    setElText('total-totems', formatNumber(sumTotems));
    setElText('avg-totems', formatNumber(Math.round(sumTotems / totalCount)));
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
    combatList.innerHTML = `
      <div class="resource-item" style="border: 1px solid rgba(255, 215, 0, 0.3); background: rgba(255, 215, 0, 0.08);">
        <span class="resource-name" style="font-weight:700;">🔮 Totems Utilisés (Pop)</span>
        <span class="resource-count" style="color:#ffd700; font-weight:800;">${formatNumber(player.metrics.totem_popped)}</span>
      </div>
    `;
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

    // Populate Player Coma History
    const comaCount = getPlayerComaCount(player.name);
    document.getElementById('m-coma-total').textContent = formatNumber(comaCount);
    document.getElementById('modal-coma-count').textContent = comaCount;

    const comaList = document.getElementById('modal-coma-list');
    if (comaCount > 0) {
      const playerComaEvents = getPlayerComaEvents(player.name);
      comaList.innerHTML = '';
      playerComaEvents.slice(0, 30).forEach(ev => {
        comaList.innerHTML += `
          <div class="resource-item">
            <span class="resource-name">${ev.date} ${ev.time}</span>
            <span class="resource-count" style="color: #ff4757;">${escapeHtml(ev.cause)}</span>
          </div>
        `;
      });
      if (playerComaEvents.length > 30) {
        comaList.innerHTML += `<div class="resource-item"><span class="resource-name" style="color:var(--text-dim);">...et ${playerComaEvents.length - 30} de plus</span></div>`;
      }
    } else {
      comaList.innerHTML = `<div class="resource-item"><span class="resource-name">Aucun coma enregistré 🎉</span></div>`;
    }

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

    // =========================================
    // VIEW SWITCHER: Stats vs Coma Logs
    // =========================================
    document.getElementById('view-tab-stats').addEventListener('click', () => {
      document.getElementById('view-tab-stats').classList.add('active');
      document.getElementById('view-tab-coma').classList.remove('active');
      document.getElementById('stats-view-section').classList.remove('hidden');
      document.getElementById('coma-view-section').classList.add('hidden');
      document.getElementById('stats-overview').style.display = '';
    });

    document.getElementById('view-tab-coma').addEventListener('click', () => {
      document.getElementById('view-tab-coma').classList.add('active');
      document.getElementById('view-tab-stats').classList.remove('active');
      document.getElementById('coma-view-section').classList.remove('hidden');
      document.getElementById('stats-view-section').classList.add('hidden');
      document.getElementById('stats-overview').style.display = 'none';
      updateComaTable();
    });

    // =========================================
    // COMA VIEW: Sub-Tabs & Controls
    // =========================================
    document.querySelectorAll('[data-coma-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-coma-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        comaMode = btn.getAttribute('data-coma-mode');
        comaPage = 1;

        // Toggle feed filters visibility
        const feedFilters = document.getElementById('coma-feed-filters');
        if (feedFilters) {
          feedFilters.style.display = comaMode === 'feed' ? 'flex' : 'flex';
        }

        updateComaTable();
      });
    });

    document.getElementById('coma-search').addEventListener('input', () => {
      comaPage = 1;
      updateComaTable();
    });

    document.getElementById('coma-category-filter').addEventListener('change', () => {
      comaPage = 1;
      updateComaTable();
    });

    document.getElementById('coma-sort-order').addEventListener('change', () => {
      comaPage = 1;
      updateComaTable();
    });

    document.getElementById('coma-btn-prev').addEventListener('click', () => {
      if (comaPage > 1) {
        comaPage--;
        updateComaTable();
      }
    });

    document.getElementById('coma-btn-next').addEventListener('click', () => {
      let maxItems = 0;
      if (comaMode === 'attackers') maxItems = filteredComaAttackers.length;
      else if (comaMode === 'victims') maxItems = filteredComaVictims.length;
      else maxItems = filteredComaEvents.length;

      const totalPages = Math.ceil(maxItems / comaPageSize) || 1;
      if (comaPage < totalPages) {
        comaPage++;
        updateComaTable();
      }
    });
  }

  function closeModal() {
    document.getElementById('player-modal').classList.add('hidden');
  }

  // =========================================
  // 8. COMA LOGS & RANKINGS ENGINE
  // =========================================
  let comaMode = 'attackers'; // 'attackers', 'victims', 'feed'
  let comaPage = 1;
  const comaPageSize = 25;
  let filteredComaEvents = [];
  let filteredComaAttackers = [];
  let filteredComaVictims = [];

  function initComaData() {
    if (typeof COMA_DATA === 'undefined') return;

    const totalEl = document.getElementById('total-coma-pill');
    if (totalEl) totalEl.textContent = formatNumber(COMA_DATA.totalEvents);

    const cardEl = document.getElementById('total-comas-card');
    if (cardEl) cardEl.textContent = formatNumber(COMA_DATA.totalEvents);
  }

  function updateComaTable() {
    if (typeof COMA_DATA === 'undefined') return;

    const search = document.getElementById('coma-search').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('coma-category-filter').value;
    const sortOrder = document.getElementById('coma-sort-order').value;

    const thead = document.getElementById('coma-table-head');
    const tbody = document.getElementById('coma-table-body');
    const modeTitle = document.getElementById('coma-mode-title');

    tbody.innerHTML = '';

    // MODE 1: ATTACKERS (BOURREAUX PvP)
    if (comaMode === 'attackers') {
      if (modeTitle) modeTitle.textContent = "Classement Complet des Bourreaux PvP";

      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">#</th>
          <th class="col-player">Joueur (Bourreau PvP)</th>
          <th>Comas Infligés</th>
          <th>% du total PvP</th>
          <th>Action</th>
        </tr>
      `;

      filteredComaAttackers = (COMA_DATA.topAttackers || []).filter(item => {
        if (search && !item.name.toLowerCase().includes(search)) return false;
        return true;
      });

      if (sortOrder === 'oldest') {
        filteredComaAttackers.sort((a, b) => a.count - b.count);
      } else {
        filteredComaAttackers.sort((a, b) => b.count - a.count);
      }

      const totalPages = Math.ceil(filteredComaAttackers.length / comaPageSize) || 1;
      if (comaPage > totalPages) comaPage = totalPages;
      if (comaPage < 1) comaPage = 1;

      const start = (comaPage - 1) * comaPageSize;
      const pageItems = filteredComaAttackers.slice(start, start + comaPageSize);

      document.getElementById('coma-showing-count').textContent = filteredComaAttackers.length;
      document.getElementById('coma-page-indicator').textContent = `Page ${comaPage} / ${totalPages}`;
      document.getElementById('coma-btn-prev').disabled = comaPage <= 1;
      document.getElementById('coma-btn-next').disabled = comaPage >= totalPages;

      if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Aucun bourreau trouvé.</td></tr>`;
        return;
      }

      const totalPvpComas = filteredComaAttackers.reduce((acc, curr) => acc + curr.count, 0) || 1;

      pageItems.forEach((item, idx) => {
        const rank = start + idx + 1;
        let rankBadge = 'rank-other';
        if (rank === 1) rankBadge = 'rank-1';
        else if (rank === 2) rankBadge = 'rank-2';
        else if (rank === 3) rankBadge = 'rank-3';

        const pct = ((item.count / totalPvpComas) * 100).toFixed(1);
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td style="text-align:center;">
            <span class="rank-badge ${rankBadge}">${rank}</span>
          </td>
          <td>
            <div class="player-cell">
              <img class="player-avatar" src="https://mc-heads.net/avatar/${escapeHtml(item.name)}/64" alt="" loading="lazy" onerror="this.src='https://crafatar.com/avatars/steve?size=64'" style="width:32px; height:32px;">
              <span class="player-name" style="font-weight: 700;">${escapeHtml(item.name)}</span>
            </div>
          </td>
          <td>
            <span style="color: #ff4757; font-weight: 800; font-family: var(--font-mono); font-size: 1.05rem;">⚔️ ${formatNumber(item.count)}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div style="width:80px; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:#ff4757;"></div>
              </div>
              <span style="font-size:0.85rem; color:var(--text-muted); font-family:var(--font-mono);">${pct}%</span>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-detail" onclick="document.getElementById('coma-search').value='${escapeHtml(item.name)}'; document.getElementById('coma-tab-feed').click();" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
              🔍 Voir Logs
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      return;
    }

    // MODE 2: VICTIMS (COMAS SUBIS)
    if (comaMode === 'victims') {
      if (modeTitle) modeTitle.textContent = "Classement Complet des Victimes (Comas Subis)";

      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">#</th>
          <th class="col-player">Joueur (Victime en Coma)</th>
          <th>Comas Subis</th>
          <th>% du total</th>
          <th>Action</th>
        </tr>
      `;

      filteredComaVictims = (COMA_DATA.topVictims || []).filter(item => {
        if (search && !item.name.toLowerCase().includes(search)) return false;
        return true;
      });

      if (sortOrder === 'oldest') {
        filteredComaVictims.sort((a, b) => a.count - b.count);
      } else {
        filteredComaVictims.sort((a, b) => b.count - a.count);
      }

      const totalPages = Math.ceil(filteredComaVictims.length / comaPageSize) || 1;
      if (comaPage > totalPages) comaPage = totalPages;
      if (comaPage < 1) comaPage = 1;

      const start = (comaPage - 1) * comaPageSize;
      const pageItems = filteredComaVictims.slice(start, start + comaPageSize);

      document.getElementById('coma-showing-count').textContent = filteredComaVictims.length;
      document.getElementById('coma-page-indicator').textContent = `Page ${comaPage} / ${totalPages}`;
      document.getElementById('coma-btn-prev').disabled = comaPage <= 1;
      document.getElementById('coma-btn-next').disabled = comaPage >= totalPages;

      if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Aucune victime trouvée.</td></tr>`;
        return;
      }

      const totalComaEvents = COMA_DATA.totalEvents || 1;

      pageItems.forEach((item, idx) => {
        const rank = start + idx + 1;
        let rankBadge = 'rank-other';
        if (rank === 1) rankBadge = 'rank-1';
        else if (rank === 2) rankBadge = 'rank-2';
        else if (rank === 3) rankBadge = 'rank-3';

        const pct = ((item.count / totalComaEvents) * 100).toFixed(1);
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td style="text-align:center;">
            <span class="rank-badge ${rankBadge}">${rank}</span>
          </td>
          <td>
            <div class="player-cell">
              <img class="player-avatar" src="https://mc-heads.net/avatar/${escapeHtml(item.name)}/64" alt="" loading="lazy" onerror="this.src='https://crafatar.com/avatars/steve?size=64'" style="width:32px; height:32px;">
              <span class="player-name" style="font-weight: 700;">${escapeHtml(item.name)}</span>
            </div>
          </td>
          <td>
            <span style="color: #ffa502; font-weight: 800; font-family: var(--font-mono); font-size: 1.05rem;">🤕 ${formatNumber(item.count)}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div style="width:80px; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:#ffa502;"></div>
              </div>
              <span style="font-size:0.85rem; color:var(--text-muted); font-family:var(--font-mono);">${pct}%</span>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-detail" onclick="document.getElementById('coma-search').value='${escapeHtml(item.name)}'; document.getElementById('coma-tab-feed').click();" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
              🔍 Voir Logs
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      return;
    }

    // MODE 3: CHRONOLOGICAL FEED (LOGS)
    if (modeTitle) modeTitle.textContent = "Journal Historique Chronologique";

    thead.innerHTML = `
      <tr>
        <th style="width: 70px;">#</th>
        <th style="width: 180px;">Date & Heure</th>
        <th class="col-player">Joueur en Coma</th>
        <th>Cause / Attaquant</th>
        <th style="width: 160px;">Catégorie</th>
      </tr>
    `;

    filteredComaEvents = COMA_DATA.events.filter(ev => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      if (search) {
        const victimMatch = ev.victim.toLowerCase().includes(search);
        const causeMatch = ev.cause.toLowerCase().includes(search);
        if (!victimMatch && !causeMatch) return false;
      }
      return true;
    });

    if (sortOrder === 'oldest') {
      filteredComaEvents.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    } else {
      filteredComaEvents.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
    }

    const totalPages = Math.ceil(filteredComaEvents.length / comaPageSize) || 1;
    if (comaPage > totalPages) comaPage = totalPages;
    if (comaPage < 1) comaPage = 1;

    const start = (comaPage - 1) * comaPageSize;
    const pageEvents = filteredComaEvents.slice(start, start + comaPageSize);

    document.getElementById('coma-showing-count').textContent = filteredComaEvents.length;
    document.getElementById('coma-page-indicator').textContent = `Page ${comaPage} / ${totalPages}`;
    document.getElementById('coma-btn-prev').disabled = comaPage <= 1;
    document.getElementById('coma-btn-next').disabled = comaPage >= totalPages;

    if (pageEvents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Aucun événement de coma trouvé.</td></tr>`;
      return;
    }

    pageEvents.forEach((ev, idx) => {
      const globalIdx = start + idx + 1;
      const tr = document.createElement('tr');

      let catColor = 'var(--text-muted)';
      let catIcon = '🌧️';
      if (ev.category === 'PvP (Joueur)') { catColor = '#ff4757'; catIcon = '⚔️'; }
      else if (ev.category === 'Mob / Entité') { catColor = '#ffa502'; catIcon = '🧟'; }
      else if (ev.category === 'Chute') { catColor = '#ff6348'; catIcon = '🪵'; }
      else if (ev.category === 'Noyade') { catColor = '#1e90ff'; catIcon = '🌊'; }
      else if (ev.category === 'Lave / Feu') { catColor = '#ff4500'; catIcon = '🔥'; }

      tr.innerHTML = `
        <td style="text-align:center;">
          <span class="rank-badge rank-other">${globalIdx}</span>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(ev.date)}</span><br>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">${escapeHtml(ev.time)}</span>
        </td>
        <td>
          <div class="player-cell">
            <img class="player-avatar" src="https://mc-heads.net/avatar/${escapeHtml(ev.victim)}/64" alt="" loading="lazy" onerror="this.src='https://crafatar.com/avatars/steve?size=64'" style="width:32px; height:32px;">
            <span class="player-name" style="font-weight: 700;">${escapeHtml(ev.victim)}</span>
          </div>
        </td>
        <td style="color: var(--text-main); font-size: 0.9rem;">${escapeHtml(ev.cause)}</td>
        <td>
          <span style="
            display: inline-flex; align-items: center; gap: 0.4rem;
            background: ${catColor}22; color: ${catColor};
            border: 1px solid ${catColor}44;
            padding: 0.25rem 0.7rem; border-radius: 50px;
            font-size: 0.8rem; font-weight: 600;
          ">${catIcon} ${escapeHtml(ev.category)}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Get coma events for a specific player name
  function getPlayerComaEvents(playerName) {
    if (typeof COMA_DATA === 'undefined') return [];
    return COMA_DATA.events.filter(ev =>
      ev.victim.toLowerCase() === playerName.toLowerCase()
    );
  }

  function getPlayerComaCount(playerName) {
    if (typeof COMA_DATA === 'undefined' || !COMA_DATA.playerComaCounts) return 0;
    return COMA_DATA.playerComaCounts[playerName] || 0;
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
