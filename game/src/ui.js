import { CH, AUTO, ASC_POOL, SKG, SKMAX, SKN, cCost, fmt } from './gamedata.js';
import * as G from './gamedata.js';

let scene = null;
const grpBox = document.getElementById('groups');
const P = document.getElementById('p'), R = document.getElementById('r');
let RBTN, LBTN, GUBTN, GLBTN;

export function initUI(sceneRef) {
  scene = sceneRef;
  const overlay = document.getElementById('overlay');
  document.getElementById('toggleUI').onclick = () => overlay.classList.remove('hidden');
  document.getElementById('closeUI').onclick = () => overlay.classList.add('hidden');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });
  const pauseBtn = document.getElementById('pauseBtn');
  pauseBtn.onclick = () => {
    const next = !scene.paused;
    scene.setPaused(next);
    pauseBtn.textContent = next ? '▶ 再開' : '⏸ 一時停止';
    if (next) { renderPauseScreen(); pauseOverlay.classList.remove('hidden'); }
    else pauseOverlay.classList.add('hidden');
  };
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (!resultOverlay.classList.contains('hidden') || !victoryOverlay.classList.contains('hidden') || !pauseOverlay.classList.contains('hidden')) return;
    e.preventDefault();
    overlay.classList.toggle('hidden');
  });
  document.getElementById('cheat').onclick = () => { G.S.p += 5000; ui(); };
  document.getElementById('skipboss').onclick = () => { scene.skipToBoss(); overlay.classList.add('hidden'); };
  const rs = document.getElementById('reset'); let rc = 0;
  rs.onclick = () => {
    if (++rc < 2) { rs.textContent = 'もう一度押すと消去'; setTimeout(() => { rc = 0; rs.textContent = 'データ消去'; }, 3000); return; }
    G.replaceState(G.fresh()); scene.resetField();
    G.save(); rc = 0; rs.textContent = 'データ消去'; buildUI(); ui();
  };
  buildUI(); ui();
}

function mkBtn(row, onclick) { const b = document.createElement('button'); b.onclick = onclick; row.appendChild(b); return b; }
function mkGroup(title, open) {
  const g = document.createElement('details'); g.className = 'grp'; g.open = open;
  g.innerHTML = '<summary>' + title + '</summary>';
  const row = document.createElement('div'); row.className = 'row';
  g.appendChild(row); grpBox.appendChild(g);
  return row;
}

function buildUI() {
  grpBox.innerHTML = '';
  const prow = mkGroup('プレイヤー強化', true);
  RBTN = mkBtn(prow, () => { const c = cCost(G.RANGE_BASE, G.RANGE_G, G.S.range); if (G.S.p >= c && G.S.range < 8) { G.S.p -= c; G.S.range++; G.save(); ui(); } });
  LBTN = mkBtn(prow, () => { const c = cCost(G.LIFE_BASE, G.LIFE_G, G.S.life); if (G.S.p >= c && G.S.life < 10) { G.S.p -= c; G.S.life++; G.save(); ui(); } });

  const grow = mkGroup('金のうんち', true);
  GUBTN = mkBtn(grow, () => { if (!G.S.goldUnlock && G.S.p >= G.GOLD_UNLOCK_COST) { G.S.p -= G.GOLD_UNLOCK_COST; G.S.goldUnlock = true; G.save(); ui(); } });
  GLBTN = mkBtn(grow, () => { const n = G.S.goldLv, c = cCost(1500, 1.6, n); if (G.S.goldUnlock && G.S.p >= c && n < G.GOLD_MAXLV) { G.S.p -= c; G.S.goldLv++; G.save(); ui(); } });

  const arow = mkGroup('自動回収', true);
  AUTO.forEach(a => {
    if (!G.alv(a).unlocked) {
      a.ubtn = mkBtn(arow, () => { if (G.S.p >= a.unlockCost) { G.S.p -= a.unlockCost; G.alv(a).unlocked = true; G.save(); buildUI(); ui(); } });
      a.ubtn.className = 'unlock';
    } else {
      a.incbtn = mkBtn(arow, () => {
        const n = G.alv(a).count, cost = cCost(a.incBase, a.incG, n);
        if (G.S.p >= cost && n < a.incMax) { G.S.p -= cost; G.alv(a).count++; G.save(); ui(); }
      });
    }
  });

  CH.forEach(c => {
    const row = mkGroup(c.name, G.lv(c).unlocked);
    if (!G.lv(c).unlocked) {
      c.ubtn = mkBtn(row, () => { if (G.S.p >= c.unlockCost) { G.S.p -= c.unlockCost; G.lv(c).unlocked = true; G.save(); buildUI(); ui(); } });
      c.ubtn.className = 'unlock';
    } else {
      c.btn = {};
      ['strain', 'freq', 'value', 'count'].forEach(k => {
        c.btn[k] = mkBtn(row, () => {
          const n = G.lv(c)[k], cost = cCost(c.skb[k], SKG[k], n);
          if (G.S.p >= cost && n < SKMAX[k]) { G.S.p -= cost; G.lv(c)[k]++; G.save(); ui(); }
        });
      });
    }
  });
  refreshAll();
}

