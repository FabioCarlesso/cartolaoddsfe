import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-container" [class.full-page]="fullPage">
      <div class="spinner-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 3rem;

      &.full-page {
        min-height: 50vh;
      }
    }

    .spinner-ring {
      display: inline-block;
      position: relative;
      width: 52px;
      height: 52px;

      div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 42px;
        height: 42px;
        margin: 5px;
        border: 3px solid transparent;
        border-top-color: #22c55e;
        border-radius: 50%;
        animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;

        &:nth-child(1) { animation-delay: -0.45s; }
        &:nth-child(2) { animation-delay: -0.3s; }
        &:nth-child(3) { animation-delay: -0.15s; }
      }
    }

    .spinner-message {
      color: #94a3b8;
      font-size: 0.9rem;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message = '';
  @Input() fullPage = false;
}
