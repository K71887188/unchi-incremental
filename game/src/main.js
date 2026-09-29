import Phaser from 'phaser';

const W = 480, H = 270;

class MainScene extends Phaser.Scene {
  constructor() { super('main'); }

  preload() {
    this.load.image('human', '/dotown/男の子.png');
    this.load.image('poop', '/dotown/うんち.png');
  }

  create() {
    this.p = 0;
    this.add.rectangle(0, 0, W, 90, 0x8fd6ff).setOrigin(0);
    this.add.rectangle(0, 90, W, H - 90, 0x7bd15c).setOrigin(0);

    this.scoreText = this.add.text(8, 6, 'うんP 0', {
      fontFamily: 'sans-serif', fontSize: 16, color: '#3b2a1a',
    });

    this.poops = this.add.group();

    this.human = this.add.image(W / 2, H / 2, 'human').setScale(0.8);
    this.humanState = 'walk';
    this.humanTimer = 0;
    this.pickTarget();

    this.input.on('pointerdown', (pointer) => this.onClick(pointer));
  }

  pickTarget() {
    this.tx = Phaser.Math.Between(30, W - 30);
    this.ty = Phaser.Math.Between(110, H - 30);
    this.humanState = 'walk';
    this.humanTimer = 0;
  }

  onClick(pointer) {
    const range = 22;
    let gained = 0;
    this.poops.getChildren().slice().forEach((poop) => {
      const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, poop.x, poop.y);
      if (d <= range) {
        gained += poop.getData('value');
        poop.destroy();
      }
    });
    if (gained > 0) {
      this.p += gained;
      this.scoreText.setText('うんP ' + this.p);
    }
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (this.humanState === 'walk') {
      const dx = this.tx - this.human.x, dy = this.ty - this.human.y;
      const dist = Math.hypot(dx, dy);
      const speed = 55 * dt;
      if (dist <= speed) {
        this.humanState = 'strain';
        this.humanTimer = 0;
      } else {
        this.human.x += (dx / dist) * speed;
        this.human.y += (dy / dist) * speed;
      }
    } else {
      this.humanTimer += dt;
      if (this.humanTimer >= 2.5) {
        const poop = this.add.image(this.human.x, this.human.y + 10, 'poop').setScale(0.5);
        poop.setData('value', 1);
        this.poops.add(poop);
        this.pickTarget();
      }
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  pixelArt: true,
  backgroundColor: '#8fd6ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W * 2,
    height: H * 2,
  },
  scene: [MainScene],
};

new Phaser.Game(config);