function refreshAll() {
  const rc = cCost(G.RANGE_BASE, G.RANGE_G, G.S.range), lc = cCost(G.LIFE_BASE, G.LIFE_G, G.S.life);
  RBTN.innerHTML = '<b>クリック範囲拡大</b> Lv' + G.S.range + (G.S.range >= 8 ? ' MAX' : '') + '<br>' + (G.S.range >= 8 ? '' : '💩 ' + fmt(rc));
  RBTN.disabled = G.S.range >= 8 || G.S.p < rc;
  LBTN.innerHTML = '<b>残留時間延長</b> Lv' + G.S.life + (G.S.life >= 10 ? ' MAX' : '') + '<br>' + (G.S.life >= 10 ? '' : '💩 ' + fmt(lc));
  LBTN.disabled = G.S.life >= 10 || G.S.p < lc;

  GUBTN.innerHTML = G.S.goldUnlock ? '<b>金のうんち 解放済</b><br>出現確率 ' + (G.goldProb() * 100).toFixed(2) + '%（ポイント' + G.GOLD_MUL + '倍）' : '<b>金のうんち解放</b><br>💩 ' + fmt(G.GOLD_UNLOCK_COST);
  GUBTN.disabled = G.S.goldUnlock || G.S.p < G.GOLD_UNLOCK_COST;
  const gc = cCost(1500, 1.6, G.S.goldLv), gm = G.S.goldLv >= G.GOLD_MAXLV;
  GLBTN.innerHTML = '<b>金のうんち確率アップ</b> Lv' + G.S.goldLv + (gm ? ' MAX' : '') + '<br>' + (gm ? '' : '💩 ' + fmt(gc));
  GLBTN.disabled = !G.S.goldUnlock || gm || G.S.p < gc;

  AUTO.forEach(a => {
    if (!G.alv(a).unlocked) { if (a.ubtn) { a.ubtn.innerHTML = '<b>' + a.name + '解放</b><br>💩 ' + fmt(a.unlockCost); a.ubtn.disabled = G.S.p < a.unlockCost; } return; }
    if (!a.incbtn) return;
    const n = G.alv(a).count, mx = n >= a.incMax, cost = cCost(a.incBase, a.incG, n);
    a.incbtn.innerHTML = '<b>' + a.name + '増加</b> Lv' + n + (mx ? ' MAX' : '') + '<br>' + (mx ? '' : '💩 ' + fmt(cost));
    a.incbtn.disabled = mx || G.S.p < cost;
  });
  CH.forEach(c => {
    if (!G.lv(c).unlocked) {
      if (c.ubtn) {
        c.ubtn.innerHTML = '<b>' + c.name + 'を迎える</b><br>💩 ' + fmt(c.unlockCost);
        c.ubtn.disabled = G.S.p < c.unlockCost;
      }
      return;
    }
    if (!c.btn) return;
    ['strain', 'freq', 'value', 'count'].forEach(k => {
      const n = G.lv(c)[k], mx = n >= SKMAX[k], cost = cCost(c.skb[k], SKG[k], n), b = c.btn[k];
      b.disabled = mx || G.S.p < cost;
      b.innerHTML = '<b>' + SKN[k] + '</b> Lv' + n + (mx ? ' MAX' : '') + '<br>' + (mx ? '' : '💩 ' + fmt(cost));
    });
  });
}

