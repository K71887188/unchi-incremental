import Phaser from 'phaser';
import { W, H, CH, AUTO, fmt } from './gamedata.js';
import * as G from './gamedata.js';

export default class MainScene extends Phaser.Scene {
  constructor(onChange) { super('main'); this.onChange = onChange; }

  preload() {
    CH.forEach(c => {
      this.load.image('c_' + c.id, '/dotown/' + c.img);
      if (c.strainImg) this.load.image('c_' + c.id + '_s', '/dotown/' + c.strainImg);
    });
    AUTO.forEach(a => this.load.image('a_' + a.id, '/dotown/' + a.img));
    this.load.image('poop', '/dotown/うんち.png');
  }

  fitWidth(img, targetWidth) {
    const src = img.texture.getSourceImage();
    img.setScale(targetWidth / src.width);
    return img;
  }

  create() {
    this.add.rectangle(0, 0, W, 90, 0x8fd6ff).setOrigin(0);
    for (let i = 0; i < 3; i++) {
      const cx = 60 + i * 130, cy = 16 + (i % 2) * 12;
      this.add.rectangle(cx, cy, 40, 10, 0xffffff);
      this.add.rectangle(cx + 10, cy - 6, 24, 8, 0xffffff);
    }
    this.add.rectangle(0, 90, W, H - 90, 0x7bd15c).setOrigin(0);
    for (let i = 0; i < 40; i++) {
      this.add.rectangle((i * 97) % W, 100 + (i * 53) % (H - 100), 6, 2, 0x69bf4b).setOrigin(0);
    }
    this.hs = []; this.ps = []; this.as = [];
    this.add.graphics().lineStyle(2, 0x3b2a1a, 1).strokeRect(1, 1, W - 2, H - 2).setDepth(10000);
    this.input.on('pointerdown', (p) => this.onClick(p));
  }

  rnd(a, b) { return a + Math.random() * (b - a); }

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
      let g = 0, gp = 0;
      this.ps = this.ps.filter(p => {
        if (p._g) { g += p.v; if (p.gold) gp += G.goldValMul(); p.img.destroy(); return false; }
        return true;
      });
      if (g) {
        G.S.p += g * G.autoGainMul();
        G.S.goldP += gp;
        this.onChange();
      }
    }
  }

  onClick(pointer) {
    const range = G.rng();
    const circle = this.add.circle(pointer.x, pointer.y, range).setStrokeStyle(1, 0xffffff).setDepth(9999);
    this.tweens.add({ targets: circle, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
    let g = 0, gp = 0, crit = false;
    this.ps = this.ps.filter(p => {
      if (Math.hypot(p.x - pointer.x, p.y - pointer.y) <= range) {
        const hit = Math.random() < G.critChance();
        if (hit) crit = true;
        g += p.v * (hit ? 2 : 1);
        if (p.gold) gp += G.goldValMul();
        p.img.destroy();
        return false;
      }
      return true;
    });
    if (g) {
      G.S.p += g; G.S.goldP += gp;
      const t = this.add.text(pointer.x, pointer.y, (crit ? '💥' : '') + '+' + fmt(g) + (gp ? ' 🥇+' + fmt(gp) : ''),
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
}
