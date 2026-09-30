// キャラ・スキル・状態管理まわりのデータ定義（proto/index.html v4から移植）
export const W = 480, H = 270;
const rnd = (a, b) => a + Math.random() * (b - a);
export const U = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  const i = Math.min(Math.floor(Math.log10(n) / 3), U.length - 1);
  return (n / Math.pow(1000, i)).toFixed(2) + U[i];
}
export function cCost(base, g, n) { return Math.ceil(base * Math.pow(g, n)); }

export const CH = [
 {id:'human',name:'人間',unlockCost:0,img:'男の子.png',tint:true,w:16,baseWalk:55,baseStrain:2.5,baseVal:1,skb:{strain:3,freq:5,value:8,count:40}},
 {id:'chicken',name:'ニワトリ',unlockCost:80,img:'ニワトリ.png',tint:true,w:11,baseWalk:90,baseStrain:1.0,baseVal:1,skb:{strain:6,freq:8,value:10,count:60}},
 {id:'dog',name:'犬',unlockCost:250,img:'横向きのダックスフンド.png',strainImg:'こっち向きのダックスフンド.png',w:15,baseWalk:70,baseStrain:1.8,baseVal:3,skb:{strain:15,freq:20,value:25,count:150}},
 {id:'cat',name:'猫',unlockCost:250,img:'黒ネコ.png',strainImg:'黒い座りネコ.png',w:14,baseWalk:75,baseStrain:1.7,baseVal:3,skb:{strain:15,freq:20,value:25,count:150}},
 {id:'pig',name:'ブタ',unlockCost:1200,img:'ブタ.png',tint:true,w:18,baseWalk:60,baseStrain:2.2,baseVal:8,skb:{strain:60,freq:80,value:100,count:600}},
 {id:'alpaca',name:'アルパカ',unlockCost:1500,img:'白いアルパカ.png',tint:true,w:19,baseWalk:58,baseStrain:2.3,baseVal:9,skb:{strain:70,freq:90,value:120,count:700}},
 {id:'elephant',name:'ゾウ',unlockCost:8000,img:'ゾウ.png',tint:true,w:34,baseWalk:35,baseStrain:4.5,baseVal:40,skb:{strain:400,freq:500,value:650,count:4000}},
 {id:'hippo',name:'カバ',unlockCost:9000,img:'ピンクのカバ.png',tint:true,w:30,baseWalk:32,baseStrain:4.8,baseVal:45,skb:{strain:450,freq:550,value:700,count:4500}},
 {id:'oniRed',name:'赤鬼',unlockCost:50000,img:'赤鬼.png',tint:true,w:26,baseWalk:45,baseStrain:3.5,baseVal:200,skb:{strain:2500,freq:3000,value:4000,count:25000}},
 {id:'oniBlue',name:'青鬼',unlockCost:55000,img:'青鬼.png',tint:true,w:26,baseWalk:44,baseStrain:3.6,baseVal:210,skb:{strain:2800,freq:3300,value:4200,count:27000}},
 {id:'mammoth',name:'マンモス',unlockCost:60000,img:'茶色のマンモス.png',tint:true,w:36,baseWalk:30,baseStrain:5.5,baseVal:220,skb:{strain:3000,freq:3500,value:4500,count:30000}},
 {id:'pegasus',name:'ペガサス',unlockCost:500000,img:'白いペガサス.png',tint:true,w:28,baseWalk:70,baseStrain:2.0,baseVal:1200,skb:{strain:25000,freq:30000,value:40000,count:250000}},
 {id:'dragon',name:'ドラゴン',unlockCost:800000,img:'ドラゴン.png',tint:true,w:32,baseWalk:40,baseStrain:3.0,baseVal:2500,skb:{strain:40000,freq:48000,value:64000,count:400000}},
 {id:'ufo',name:'UFO',unlockCost:2000000,img:'UFO.png',tint:true,w:22,baseWalk:90,baseStrain:1.5,baseVal:8000,skb:{strain:100000,freq:120000,value:160000,count:1000000}},
];
export const SKG = {strain:1.35,freq:1.35,count:1.8,value:1.5}, SKMAX = {strain:12,freq:12,count:8,value:40};
export const SKN = {strain:'踏ん張り短縮',freq:'移動速度アップ',count:'出現数増加',value:'うんP増加'};