const clockRow = document.getElementById('clockRow'), pixClock = document.getElementById('pixClock');

export function ui() {
  P.textContent = fmt(G.S.p);
  if (scene && scene.phase === 'field') {
    clockRow.classList.remove('hide');
    const remain = Math.max(0, G.RUN_DURATION - scene.runElapsed);
    const mm = Math.floor(remain / 60), ss = Math.floor(remain % 60);
    pixClock.innerHTML = '<span class="lbl">NEXT BOSS</span>' + mm + ':' + String(ss).padStart(2, '0');
    let rate = 0;
    CH.forEach(c => { if (G.lv(c).unlocked) rate += (1 + G.lv(c).count) / (150 / G.walkSp(c) + G.strainT(c)) * G.val(c); });
    R.textContent = '毎秒 約' + fmt(rate) + 'うんP / 消えるまで' + G.life().toFixed(1) + '秒 / 回収範囲' + G.rng() + (G.S.goldUnlock ? ' / 金の確率' + (G.goldProb() * 100).toFixed(2) + '%' : '');
  } else {
    clockRow.classList.add('hide');
    R.textContent = '';
  }
  refreshAll();
}

const bossBar = document.getElementById('bossBar'), bossBarFill = document.getElementById('bossBarFill'), bossBarLabel = document.getElementById('bossBarLabel');
const resultOverlay = document.getElementById('resultOverlay'), resultInner = document.getElementById('resultInner');
const victoryOverlay = document.getElementById('victoryOverlay'), victoryInner = document.getElementById('victoryInner');
const pauseOverlay = document.getElementById('pauseOverlay'), pauseInner = document.getElementById('pauseInner');
let bossTickN = 0;

function renderPauseScreen() {
  const s = G.S.ascStats;
  const rows = ASC_POOL.map(card => '<li>' + card.name + '：Lv' + (s[card.id] || 0) + '</li>').join('');
  pauseInner.innerHTML =
    '<h2>⏸ 一時停止中</h2>' +
    '<p>通算ラン数（転生回数）：' + G.S.ascCount + '</p>' +
    '<div style="text-align:left;font-size:.9rem;max-width:320px;margin:10px auto"><b>恒久ボーナスの獲得状況</b><ul>' + rows + '</ul></div>' +
    '<button id="resumeBtn" style="margin-top:8px">▶ 再開</button>' +
    '<div class="sub" style="justify-content:center;margin-top:16px"><button id="fullResetBtn">恒久ボーナス含めすべて初めから</button></div>';
  document.getElementById('resumeBtn').onclick = () => document.getElementById('pauseBtn').click();
  const frBtn = document.getElementById('fullResetBtn');
  let frc = 0;
  frBtn.onclick = () => {
    if (++frc < 2) { frBtn.textContent = '本当に消えます。もう一度押すと初期化'; return; }
    G.replaceState(G.fresh());
    scene.startNewRun();
    G.save();
    scene.setPaused(false);
    document.getElementById('pauseBtn').textContent = '⏸ 一時停止';
    pauseOverlay.classList.add('hidden');
    buildUI(); ui();
  };
}

