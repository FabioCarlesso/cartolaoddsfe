import { Component, Input } from '@angular/core';

export type AlertType = 'warning' | 'error' | 'info' | 'success';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  template: `
    <div class="alert-banner" [class]="'alert-' + type">
      <span class="alert-icon">{{ icon }}</span>
      <span class="alert-message">{{ message }}</span>
    </div>
  `,
  styles: [`
    .alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      line-height: 1.5;
    }

    .alert-icon {
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      color: #fbbf24;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
    }

    .alert-info {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.25);
      color: #60a5fa;
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.25);
      color: #4ade80;
    }
  `]
})
export class AlertBannerComponent {
  @Input() message = '';
  @Input() type: AlertType = 'info';

  get icon(): string {
    const icons: Record<AlertType, string> = {
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[this.type];
  }
}
