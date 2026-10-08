import Phaser from 'phaser';
import { W, H } from './gamedata.js';
import MainScene from './MainScene.js';
import { initUI, initTitle, ui, onBossEvent } from './ui.js';

const scene = new MainScene(() => ui(), (type, data) => onBossEvent(type, data));

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  smoothPixelArt: true,
  backgroundColor: '#8fd6ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  scene: [scene],
};

const game = new Phaser.Game(config);
window.addEventListener('resize', () => game.scale.refresh());

game.events.once('ready', () => {
  scene.setPaused(true); // タイトル画面での選択を待つ
  initUI(scene);
  initTitle(scene);
  game.loop.hasResumed = false;
  scene.time.addEvent({
    delay: 250, loop: true,
    callback: () => ui(),
  });
});