function renderRewardCards(container, count, onDone) {
  const pool = ASC_POOL.slice();
  const picks = [];
  for (let i = 0; i < count && pool.length; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  // 候補が足りない分は、プールから重複可で補う
  while (picks.length < count) picks.push(ASC_POOL[Math.floor(Math.random() * ASC_POOL.length)]);
  container.innerHTML = '';
  picks.forEach(card => {
    const b = document.createElement('button'); b.className = 'asc';
    b.innerHTML = '<b>' + card.name + '</b><br>' + card.desc;
    b.onclick = () => { G.applyAscend(card.id); onDone(); };
    container.appendChild(b);
  });
}

export function onBossEvent(type, data) {
  if (type === 'enter') {
    bossBar.classList.add('show');
    bossTickN = 0;
  } else if (type === 'tick') {
    bossTickN++;
    if (bossTickN % 4 !== 0) return; // 更新頻度を間引く
    const pct = Math.max(0, data.bossHP) / data.bossMaxHP * 100;
    bossBarFill.style.width = pct.toFixed(1) + '%';
    bossBarLabel.textContent = 'ボス HP ' + fmt(Math.max(0, data.bossHP)) + ' / ' + fmt(data.bossMaxHP) + '　キャラ生存 ' + data.alive + '/' + data.total;
  } else if (type === 'result') {
    bossBar.classList.remove('show');
    const grown = CH.filter(c => G.lv(c).unlocked).map(c => {
      const l = G.lv(c);
      const parts = [];
      if (l.strain) parts.push('踏ん張り短縮Lv' + l.strain);
      if (l.freq) parts.push('移動速度Lv' + l.freq);
      if (l.value) parts.push('うんP増加Lv' + l.value);
      if (l.count) parts.push('出現数Lv' + l.count);
      return '<li>' + c.name + (parts.length ? '：' + parts.join('、') : '（解放のみ）') + '</li>';
    }).join('');
    const dmgList = (data.charDamage || []).sort((a, b) => b.dmg - a.dmg)
      .map(d => '<li>' + d.name + '：' + fmt(d.dmg) + '</li>').join('');
    resultInner.innerHTML =
      '<h2>このランは終了</h2>' +
      '<p>ボスに与えた総ダメージ：' + fmt(data.totalDamage) + '（ボスHPの' + (data.pct * 100).toFixed(1) + '%）</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left;font-size:.85rem;margin-top:10px">' +
      '<div><b>今ランで育てたキャラ</b><ul>' + (grown || '<li>なし</li>') + '</ul></div>' +
      '<div><b>キャラ別ダメージ</b><ul>' + (dmgList || '<li>なし</li>') + '</ul></div>' +
      '</div>' +
      '<button id="toRewardBtn" class="asc" style="margin-top:16px">スキル獲得へ（' + data.cardCount + '枚から選択）</button>';
    document.getElementById('toRewardBtn').onclick = () => {
      resultInner.innerHTML = '<h2>恒久ボーナスを1つ選んでください</h2><div class="cards" id="resultCards"></div>';
      renderRewardCards(document.getElementById('resultCards'), data.cardCount, () => {
        resultOverlay.classList.add('hidden');
        scene.startNewRun(); buildUI(); ui();
      });
    };
    resultOverlay.classList.remove('hidden');
  } else if (type === 'victory') {
    bossBar.classList.remove('show');
    victoryInner.innerHTML = '<h2>🎉 ボスを撃破！ゲームクリア 🎉</h2><div class="sub" style="justify-content:center"><button id="vRestart">最初からやり直す</button><button id="vEndless">エンドレスモードへ（恒久ボーナス5枚から選択）</button></div>';
    document.getElementById('vRestart').onclick = () => {
      G.replaceState(G.fresh()); victoryOverlay.classList.add('hidden'); scene.startNewRun(); buildUI(); ui();
    };
    document.getElementById('vEndless').onclick = () => {
      victoryInner.innerHTML = '<h2>恒久ボーナスを1つ選んでください（5枚から）</h2><div class="cards" id="victoryCards"></div>';
      renderRewardCards(document.getElementById('victoryCards'), 5, () => {
        victoryOverlay.classList.add('hidden'); scene.startNewRun(); buildUI(); ui();
      });
    };
    victoryOverlay.classList.remove('hidden');
  }
}
