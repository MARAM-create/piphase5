import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _counter = 0;
  readonly toasts = signal<Toast[]>([]);

  /**
   * Display a toast notification.
   * @param message  Text to display
   * @param type     'success' (green) | 'error' (red) | 'warning' (orange) | 'info' (blue)
   * @param duration Auto-dismiss delay in ms (default 4000)
   */
  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this._counter;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  // Convenience helpers
  success(message: string, duration = 4000) { this.show(message, 'success', duration); }
  error(message: string, duration = 5000)   { this.show(message, 'error', duration); }
  warning(message: string, duration = 4000) { this.show(message, 'warning', duration); }
  info(message: string, duration = 4000)    { this.show(message, 'info', duration); }
}
