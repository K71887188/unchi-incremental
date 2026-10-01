import { CH, AUTO, ASC_POOL, SKG, SKMAX, SKN, cCost, fmt } from './gamedata.js';
import * as G from './gamedata.js';

let scene = null;
let pendingCards = null;
const grpBox = document.getElementById('groups');
const P = document.getElementById('p'), GP = document.getElementById('gp'), R = document.getElementById('r');
let RBTN, LBTN, GUBTN, GLBTN, ASCBTN;

export function initUI(sceneRef) {
  scene = sceneRef;
  const overlay = document.getElementById('overlay');
  document.getElementById('toggleUI').onclick = () => overlay.classList.remove('hidden');
  document.getElementById('closeUI').onclick = () => overlay.classList.add('hidden');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });
  document.getElementById('cheat').onclick = () => { G.S.p += 5000; ui(); };
  document.getElementById('cheatgp').onclick = () => { G.S.goldP += 100; ui(); };
  const rs = document.getElementById('reset'); let rc = 0;
  rs.onclick = () => {
    if (++rc < 2) { rs.textContent = 'もう一度押すと消去'; setTimeout(() => { rc = 0; rs.textContent = 'データ消去'; }, 3000); return; }
    G.replaceState(G.fresh()); pendingCards = null; scene.resetField();
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

function renderAsc(row) {
  row.innerHTML = '';
  if (!pendingCards) {
    const btn = document.createElement('button'); btn.className = 'asc'; ASCBTN = btn;
    btn.onclick = () => {
      if (G.S.goldP < G.ascCost(G.S.ascCount)) return;
      const pool = ASC_POOL.slice(); pendingCards = [];
      for (let i = 0; i < 3 && pool.length; i++) pendingCards.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      buildUI();
    };
    row.appendChild(btn);
  } else {
    pendingCards.forEach(card => {
      const b = document.createElement('button'); b.className = 'asc';
      b.innerHTML = '<b>' + card.name + '</b><br>' + card.desc;
      b.onclick = () => {
        const cost = G.ascCost(G.S.ascCount), leftover = G.S.goldP - cost;
        const ns = Object.assign({}, G.S.ascStats); ns[card.id]++;
        G.replaceState(Object.assign(G.fresh(), { goldP: leftover, ascStats: ns, ascCount: G.S.ascCount + 1 }));
        pendingCards = null; scene.resetField(); G.save(); buildUI(); ui();
      };
      row.appendChild(b);
    });
    const cancel = document.createElement('button'); cancel.textContent = 'キャンセル';
    cancel.onclick = () => { pendingCards = null; buildUI(); };
    row.appendChild(cancel);
  }
}

function buildUI() {
  grpBox.innerHTML = '';
  const prow = mkGroup('プレイヤー強化', true);
  RBTN = mkBtn(prow, () => { const c = cCost(G.RANGE_BASE, G.RANGE_G, G.S.range); if (G.S.p >= c && G.S.range < 8) { G.S.p -= c; G.S.range++; G.save(); ui(); } });
  LBTN = mkBtn(prow, () => { const c = cCost(G.LIFE_BASE, G.LIFE_G, G.S.life); if (G.S.p >= c && G.S.life < 10) { G.S.p -= c; G.S.life++; G.save(); ui(); } });

  const grow = mkGroup('金のうんち・転生', true);
  GUBTN = mkBtn(grow, () => { if (!G.S.goldUnlock && G.S.p >= G.GOLD_UNLOCK_COST) { G.S.p -= G.GOLD_UNLOCK_COST; G.S.goldUnlock = true; G.save(); ui(); } });
  GLBTN = mkBtn(grow, () => { const n = G.S.goldLv, c = cCost(1500, 1.6, n); if (G.S.goldUnlock && G.S.p >= c && n < G.GOLD_MAXLV) { G.S.p -= c; G.S.goldLv++; G.save(); ui(); } });
  const ascRow = document.createElement('div'); ascRow.className = 'row'; grow.parentElement.appendChild(ascRow);
  renderAsc(ascRow);

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

  GUBTN.innerHTML = G.S.goldUnlock ? '<b>金のうんち 解放済</b><br>出現確率 ' + (G.goldProb() * 100).toFixed(2) + '%' : '<b>金のうんち解放</b><br>💩 ' + fmt(G.GOLD_UNLOCK_COST);
  GUBTN.disabled = G.S.goldUnlock || G.S.p < G.GOLD_UNLOCK_COST;
  const gc = cCost(1500, 1.6, G.S.goldLv), gm = G.S.goldLv >= G.GOLD_MAXLV;
  GLBTN.innerHTML = '<b>金のうんち確率アップ</b> Lv' + G.S.goldLv + (gm ? ' MAX' : '') + '<br>' + (gm ? '' : '💩 ' + fmt(gc));
  GLBTN.disabled = !G.S.goldUnlock || gm || G.S.p < gc;
  if (ASCBTN && ASCBTN.isConnected) {
    const cost = G.ascCost(G.S.ascCount);
    ASCBTN.innerHTML = '<b>転生</b>（' + G.S.ascCount + '回目）<br>🥇' + fmt(cost) + ' 消費してカードを引く';
    ASCBTN.disabled = G.S.goldP < cost;
  }

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

export function ui() {
  P.textContent = fmt(G.S.p); GP.textContent = fmt(G.S.goldP);
  let rate = 0;
  CH.forEach(c => { if (G.lv(c).unlocked) rate += (1 + G.lv(c).count) / (150 / G.walkSp(c) + G.strainT(c)) * G.val(c); });
  R.textContent = '毎秒 約' + fmt(rate) + 'うんP / 消えるまで' + G.life().toFixed(1) + '秒 / 回収範囲' + G.rng() + (G.S.goldUnlock ? ' / 金の確率' + (G.goldProb() * 100).toFixed(2) + '%' : '');
  refreshAll();
}
