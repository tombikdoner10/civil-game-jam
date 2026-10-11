import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, WIDTH } from '../config';
import { popIn, pulse } from '../systems/fx';
import { storage } from '../systems/storage';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';

export interface ResultData {
  score?: number;
  won?: boolean;
  /** Başlığı değiştirmek için (varsayılan: "Tebrikler!" / "Oyun Bitti"). */
  title?: string;
}

/** Oyun sonu ekranı: skor sayacı, en iyi skor kaydı, tekrar/menü. */
export class ResultScene extends Phaser.Scene {
  private result: Required<Pick<ResultData, 'score' | 'won'>> & { title?: string } = { score: 0, won: true };

  constructor() {
    super(SCENES.Result);
  }

  init(data: ResultData): void {
    this.result = { score: data.score ?? 0, won: data.won ?? true, title: data.title };
  }

  create(): void {
    const { score, won } = this.result;
    fadeIn(this);
    addBackdrop(this, won ? COLORS.success : COLORS.danger);
    sfx.play(won ? 'win' : 'hurt');

    const previousBest = storage.get('best', 0);
    const isRecord = score > previousBest;
    if (isRecord) storage.set('best', score);

    const title = label(this, WIDTH / 2, 230, this.result.title ?? (won ? 'Tebrikler!' : 'Oyun Bitti'), {
      size: 120,
      weight: 'bold',
      color: won ? COLORS.primary : COLORS.danger,
    });
    popIn(this, title);

    label(this, WIDTH / 2, 380, 'Skor', { size: 36, color: COLORS.muted });
    const value = label(this, WIDTH / 2, 470, '0', { size: 110, weight: 'bold', mono: true });
    const best = label(this, WIDTH / 2, 575, isRecord ? 'Yeni rekor!' : `En iyi: ${previousBest}`, {
      size: 36,
      color: isRecord ? COLORS.success : COLORS.muted,
    }).setAlpha(0);

    this.tweens.addCounter({
      from: 0,
      to: score,
      duration: Math.min(1200, 300 + score * 4),
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => value.setText(String(Math.round(tween.getValue() ?? 0))),
      onComplete: () => {
        pulse(this, value, 0.12);
        this.tweens.add({ targets: best, alpha: 1, duration: 300 });
        if (isRecord) sfx.play('powerup');
      },
    });

    const buttons = [
      new Button(this, WIDTH / 2, 730, 'Tekrar Oyna', () => goTo(this, SCENES.Game)),
      new Button(this, WIDTH / 2, 852, 'Ana Menü', () => goTo(this, SCENES.Menu), { sound: 'back' }),
    ];
    buttons.forEach((button, i) => popIn(this, button, 400 + i * 80));
    new MenuNav(this, buttons);
  }
}
