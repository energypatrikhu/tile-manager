import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron';
import electronContextMenu from 'electron-context-menu';
import electronServe from 'electron-serve';
import electronWindowState from 'electron-window-state';
import { join } from 'path';
import electronUpdater from 'electron-updater';
import { EventRouter } from './libs/event-router.js';

const { autoUpdater } = electronUpdater;
const serveURL = electronServe({
	directory: '.',
});

const port = process.env.PORT || 5173;
const isDev = !app.isPackaged || process.env.NODE_ENV === 'dev';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
	const windowState = electronWindowState({
		defaultWidth: 1280,
		defaultHeight: 720,
	});

	mainWindow = new BrowserWindow({
		// transparent: true,
		// frame: false,
		// alwaysOnTop: true,
		backgroundColor: '#000',
		// fullscreen: true,
		// skipTaskbar: true,
		titleBarStyle: 'default',
		autoHideMenuBar: false,
		minWidth: 1280,
		minHeight: 720,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: true,
			spellcheck: true,
			devTools: isDev,
			// devTools: true,
			preload: join(import.meta.dirname, 'preload.mjs'),
			disableBlinkFeatures: 'Auxclick',
			webSecurity: false,
		},
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
	});

	// mainWindow.setIgnoreMouseEvents(true);

	if (!isDev) {
		mainWindow.removeMenu();
	}

	if (isDev) {
		mainWindow.webContents.openDevTools({ mode: 'undocked' });
	}

	windowState.manage(mainWindow);
	mainWindow.on('close', () => {
		windowState.saveState(mainWindow!);
	});

	return mainWindow;
}

electronContextMenu({
	showLookUpSelection: false,
	showSearchWithGoogle: false,
	showCopyImage: false,
	showCopyLink: false,
	showSelectAll: false,
	showInspectElement: false,
});

function loadVite(port: any) {
	return new Promise<void>((resolve) => {
		mainWindow!
			.loadURL(`http://localhost:${port}`)
			.then(resolve)
			.catch((e) => {
				console.log('Error loading URL, retrying', e);
				setTimeout(() => {
					loadVite(port);
				}, 200);
			});
	});
}

async function createMainWindow() {
	mainWindow = createWindow();
	mainWindow.once('close', () => {
		mainWindow = null;
	});

	if (isDev) await loadVite(port);
	else await serveURL(mainWindow);

	// mainWindow.setBackgroundColor('#00000000');

	// const tray = new Tray('static/icon.png');
	// const contextMenu = Menu.buildFromTemplate([{ label: 'Kilépés', type: 'normal', click: () => app.quit() }]);
	// tray.setToolTip('Tile Manager');
	// tray.setContextMenu(contextMenu);

	new EventRouter(ipcMain, mainWindow, isDev);
}

app.once('ready', createMainWindow);
app.on('activate', () => {
	if (!mainWindow) {
		createMainWindow();
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

autoUpdater.on('checking-for-update', () => {
	console.log('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
	console.log('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
	console.log('Update not available.');
});
autoUpdater.on('error', (err) => {
	console.log('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
	let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
	log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
	log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
	console.log(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
	console.log('Update downloaded');
});
