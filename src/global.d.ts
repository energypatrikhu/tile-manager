/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="@types/dom-speech-recognition" />

//
// Electron
//
declare namespace Electron {
  interface IpcMain {
    on: AppElectronReceiveEvent;
    once: AppElectronReceiveEvent;
  }
  interface WebContents {
    send: AppElectronSendEvent;
  }
}

type AppElectronSendEvent = <K extends keyof ElectronEventData>(
  event: K,
  data: ElectronEventData[K]['receive']['data'],
) => void;

type AppElectronReceiveEvent = <K extends keyof ElectronEventData>(
  event: K,
  fn: (event: Electron.IpcMainEvent, data: ElectronEventData[K]['send']['data']) => void,
) => void;

//
// Window
//
declare interface Window {
  electron: {
    send: WindowElectronSendEvent;
    sendSync: WindowElectronSendEvent;
    receive: WindowElectronReceiveEvent;
  };
}

type WindowElectronSendEvent = <K extends keyof ElectronEventData>(
  event: K,
  data: ElectronEventData[K]['send']['data'],
) => void;

type WindowElectronReceiveEvent = <K extends keyof ElectronEventData>(
  event: K,
  fn: (data: ElectronEventData[K]['receive']['data']) => void,
) => void;

//
// Events
//
interface ElectronEventData {
  update: {
    send: {};
    receive: {
      event: 'update';
      data: {
        message: string;
      };
    };
  };

  ready: {
    send: {
      event: 'ready';
    };
    receive: {
      event: 'ready';
      data: {
        versions: {
          electronVersion: string;
          appVersion: string;
        };
      };
    };
  };

  showOpenDialogSync: {
    send: {
      event: 'showOpenDialogSync';
      data: Electron.OpenDialogSyncOptions;
    };
    receive: {
      event: 'showOpenDialogSync';
      data: string[] | undefined;
    };
  };

  showSaveDialogSync: {
    send: {
      event: 'showSaveDialogSync';
      data: Electron.SaveDialogSyncOptions;
    };
    receive: {
      event: 'showSaveDialogSync';
      data: string | undefined;
    };
  };

  showMessageBoxSync: {
    send: {
      event: 'showMessageBoxSync';
      data: Electron.MessageBoxSyncOptions;
    };
    receive: {
      event: 'showMessageBoxSync';
      data: number;
    };
  };

  getSizes: {
    send: {
      event: 'getSizes';
      data: string;
    };
    receive: {
      event: 'getSizes';
      data: {
        sizes: {
          width: number;
          height: number;
        };
      };
    };
  };

  joinTiles: {
    send: {
      event: 'joinTiles';
      data: {
        tileGap: number;
        inputPath: string;
        inputExtension: string;
        outputPath: string;
        outputExtension: string;
        xQuantity: number;
        yQuantity: number;
        tileWidth: number;
        tileHeight: number;
        fullImageWidth: number;
        fullImageHeight: number;
        offset: number;
        positionFormat: '{n}' | '{x}-{y}' | '{y}-{x}' | 'template';
        positionTemplate: string;
      };
    };
    receive: {
      event: 'joinTiles';
      data: string;
    };
  };

  joinTilesFeedback: {
    send: {};
    receive: {
      event: 'joinTilesFeedback';
      data: {
        message: string;
      };
    };
  };

  multiplyTile: {
    send: {
      event: 'multiplyTile';
      data: {
        tileGap: number;
        inputPath: string;
        inputExtension: string;
        outputPath: string;
        outputExtension: string;
        xQuantity: number;
        yQuantity: number;
        tileWidth: number;
        tileHeight: number;
        fullImageWidth: number;
        fullImageHeight: number;
      };
    };
    receive: {
      event: 'multiplyTile';
      data: string;
    };
  };

  multiplyTileFeedback: {
    send: {};
    receive: {
      event: 'multiplyTileFeedback';
      data: {
        message: string;
      };
    };
  };

  extractTiles: {
    send: {
      event: 'extractTiles';
      data: {
        inputPath: string;
        inputExtension: string;
        outputPath: string;
        outputExtension: string;
        xQuantity: number;
        yQuantity: number;
        tileWidth: number;
        tileHeight: number;
        fullImageWidth: number;
        fullImageHeight: number;
        offset: number;
        positionFormat: '{n}' | '{x}-{y}' | '{y}-{x}' | 'template';
        positionTemplate: string;
      };
    };
    receive: {
      event: 'extractTiles';
      data: string;
    };
  };

  extractTilesFeedback: {
    send: {};
    receive: {
      event: 'extractTilesFeedback';
      data: {
        message: string;
      };
    };
  };
}
