# 開発環境（2026-09-29〜）

## 技術基盤
- ゲームフレームワーク：**Phaser**（`game/`フォルダ、npm install時にPhaser 4系が入った）
- ビルド・開発サーバー：**Vite**（`npm run dev`でホットリロード開発）
- 将来のパッケージング：Electron＋steamworks.js（Steam化のタイミングで導入）

## フォルダ構成
- `DOTOWN/`：素材の原本（このまま）
- `docs/`：仕様書・スキルツリー表・素材一覧
- `proto/`：これまでのHTML単体試作（v4まで、参照用に残す）
- `game/`：Phaser+Viteの本開発プロジェクト
  - `game/public/dotown/`：DOTOWN素材のビルド用コピー（原本はDOTOWN/、ここはpublic配信用の複製）
  - `game/src/main.js`：Phaserのメインシーン（現状は人間1体の移動→踏ん張り→クリック回収のみを移植した最小版）

## 開発の始め方
1. `cd game`
2. `npm run dev`
3. ブラウザで http://localhost:5173/ を開く（保存すると自動で反映される）

## つまずいたポイント（記録）
- 環境変数 `NODE_ENV=production` がシステムに設定されており、npm installがdevDependencies（vite）を既定でスキップしていた。`game/.npmrc`に`production=false`を設定して回避した
