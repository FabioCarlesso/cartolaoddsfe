import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AlertBannerComponent } from './alert-banner.component';

describe('AlertBannerComponent', () => {
  let fixture: ComponentFixture<AlertBannerComponent>;
  let component: AlertBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBannerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render message text', () => {
    component.message = 'Mercado fechado.';
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.alert-message');
    expect(msg.textContent.trim()).toBe('Mercado fechado.');
  });

  it('should apply alert-warning class for type warning', () => {
    component.type = 'warning';
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.alert-banner');
    expect(banner.classList.contains('alert-warning')).toBeTrue();
  });

  it('should apply alert-error class for type error', () => {
    component.type = 'error';
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.alert-banner');
    expect(banner.classList.contains('alert-error')).toBeTrue();
  });

  it('should apply alert-success class for type success', () => {
    component.type = 'success';
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.alert-banner');
    expect(banner.classList.contains('alert-success')).toBeTrue();
  });

  it('should apply alert-info class for type info (default)', () => {
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.alert-banner');
    expect(banner.classList.contains('alert-info')).toBeTrue();
  });

  it('should return warning icon for type warning', () => {
    component.type = 'warning';
    expect(component.icon).toBe('⚠️');
  });

  it('should return error icon for type error', () => {
    component.type = 'error';
    expect(component.icon).toBe('❌');
  });

  it('should return success icon for type success', () => {
    component.type = 'success';
    expect(component.icon).toBe('✅');
  });

  it('should return info icon for type info', () => {
    component.type = 'info';
    expect(component.icon).toBe('ℹ️');
  });
});