export const AUTO = [
 {id:'fly',name:'ハエ',unlockCost:2000,img:'ハエ.png',w:8,speed:140,radius:10,incBase:2500,incG:1.6,incMax:10},
 {id:'beetle',name:'フンコロガシ',unlockCost:15000,img:'フンコロガシ.png',w:13,speed:45,radius:14,incBase:18000,incG:1.6,incMax:10},
 {id:'robot',name:'掃除ロボ',unlockCost:100000,img:'ロボ.png',w:18,speed:70,radius:22,incBase:120000,incG:1.7,incMax:6},
 {id:'magnet',name:'吸引マグネット',unlockCost:500000,img:'マグネット.png',w:22,speed:20,radius:70,incBase:600000,incG:1.8,incMax:4},
];

export const ASC_POOL = [
 {id:'val',name:'うんP獲得量アップ',desc:'全キャラのうんP +8%'},
 {id:'autoGain',name:'自動回収 獲得量アップ',desc:'自動回収で得るうんP +15%'},
 {id:'crit',name:'クリティカル回収',desc:'クリック回収時、確率+3%でポイント2倍'},
 {id:'goldVal',name:'金のうんち価値アップ',desc:'金のうんちで得る金うんP +50%'},
];

const KEY = 'unchi_game_v1';
const ZERO = {};
CH.forEach(c => { ZERO[c.id] = {unlocked:c.unlockCost===0,strain:0,freq:0,count:0,value:0} });
const AZERO = {};
AUTO.forEach(a => { AZERO[a.id] = {unlocked:false,count:0} });

export function fresh() {
  return {
    p:0, goldP:0, goldUnlock:false, goldLv:0, range:0, life:0,
    ascCount:0, ascStats:{val:0,autoGain:0,crit:0,goldVal:0},
    ch: JSON.parse(JSON.stringify(ZERO)),
    auto: JSON.parse(JSON.stringify(AZERO)),
  };
}

export let S = fresh();
try {
  const d = JSON.parse(localStorage.getItem(KEY));
  if (d) S = Object.assign(fresh(), d, {
    ascStats: Object.assign({val:0,autoGain:0,crit:0,goldVal:0}, d.ascStats),
    ch: Object.assign(JSON.parse(JSON.stringify(ZERO)), d.ch),
    auto: Object.assign(JSON.parse(JSON.stringify(AZERO)), d.auto),
  });
} catch (e) {}

export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function replaceState(next) { S = next; }

export const GOLD_MAXLV = 10, GOLD_UNLOCK_COST = 2000;
export const RANGE_BASE = 80, RANGE_G = 2.5, LIFE_BASE = 20, LIFE_G = 1.6;

export const rng = () => 8 + 6 * S.range;
export const life = () => 2 + .5 * S.life;
export const valMul = () => 1 + S.ascStats.val * .08;
export const critChance = () => S.ascStats.crit * .03;
export const autoGainMul = () => 1 + S.ascStats.autoGain * .15;
export const goldValMul = () => 1 + S.ascStats.goldVal * .5;
export const goldProb = () => S.goldUnlock ? .0033 + .00133 * S.goldLv : 0;
export function ascCost(n) { return Math.ceil(30 * Math.pow(2.2, n)); }

export function lv(c) { return S.ch[c.id]; }
export function alv(a) { return S.auto[a.id]; }
export function strainT(c) { return c.baseStrain * Math.pow(.85, lv(c).strain); }
export function walkSp(c) { return c.baseWalk * Math.pow(1.15, lv(c).freq); }
export function val(c) { return (c.baseVal + lv(c).value) * valMul(); }
