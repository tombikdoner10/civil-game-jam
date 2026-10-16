import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/vt323/400.css';
import * as Phaser from 'phaser';
import { COLORS, DEV, HEIGHT, TEAM, TITLE, WIDTH } from './config';
import { sfx } from './audio/sfx';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DayEndScene } from './scenes/DayEndScene';
import { DebugScene } from './scenes/DebugScene';
import { GameScene } from './scenes/GameScene';
import { GateScene } from './scenes/GateScene';
import { MenuScene } from './scenes/MenuScene';
import { NewspaperScene } from './scenes/NewspaperScene';
import { QuakeScene } from './scenes/QuakeScene';
import { PauseScene } from './scenes/PauseScene';
import { PlaygroundScene } from './scenes/PlaygroundScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SplashScene } from './scenes/SplashScene';

document.title = `${TITLE} · ${TEAM}`;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: COLORS.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  disableContextMenu: true,
  banner: false,
  // Sıra önemli: listede sonra gelen sahne üstte çizilir (Pause/Settings katmanları, en üstte Debug).
  scene: [
    BootScene,
    PreloadScene,
    GateScene,
    SplashScene,
    MenuScene,
    GameScene,
    DayEndScene,
    QuakeScene,
    NewspaperScene,
    ResultScene,
    CreditsScene,
    PlaygroundScene,
    PauseScene,
    SettingsScene,
    DebugScene,
  ],
});

// Geliştirirken tarayıcı konsolundan incelemek için: window.game
if (import.meta.env.DEV) Object.assign(window, { game });
// Ses testleri için (yayında ve ZIP'te de ?dev ile): window.sfx.sayac efektlerin kaç kez, hangi kaynaktan çaldığını tutar.
if (DEV) Object.assign(window, { sfx });
