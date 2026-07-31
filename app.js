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
    golden_apple: { label: 'Pommes Dorées', unit: 'num', key: 'golden_apple' },
    enchanted_golden_apple: { label: 'Pommes Cheat', unit: 'num', key: 'enchanted_golden_apple' },
    ender_pearl: { label: 'Perles de l\'Ender', unit: 'num', key: 'ender_pearl' },
    mob_kills: { label: 'Mobs Tués', unit: 'num', key: 'mob_kills' },
    deaths: { label: 'Morts Total', unit: 'num', key: 'deaths' },
    player_kills: { label: 'Joueurs Tués', unit: 'num', key: 'player_kills' },
    coma_received_count: { label: 'Mis en coma', unit: 'num', key: 'coma_received_count' },
    coma_given_count: { label: 'A mis en coma', unit: 'num', key: 'coma_given_count' },
    damage_dealt: { label: 'Dégâts Infligés', unit: 'num', key: 'damage_dealt' },
    damage_taken: { label: 'Dégâts Subis', unit: 'num', key: 'damage_taken' },
    damage_resisted: { label: 'Dégâts Résistés', unit: 'num', key: 'damage_resisted' },
    damage_blocked: { label: 'Dégâts Parés', unit: 'num', key: 'damage_blocked' },
    used_sword: { label: 'Coups d\'Épée', unit: 'num', key: 'used_sword' },
    used_mace: { label: 'Coups de Masse', unit: 'num', key: 'used_mace' },
    used_axe: { label: 'Coups de Hache', unit: 'num', key: 'used_axe' },
    used_bow: { label: 'Tirs Arc / Arbalète', unit: 'num', key: 'used_bow' },
    used_trident: { label: 'Lancers Trident', unit: 'num', key: 'used_trident' },
    used_shield: { label: 'Parades Bouclier', unit: 'num', key: 'used_shield' },
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

  // Modern Category & Sub-chips Engine
  const CATEGORY_GROUPS = {
    time: {
      label: 'Temps & Survie',
      items: [
        { key: 'play_time', label: 'Temps de Jeu' },
        { key: 'leave_game', label: 'Connexions' },
        { key: 'time_since_death', label: 'Survie Actuelle' },
        { key: 'time_since_rest', label: 'Temps Sans Dormir' }
      ]
    },
    mining: {
      label: 'Minage & Minerais',
      items: [
        { key: 'total_mined', label: 'Total Miné' },
        { key: 'mined_diamond', label: 'Diamants' },
        { key: 'mined_debris', label: 'Netherite' },
        { key: 'mined_emerald', label: 'Émeraudes' },
        { key: 'mined_gold', label: 'Or' },
        { key: 'mined_iron', label: 'Fer' },
        { key: 'mined_copper', label: 'Cuivre' },
        { key: 'mined_lapis', label: 'Lapis-Lazuli' },
        { key: 'mined_redstone', label: 'Redstone' },
        { key: 'mined_coal', label: 'Charbon' },
        { key: 'mined_stone', label: 'Pierre & Abîme' },
        { key: 'mined_obsidian', label: 'Obsidienne' },
        { key: 'mined_wood', label: 'Bois Coupé' }
      ]
    },
    combat: {
      label: 'Combat & Armes',
      items: [
        { key: 'damage_dealt', label: 'Dégâts Infligés' },
        { key: 'damage_taken', label: 'Dégâts Subis' },
        { key: 'damage_resisted', label: 'Dégâts Résistés' },
        { key: 'damage_blocked', label: 'Dégâts Parés' },
        { key: 'player_kills', label: 'Joueurs Tués (PvP)' },
        { key: 'mob_kills', label: 'Mobs Tués' },
        { key: 'deaths', label: 'Morts Total' },
        { key: 'used_sword', label: 'Coups d\'Épée' },
        { key: 'used_mace', label: 'Coups de Masse' },
        { key: 'used_axe', label: 'Coups de Hache' },
        { key: 'used_bow', label: 'Arcs & Arbalètes' },
        { key: 'used_trident', label: 'Lancers Trident' },
        { key: 'used_shield', label: 'Parades Bouclier' },
        { key: 'golden_apple', label: 'Pommes Dorées' },
        { key: 'enchanted_golden_apple', label: 'Pommes Cheat' },
        { key: 'ender_pearl', label: 'Perles de l\'Ender' }
      ]
    },
    coma: {
      label: 'Comas',
      items: [
        { key: 'coma_received_count', label: 'Mis en coma' },
        { key: 'coma_given_count', label: 'A mis en coma' }
      ]
    },
    movement: {
      label: 'Déplacements',
      items: [
        { key: 'distance_walked', label: 'Marche / Sprint' },
        { key: 'fly_one_cm', label: 'Vol Élytres' },
        { key: 'swim_one_cm', label: 'Nage' },
        { key: 'boat_one_cm', label: 'Bateau' },
        { key: 'horse_one_cm', label: 'Cheval' },
        { key: 'jump', label: 'Sauts' }
      ]
    },
    crafting: {
      label: 'Artisanat & Commerce',
      items: [
        { key: 'traded_with_villager', label: 'Échanges Villageois' },
        { key: 'animals_bred', label: 'Animaux Reproduits' },
        { key: 'fish_caught', label: 'Poissons Pêchés' },
        { key: 'enchant_item', label: 'Enchantements' },
        { key: 'total_crafted', label: 'Items Craftés' },
        { key: 'total_picked_up', label: 'Items Ramassés' },
        { key: 'drop', label: 'Items Jetés' }
      ]
    }
  };

  let activeCategoryGroup = 'time';
  let activeCategoryKey = 'play_time';

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
    initCategoryUI();
    updateLeaderboard();
    initComaData();
  }

  function getComaCountForPlayer(playerName, countsObject) {
    if (!playerName || !countsObject || typeof countsObject !== 'object') return 0;

    const direct = countsObject[playerName];
    if (typeof direct === 'number') return direct;

    const normalizedName = playerName.toLowerCase().trim();
    for (const [name, count] of Object.entries(countsObject)) {
      if (typeof count === 'number' && name.toLowerCase().trim() === normalizedName) {
        return count;
      }
    }

    return 0;
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

      // Weapon usage stats
      let used_sword = 0;
      let used_mace = used['minecraft:mace'] || 0;
      let used_axe = 0;
      let used_bow = (used['minecraft:bow'] || 0) + (used['minecraft:crossbow'] || 0);
      let used_trident = used['minecraft:trident'] || 0;
      let used_shield = used['minecraft:shield'] || 0;

      for (const k in used) {
        if (k.endsWith('_sword')) used_sword += used[k] || 0;
        if (k.endsWith('_axe')) used_axe += used[k] || 0;
      }

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
      const coma_received_count = (typeof COMA_DATA !== 'undefined' && COMA_DATA)
        ? getComaCountForPlayer(name, COMA_DATA.victimCounts)
        : 0;
      const coma_given_count = (typeof COMA_DATA !== 'undefined' && COMA_DATA)
        ? getComaCountForPlayer(name, COMA_DATA.attackerCounts)
        : 0;

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
          used_sword,
          used_mace,
          used_axe,
          used_bow,
          used_trident,
          used_shield,
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
          coma_received_count,
          coma_given_count,
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
    let sumKills = 0;

    processedPlayers.forEach(p => {
      sumPlaytime += p.metrics.play_time;
      sumMined += p.metrics.total_mined;
      sumDiamonds += p.metrics.mined_diamond;
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
  }

  // 4. Update & Render Leaderboard Table
  function updateLeaderboard() {
    const sortCategoryEl = document.getElementById('sort-category');
    const categoryKey = (sortCategoryEl && sortCategoryEl.value) || activeCategoryKey || 'play_time';
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
    const leaderboardHead = document.getElementById('leaderboard-head');
    if (leaderboardHead) {
      leaderboardHead.innerHTML = `
        <tr>
          <th class="col-rank">#</th>
          <th class="col-player">Joueur</th>
          <th class="col-main-stat" id="table-stat-title">${catConfig.label}</th>
          <th class="col-diff">vs Moyenne</th>
          <th class="col-action">Détails</th>
        </tr>
      `;
    }

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
            </div>
          </div>
        </td>
        <td class="col-main-stat">
          <span class="main-stat-val">${formattedMainStat}</span>
        </td>
        <td class="col-diff">${diffBadge}</td>
        <td class="col-action">
          <button class="btn btn-detail" data-uuid="${player.uuid}">Voir Stats</button>
        </td>
      `;

      const detailBtn = tr.querySelector('.btn-detail');
      if (detailBtn) {
        detailBtn.addEventListener('click', (event) => {
          event.preventDefault();
          openPlayerModal(player.uuid);
        });
      }

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

    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    // Header Info
    const skinEl = document.getElementById('modal-player-skin');
    if (skinEl) skinEl.src = `https://mc-heads.net/avatar/${player.uuid}/128`;
    setText('modal-player-name', player.name);

    // Player Badges
    const badgesBox = document.getElementById('modal-player-badges');
    if (badgesBox) badgesBox.innerHTML = '';
    
    if (badgesBox) {
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
    }

    const activeGroupKey = activeCategoryGroup || 'time';
    const activeGroup = CATEGORY_GROUPS[activeGroupKey] || CATEGORY_GROUPS.time;
    const categoryStatsList = document.getElementById('modal-category-stats-list');
    if (categoryStatsList) {
      categoryStatsList.innerHTML = '';
      activeGroup.items.forEach(item => {
        const statConfig = STAT_CONFIG[item.key] || { unit: 'num' };
        const value = player.metrics[item.key] ?? 0;
        categoryStatsList.innerHTML += `
          <div class="resource-item category-stat-item">
            <span class="resource-name">${escapeHtml(item.label)}</span>
            <span class="resource-count">${formatStatValue(value, statConfig.unit)}</span>
          </div>
        `;
      });
    }

    // Overview Tab Stats
    setText('m-playtime', formatPlaytime(player.metrics.play_time));
    setText('m-total-mined', formatNumber(player.metrics.total_mined));
    setText('m-diamonds', formatNumber(player.metrics.mined_diamond));
    setText('m-mobs', formatNumber(player.metrics.mob_kills));
    setText('m-deaths', formatNumber(player.metrics.deaths));
    setText('m-distance', `${player.metrics.distance_walked} km`);

    // Populate Mined List
    const minedList = document.getElementById('modal-mined-list');
    if (minedList) minedList.innerHTML = '';
    const minedStats = player.rawStats['minecraft:mined'] || {};
    const minedArray = Object.keys(minedStats).map(key => ({
      name: key.replace('minecraft:', '').replace(/_/g, ' '),
      count: minedStats[key]
    })).sort((a, b) => b.count - a.count);

    if (minedList) {
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
    }

    // Populate Mob Combat List
    const combatList = document.getElementById('modal-combat-list');
    if (combatList) combatList.innerHTML = `
      <div class="resource-item">
        <span class="resource-name">Dégâts Infligés</span>
        <span class="resource-count">${formatNumber(player.metrics.damage_dealt)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Dégâts Subis</span>
        <span class="resource-count">${formatNumber(player.metrics.damage_taken)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Dégâts Résistés</span>
        <span class="resource-count">${formatNumber(player.metrics.damage_resisted)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Dégâts Parés</span>
        <span class="resource-count">${formatNumber(player.metrics.damage_blocked)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Coups d'Épée</span>
        <span class="resource-count">${formatNumber(player.metrics.used_sword)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Coups de Masse</span>
        <span class="resource-count">${formatNumber(player.metrics.used_mace)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Coups de Hache</span>
        <span class="resource-count">${formatNumber(player.metrics.used_axe)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Tirs Arc / Arbalète</span>
        <span class="resource-count">${formatNumber(player.metrics.used_bow)}</span>
      </div>
      <div class="resource-item">
        <span class="resource-name">Parades Bouclier</span>
        <span class="resource-count">${formatNumber(player.metrics.used_shield)}</span>
      </div>
    `;

    const killedStats = player.rawStats['minecraft:killed'] || {};
    const killedArray = Object.keys(killedStats).map(key => ({
      name: key.replace('minecraft:', '').replace(/_/g, ' '),
      count: killedStats[key]
    })).sort((a, b) => b.count - a.count);

    if (combatList && killedArray.length > 0) {
      killedArray.forEach(item => {
        combatList.innerHTML += `
          <div class="resource-item">
            <span class="resource-name">${capitalizeFirst(item.name)}</span>
            <span class="resource-count">${formatNumber(item.count)}</span>
          </div>
        `;
      });
    }

    // Populate Exploration List
    const expList = document.getElementById('modal-exploration-list');
    if (expList) expList.innerHTML = `
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

    // Populate Player Coma Summary
    const comaCount = getPlayerComaCount(player.name);
    const comaTotalEl = document.getElementById('m-coma-total');
    if (comaTotalEl) comaTotalEl.textContent = formatNumber(comaCount);

    const modalComaCountEl = document.getElementById('modal-coma-count');
    if (modalComaCountEl) modalComaCountEl.textContent = comaCount;

    const comaList = document.getElementById('modal-coma-list');
    if (comaList) {
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
    }

    const modal = document.getElementById('player-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
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

  function initCategoryUI() {
    const mainTabsContainer = document.getElementById('category-main-tabs');
    const chipsBarContainer = document.getElementById('category-chips-bar');
    if (!mainTabsContainer || !chipsBarContainer) return;

    function renderSubChips(groupKey) {
      const group = CATEGORY_GROUPS[groupKey];
      if (!group) return;

      chipsBarContainer.innerHTML = '';
      group.items.forEach((item, index) => {
        const isChipActive = item.key === activeCategoryKey || (index === 0 && !group.items.some(i => i.key === activeCategoryKey));
        if (isChipActive && index === 0 && !group.items.some(i => i.key === activeCategoryKey)) {
          activeCategoryKey = item.key;
        }

        const chipBtn = document.createElement('button');
        chipBtn.className = `chip-btn ${isChipActive ? 'active' : ''}`;
        chipBtn.textContent = item.label;
        chipBtn.dataset.statKey = item.key;

        chipBtn.addEventListener('click', () => {
          document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
          chipBtn.classList.add('active');
          activeCategoryKey = item.key;

          const sortSel = document.getElementById('sort-category');
          if (sortSel) sortSel.value = item.key;

          currentPage = 1;
          updateLeaderboard();
        });

        chipsBarContainer.appendChild(chipBtn);
      });
    }

    document.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategoryGroup = btn.dataset.catGroup;

        const group = CATEGORY_GROUPS[activeCategoryGroup];
        if (group && group.items.length > 0) {
          activeCategoryKey = group.items[0].key;
          const sortSel = document.getElementById('sort-category');
          if (sortSel) sortSel.value = activeCategoryKey;
        }

        renderSubChips(activeCategoryGroup);
        currentPage = 1;
        updateLeaderboard();
      });
    });

    // Populate hidden sort-category options
    const sortSel = document.getElementById('sort-category');
    if (sortSel) {
      sortSel.innerHTML = '';
      Object.keys(CATEGORY_GROUPS).forEach(gKey => {
        CATEGORY_GROUPS[gKey].items.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.key;
          opt.textContent = item.label;
          sortSel.appendChild(opt);
        });
      });
      sortSel.value = activeCategoryKey;
    }

    renderSubChips(activeCategoryGroup);
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
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

  }

  function closeModal() {
    document.getElementById('player-modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function initComaData() {
    if (typeof COMA_DATA === 'undefined') return;

    const cardEl = document.getElementById('total-comas-card');
    if (cardEl) cardEl.textContent = formatNumber(COMA_DATA.totalEvents);
  }

  // Get coma events for a specific player name
  function getPlayerComaEvents(playerName) {
    if (typeof COMA_DATA === 'undefined') return [];
    return COMA_DATA.events.filter(ev =>
      ev.victim.toLowerCase() === playerName.toLowerCase()
    );
  }

  function getPlayerComaCount(playerName) {
    if (typeof COMA_DATA === 'undefined') return 0;
    if (!playerName) return 0;

    const victimCounts = COMA_DATA.victimCounts || {};
    if (typeof victimCounts === 'object' && victimCounts[playerName]) {
      return victimCounts[playerName];
    }

    const normalizedName = playerName.toLowerCase().trim();
    for (const [name, count] of Object.entries(victimCounts)) {
      if (name.toLowerCase().trim() === normalizedName) {
        return count;
      }
    }

    return 0;
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
