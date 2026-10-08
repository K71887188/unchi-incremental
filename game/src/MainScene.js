import Phaser from 'phaser';
import { W, H, CH, AUTO, fmt } from './gamedata.js';
import * as G from './gamedata.js';

export default class MainScene extends Phaser.Scene {
  constructor(onChange, onBossEvent) {
    super('main');
    this.onChange = onChange;
    this.onBossEvent = onBossEvent; // ('enter'|'tick'|'result'|'victory', data) => void
  }

  preload() {
    CH.forEach(c => {
      this.load.image('c_' + c.id, 'dotown/' + c.img);
      if (c.strainImg) this.load.image('c_' + c.id + '_s', 'dotown/' + c.strainImg);
    });
    AUTO.forEach(a => this.load.image('a_' + a.id, 'dotown/' + a.img));
    this.load.image('poop', 'dotown/うんち.png');
    this.load.image('boss', 'boss/boss002.png');
  }

  fitWidth(img, targetWidth) {
    const src = img.texture.getSourceImage();
    img.setScale(targetWidth / src.width);
    return img;
  }

  create() {
    this.skyRect = this.add.rectangle(0, 0, W, 90, 0x8fd6ff).setOrigin(0);
    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      const cx = 60 + i * 130, cy = 16 + (i % 2) * 12;
      this.clouds.push(this.add.rectangle(cx, cy, 40, 10, 0xffffff));
      this.clouds.push(this.add.rectangle(cx + 10, cy - 6, 24, 8, 0xffffff));
    }
    this.grassRect = this.add.rectangle(0, 90, W, H - 90, 0x7bd15c).setOrigin(0);
    this.grassDots = [];
    for (let i = 0; i < 40; i++) {
      this.grassDots.push(this.add.rectangle((i * 97) % W, 100 + (i * 53) % (H - 100), 6, 2, 0x69bf4b).setOrigin(0));
    }
    this.hs = []; this.ps = []; this.as = [];
    this.add.graphics().lineStyle(2, 0x3b2a1a, 1).strokeRect(1, 1, W - 2, H - 2).setDepth(10000);
    this.input.on('pointerdown', (p) => this.onClick(p));

