import { Component, signal, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent],
})
export class HomePage implements OnInit {
  readonly diceValue = signal<number>(1);
  readonly isRolling = signal<boolean>(false);
  readonly accelX = signal<number>(0);
  readonly accelY = signal<number>(0);
  readonly sensitivity = 5;

  private lastX = 0;
  private lastY = 0;
  private lastShakeTime = 0;
  private lastTouchTime = 0;

  ngOnInit(): void {
    this.initDeviceMotion();
  }

  roll(): void {
    if (this.isRolling()) {
      return;
    }

    this.isRolling.set(true);

    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}

    const finalValue = Math.floor(Math.random() * 6) + 1;

    window.setTimeout(() => {
      this.diceValue.set(finalValue);
    }, 180);

    window.setTimeout(() => {
      this.isRolling.set(false);
    }, 420);
  }

  onSliderInput(axis: 'x' | 'y', event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);

    if (axis === 'x') {
      this.accelX.set(Math.round(value * 10) / 10);
      if (Math.abs(value) >= this.sensitivity && !this.isRolling()) {
        this.roll();
      }
    } else {
      this.accelY.set(Math.round(value * 10) / 10);
      if (Math.abs(value) >= this.sensitivity && !this.isRolling()) {
        this.roll();
      }
    }
  }

  onSliderRelease(axis: 'x' | 'y', event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = '0';

    if (axis === 'x') {
      this.accelX.set(0);
      this.lastX = 0;
    } else {
      this.accelY.set(0);
      this.lastY = 0;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    const currentTime = Date.now();
    const timeSinceLastTouch = currentTime - this.lastTouchTime;

    if (timeSinceLastTouch > 0 && timeSinceLastTouch < 320) {
      event.preventDefault();
      this.roll();
    }
    this.lastTouchTime = currentTime;
  }

  private initDeviceMotion(): void {
    if (typeof window === 'undefined' || !('ondevicemotion' in window)) {
      return;
    }

    window.addEventListener('devicemotion', (event: DeviceMotionEvent) => {
      const accel = event.acceleration;
      if (accel && accel.x !== null && accel.y !== null && (accel.x !== 0 || accel.y !== 0)) {
        this.handleMotion(accel.x ?? 0, accel.y ?? 0, true);
        return;
      }

      const raw = event.accelerationIncludingGravity;
      if (raw && (raw.x !== null || raw.y !== null)) {
        this.handleMotion(raw.x ?? 0, raw.y ?? 0, false);
      }
    });
  }

  private handleMotion(x: number, y: number, isLinear: boolean): void {
    const deltaX = Math.abs(x - this.lastX);
    const deltaY = Math.abs(y - this.lastY);

    this.lastX = x;
    this.lastY = y;

    const displayX = isLinear ? Math.abs(x) : deltaX;
    const displayY = isLinear ? Math.abs(y) : deltaY;
    this.accelX.set(Math.round(displayX * 10) / 10);
    this.accelY.set(Math.round(displayY * 10) / 10);

    const now = Date.now();
    if ((deltaX >= this.sensitivity || deltaY >= this.sensitivity) && !this.isRolling() && now - this.lastShakeTime > 700) {
      this.lastShakeTime = now;
      this.roll();
    }
  }
}
