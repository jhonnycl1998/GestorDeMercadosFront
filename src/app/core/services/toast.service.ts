import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastNotification[]>([]);
  public toasts = this.toastsSignal.asReadonly();
  private counter = 0;

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info', title?: string, durationMs = 4500): void {
    const id = ++this.counter;
    const toast: ToastNotification = { id, message, type, title };
    
    this.toastsSignal.update(list => [...list, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  success(message: string, title: string = 'Éxito'): void {
    this.show(message, 'success', title);
  }

  error(message: string, title: string = 'Error'): void {
    this.show(message, 'danger', title);
  }

  warning(message: string, title: string = 'Advertencia'): void {
    this.show(message, 'warning', title);
  }

  info(message: string, title: string = 'Información'): void {
    this.show(message, 'info', title);
  }

  remove(id: number): void {
    this.toastsSignal.update(list => list.filter(t => t.id !== id));
  }
}
