const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.argv.includes('--dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // 開発中：Viteの開発サーバーに接続する（`npm run dev`を別途起動しておくこと）
    win.loadURL('http://localhost:5173');
  } else {
    // 本番：`npm run build`で作ったdist/index.htmlを直接読み込む
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