    this.phase = 'field';
    this.runElapsed = 0;
  }

  rnd(a, b) { return a + Math.random() * (b - a); }

  tintBg(toNight, duration) {
    const sky = toNight ? [0x8fd6ff, 0x241240] : [0x241240, 0x8fd6ff];
    const grass = toNight ? [0x7bd15c, 0x1f3a1a] : [0x1f3a1a, 0x7bd15c];
    const cloud = toNight ? [0xffffff, 0x6a6a78] : [0x6a6a78, 0xffffff];
    const dot = toNight ? [0x69bf4b, 0x14240f] : [0x14240f, 0x69bf4b];
    this.tweens.addCounter({
      from: 0, to: 100, duration,
      onUpdate: (tw) => {
        const t = tw.getValue();
        const mix = (pair) => Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(pair[0]), Phaser.Display.Color.ValueToColor(pair[1]), 100, t).color;
        this.skyRect.fillColor = mix(sky);
        this.grassRect.fillColor = mix(grass);
        this.clouds.forEach(c => c.fillColor = mix(cloud));
        this.grassDots.forEach(d => d.fillColor = mix(dot));
      },
    });
  }

  pick(h) {
    h.tx = this.rnd(20, W - 20); h.ty = this.rnd(100, H - 24);
    h.st = 'walk'; h.t = 0;
  }

  spawnChar(c) {
    const img = this.add.image(this.rnd(30, W - 30), this.rnd(110, H - 30), 'c_' + c.id);
    this.fitWidth(img, c.w);
    const h = { c, img, x: img.x, y: img.y };
    this.pick(h);
    h.st = 'strain'; h.t = G.strainT(c) * .5;
    this.hs.push(h);
    return h;
  }

  spawnAuto(a) {
    const img = this.add.image(this.rnd(30, W - 30), this.rnd(110, H - 30), 'a_' + a.id);
    this.fitWidth(img, a.w);
    const u = { a, img, x: img.x, y: img.y };
    this.pick(u);
    this.as.push(u);
    return u;
  }

  spawnPoop(x, y, v, gold) {
    const img = this.add.image(x, y, 'poop');
    this.fitWidth(img, 10 + Math.min(6, v * .1));
    if (gold) img.setTintFill(0xffd700);
    const p = { img, x, y, a: 0, v, gold };
    this.ps.push(p);
    return p;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, .1);
    if (this.paused) return;
    if (this.phase === 'field') {
      this.runElapsed += dt;
      if (this.runElapsed >= G.RUN_DURATION) { this.enterBossPhase(); return; }
      this.updateField(dt);
    } else if (this.phase === 'boss') {
      this.updateBoss(dt);
    }
  }

  setPaused(v) { this.paused = v; }

  skipToBoss() { this.runElapsed = G.RUN_DURATION; } // テスト用：即ボス戦へ

  updateField(dt) {
    CH.forEach(c => {
      if (!G.lv(c).unlocked) return;
      while (this.hs.filter(h => h.c === c).length < 1 + G.lv(c).count) this.spawnChar(c);
    });
    AUTO.forEach(a => {
      if (!G.alv(a).unlocked) return;
      while (this.as.filter(u => u.a === a).length < 1 + G.alv(a).count) this.spawnAuto(a);
    });

    for (const h of this.hs) {
      if (h.st === 'walk') {
        const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy), s = G.walkSp(h.c) * dt;
        if (d <= s) { h.st = 'strain'; h.t = 0; }
        else { h.x += dx / d * s; h.y += dy / d * s; }
      } else {
        h.t += dt;
        if (h.t >= G.strainT(h.c)) {
          this.spawnPoop(h.x, h.y + 4, G.val(h.c), Math.random() < G.goldProb());
          this.pick(h);
        }
      }
      let bx = h.x;
      if (h.st === 'strain') bx += Math.round(Math.sin(h.t * 40)) * 1.5;
      h.img.setPosition(Math.round(bx), Math.round(h.y));
      h.img.setDepth(h.y);
      if (h.c.strainImg) h.img.setTexture(h.st === 'strain' ? 'c_' + h.c.id + '_s' : 'c_' + h.c.id);
      else if (h.c.tint) h.img.setTint(h.st === 'strain' ? 0xffb090 : 0xffffff);
    }

    for (const p of this.ps) {
      p.a += dt;
      p.img.setDepth(p.y - 1);
      const remain = G.life() - p.a;
      p.img.setVisible(!(remain < Math.min(4, G.life() * .4) && Math.floor(p.a * 10) % 2));
    }
    this.ps = this.ps.filter(p => {
      if (p.a < G.life()) return true;
      p.img.destroy(); return false;
    });

    for (const u of this.as) {
      const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx, dy), s = u.a.speed * dt;
      if (d <= s) this.pick(u); else { u.x += dx / d * s; u.y += dy / d * s; }
      u.img.setDepth(u.y);
      u.img.setPosition(Math.round(u.x), Math.round(u.y));
      for (const p of this.ps) if (!p._g && Math.hypot(p.x - u.x, p.y - u.y) <= u.a.radius) p._g = 1;
    }
    if (this.as.length) {
      let g = 0, hadGold = false;
      this.ps = this.ps.filter(p => {
        if (p._g) { g += p.v * (p.gold ? G.GOLD_MUL : 1); if (p.gold) hadGold = true; p.img.destroy(); return false; }
        return true;
      });
      if (g) {
        G.S.p += g * G.autoGainMul();
        this.onChange();
      }
    }
  }

  onClick(pointer) {
    if (this.phase !== 'field') return;
    const range = G.rng();
    const circle = this.add.circle(pointer.x, pointer.y, range).setStrokeStyle(1, 0xffffff).setDepth(9999);
    this.tweens.add({ targets: circle, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
    let g = 0, hadGold = false;
    this.ps = this.ps.filter(p => {
      if (Math.hypot(p.x - pointer.x, p.y - pointer.y) <= range) {
        if (p.gold) hadGold = true;
        g += p.v * (p.gold ? G.GOLD_MUL : 1);
        p.img.destroy();
        return false;
      }
      return true;
    });
    if (g) {
      G.S.p += g;
      const t = this.add.text(pointer.x, pointer.y, (hadGold ? '🥇x' + G.GOLD_MUL + ' ' : '') + '+' + fmt(g),
        { fontFamily: 'sans-serif', fontSize: 10, color: '#3b2a1a', resolution: 6 });
      this.tweens.add({ targets: t, y: pointer.y - 20, alpha: 0, duration: 600, onComplete: () => t.destroy() });
      this.onChange();
    }
  }

  resetField() {
    this.hs.forEach(h => h.img.destroy()); this.hs = [];
    this.ps.forEach(p => p.img.destroy()); this.ps = [];
    this.as.forEach(u => u.img.destroy()); this.as = [];
  }

  enterBossPhase() {
    this.resetField();
    this.phase = 'boss';
    this.bossHP = G.BOSS_MAX_HP;
    this.bossMaxHP = G.BOSS_MAX_HP;
    this.bossAttackT = 0;
    this.damageDealt = 0;

    this.tintBg(true, 1200);
    this.cameras.main.flash(300, 80, 0, 120);

    this.bossImg = this.add.image(W / 2, -70, 'boss');
    this.fitWidth(this.bossImg, 110);
    this.bossImg.setDepth(500);
    this.bossImg.setAlpha(0);
    this.tweens.add({ targets: this.bossImg, alpha: 1, duration: 600 });
    this.tweens.add({ targets: this.bossImg, y: 70, duration: 2200, ease: 'Sine.InOut', delay: 300 });

    this.combatants = [];
    const unlocked = CH.filter(c => G.lv(c).unlocked);
    const total = unlocked.reduce((n, c) => n + 1 + G.lv(c).count, 0);
    const gridTop = 140, gridBottom = H - 6, rowH = 24;
    const maxRows = Math.max(1, Math.floor((gridBottom - gridTop) / rowH));
    const cols = Math.max(1, Math.ceil(total / maxRows));
    let i = 0;
    unlocked.forEach(c => {
      const n = 1 + G.lv(c).count;
      for (let k = 0; k < n; k++) {
        const gx = 20 + (i % cols) * ((W - 40) / Math.max(1, cols - 1 || 1));
        const gy = gridTop + Math.floor(i / cols) * rowH;
        const img = this.add.image(Math.min(gx, W - 16), gy, 'c_' + c.id);
        this.fitWidth(img, Math.min(c.w, 11));
        img.setAlpha(0);
        this.tweens.add({ targets: img, alpha: 1, duration: 400, delay: 2500 + i * 6 });
        const hp = this.add.text(img.x, gy + 8, '', { fontFamily: 'sans-serif', fontSize: 6, color: '#ff4444', resolution: 6 }).setOrigin(.5, 0).setAlpha(0);
        this.tweens.add({ targets: hp, alpha: 1, duration: 400, delay: 2500 + i * 6 });
        this.combatants.push({ c, img, hpText: hp, x: img.x, y: gy, hp: c.hp, hpMax: c.hp, dmg: 0, fireT: this.rnd(0, G.fireInterval(c)) });
        i++;
      }
    });
    this.combatReady = false;
    this.time.delayedCall(2600, () => { this.combatReady = true; });
    this.onBossEvent && this.onBossEvent('enter', {});
  }

  updateBoss(dt) {
    if (!this.combatReady) {
      this.onBossEvent && this.onBossEvent('tick', {
        bossHP: this.bossHP, bossMaxHP: this.bossMaxHP,
        alive: this.combatants.length, total: this.combatants.length,
      });
      return;
    }
    const alive = this.combatants.filter(m => m.hp > 0);

    for (const m of alive) {
      m.fireT += dt;
      const interval = G.fireInterval(m.c);
      if (m.fireT >= interval) {
        m.fireT = 0;
        const gold = Math.random() < G.goldProb();
        const dmg = G.val(m.c) * G.BOSS_DMG_MUL * (gold ? G.GOLD_MUL : 1);
        m.dmg += dmg;
        this.bossHP -= dmg;
        this.damageDealt += dmg;
        this.throwPoopAt(m, dmg, gold);
      }
    }

    this.bossAttackT += dt;
    if (this.bossAttackT >= G.BOSS_ATTACK_INTERVAL && alive.length) {
      this.bossAttackT = 0;
      const n = Math.min(alive.length, Math.floor(this.rnd(G.BOSS_HIT_MIN, G.BOSS_HIT_MAX + 1)));
      const targets = Phaser.Utils.Array.Shuffle(alive.slice()).slice(0, n);
      this.tweens.add({ targets: this.bossImg, scale: this.bossImg.scale * 1.08, duration: 120, yoyo: true });
      targets.forEach(m => {
        m.hp--;
        this.bossStrike(m);
      });
    }

    for (const m of this.combatants) {
      if (m.hp > 0) m.hpText.setText('♥'.repeat(m.hp) + '-'.repeat(Math.max(0, m.hpMax - m.hp)));
    }

    this.onBossEvent && this.onBossEvent('tick', {
      bossHP: Math.max(0, this.bossHP), bossMaxHP: this.bossMaxHP,
      alive: this.combatants.filter(m => m.hp > 0).length, total: this.combatants.length,
    });

    if (this.bossHP <= 0) { this.finishVictory(); return; }
    if (this.combatants.every(m => m.hp <= 0)) { this.finishDefeat(); return; }
  }

  throwPoopAt(m, dmg, gold) {
    const proj = this.add.image(m.x, m.y - 6, 'poop');
    this.fitWidth(proj, 7);
    if (gold) proj.setTintFill(0xffd700);
    proj.setDepth(700);
    this.tweens.add({
      targets: proj, x: this.bossImg.x + this.rnd(-20, 20), y: this.bossImg.y + this.rnd(-10, 10),
      duration: 280, ease: 'Sine.In',
      onComplete: () => {
        proj.destroy();
        if (!this.bossImg) return;
        this.tweens.add({ targets: this.bossImg, alpha: .6, duration: 60, yoyo: true });
        const t = this.add.text(this.bossImg.x + this.rnd(-16, 16), this.bossImg.y, (gold ? '🥇' : '') + '-' + fmt(dmg),
          { fontFamily: 'sans-serif', fontSize: 9, color: gold ? '#ffd700' : '#3b2a1a', resolution: 6 }).setDepth(600);
        this.tweens.add({ targets: t, y: this.bossImg.y - 24, alpha: 0, duration: 500, onComplete: () => t.destroy() });
      },
    });
  }

  bossStrike(m) {
    const bolt = this.add.circle(this.bossImg.x, this.bossImg.y, 4, 0xd63cff, 1);
    bolt.setStrokeStyle(2, 0x6a1ab0, 1);
    bolt.setDepth(700);
    const glow = this.add.circle(this.bossImg.x, this.bossImg.y, 7, 0xe79bff, .5).setDepth(699);
    this.tweens.add({
      targets: [bolt, glow], x: m.x, y: m.y, duration: 180, ease: 'Sine.In',
      onComplete: () => {
        bolt.destroy(); glow.destroy();
        if (!m.img) return;
        m.img.setTintFill(0xff4040);
        this.cameras.main.shake(60, 0.002);
        this.time.delayedCall(120, () => m.img && m.img.clearTint());
        if (m.hp <= 0) {
          this.tweens.add({ targets: [m.img, m.hpText], alpha: 0, duration: 250, onComplete: () => { if (m.img) { m.img.destroy(); m.hpText.destroy(); m.img = null; } } });
        }
      },
    });
  }

  finishDefeat() {
    this.phase = 'result';
    const pct = this.damageDealt / this.bossMaxHP;
    const byChar = {};
    this.combatants.forEach(m => { byChar[m.c.id] = (byChar[m.c.id] || 0) + m.dmg; });
    const charDamage = CH.filter(c => byChar[c.id]).map(c => ({ name: c.name, dmg: byChar[c.id] }));
    this.onBossEvent && this.onBossEvent('result', { pct, cardCount: G.gradeCardCount(pct), charDamage, totalDamage: this.damageDealt });
  }

  finishVictory() {
    this.phase = 'victory';
    this.onBossEvent && this.onBossEvent('victory', {});
  }

  // 報酬カード選択後、または勝利後に次のランを始める
  startNewRun() {
    if (this.bossImg) { this.bossImg.destroy(); this.bossImg = null; }
    (this.combatants || []).forEach(m => { if (m.img) m.img.destroy(); if (m.hpText) m.hpText.destroy(); });
    this.combatants = [];
    this.tintBg(false, 600);
    this.phase = 'field';
    this.runElapsed = 0;
  }
}
