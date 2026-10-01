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
  - `game/src/gamedata.js`：キャラ・スキル・状態（セーブデータ）の定義
  - `game/src/MainScene.js`：Phaserのフィールド描画・シミュレーション
  - `game/src/ui.js`：スキルツリーUI（DOM側）
  - `game/src/main.js`：上記を組み合わせるエントリーポイント

## 開発の始め方
1. `cd game`
2. `npm run dev`
3. ブラウザで http://localhost:5173/ を開く（保存すると自動で反映される）

## Electron（デスクトップアプリ化）
- `game/electron/main.cjs`：Electronのメインプロセス。開発中はVite開発サーバー（http://localhost:5173）に接続する作りにしてある
- 起動手順：`npm run dev`でVite開発サーバーを立ち上げたまま、別途`npm run electron`を実行する
- 動作確認済み（2026-10-01）：フィールドの操作、スキルツリーのボタン操作ともに、ブラウザと同じように動くことを確認した
- 今後、本番ビルド（`npm run build`で作る`dist/index.html`）を読み込むモードへの切り替えや、steamworks.js連携、インストーラー作成（electron-builder）が必要になる
- Windows環境でGPUディスクキャッシュ関連のエラーログ（"Unable to move the cache"等）が出ることがあるが、動作に支障はない（無視してよい）

## つまずいたポイント（記録）
- 環境変数 `NODE_ENV=production` がシステムに設定されており、npm installがdevDependencies（vite、electron等）を既定でスキップしていた。`game/.npmrc`に`production=false`を設定して回避した
