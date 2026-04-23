import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let component: LoadingSpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render spinner ring', () => {
    const spinner = fixture.nativeElement.querySelector('.spinner-ring');
    expect(spinner).toBeTruthy();
  });

  it('should not render message when message is empty', () => {
    component.message = '';
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.spinner-message');
    expect(msg).toBeNull();
  });

  it('should render message when provided', () => {
    component.message = 'Carregando dados...';
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.spinner-message');
    expect(msg).toBeTruthy();
    expect(msg.textContent.trim()).toBe('Carregando dados...');
  });

  it('should not apply full-page class by default', () => {
    const container = fixture.nativeElement.querySelector('.spinner-container');
    expect(container.classList.contains('full-page')).toBeFalse();
  });

  it('should apply full-page class when fullPage is true', () => {
    component.fullPage = true;
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.spinner-container');
    expect(container.classList.contains('full-page')).toBeTrue();
  });
});
