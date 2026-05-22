import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ConsistenciaBadgeComponent } from './consistencia-badge.component';

describe('ConsistenciaBadgeComponent', () => {
  let fixture: ComponentFixture<ConsistenciaBadgeComponent>;
  let component: ConsistenciaBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsistenciaBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsistenciaBadgeComponent);
    component = fixture.componentInstance;
  });

  function render(desvioPadrao?: number | null, rodadasConsideradas?: number | null): void {
    component.desvioPadrao = desvioPadrao ?? undefined;
    component.rodadasConsideradas = rodadasConsideradas ?? undefined;
    fixture.detectChanges();
  }

  it('should create', () => {
    render(1.5, 5);
    expect(component).toBeTruthy();
  });

  it('should render green emoji and consistente level for low deviation', () => {
    render(1.5, 5);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge');
    expect(badge.getAttribute('data-level')).toBe('consistente');
    expect(fixture.nativeElement.querySelector('.badge-dot').textContent.trim()).toBe('🟢');
  });

  it('should render yellow emoji for moderate deviation', () => {
    render(3.0, 5);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge');
    expect(badge.getAttribute('data-level')).toBe('moderado');
  });

  it('should render red emoji for high deviation', () => {
    render(5.2, 5);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge');
    expect(badge.getAttribute('data-level')).toBe('instavel');
  });

  it('should render neutral badge with tooltip when history is insufficient', () => {
    render(1.0, 1);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge');
    expect(badge.getAttribute('data-level')).toBe('indisponivel');
    expect(fixture.nativeElement.querySelector('.badge-dot').textContent.trim()).toBe('⚪');
    expect(fixture.nativeElement.textContent).toContain('Histórico insuficiente');
  });

  it('should render multi-line tooltip with value and rounds', () => {
    render(1.8, 5);
    const lines = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.tooltip-linha')
    ).map((el) => el.textContent?.trim());
    expect(lines).toEqual(['Desvio padrão: 1.8', 'Baseado nas últimas 5 rodadas']);
  });

  it('should expose an accessible aria-label', () => {
    render(1.8, 5);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge');
    expect(badge.getAttribute('aria-label')).toContain('Consistência: Consistente');
  });

  it('should toggle the tooltip open and closed on click/tap', () => {
    render(1.8, 5);
    const badge = fixture.nativeElement.querySelector('.consistencia-badge') as HTMLElement;
    expect(component.open).toBeFalse();
    badge.click();
    fixture.detectChanges();
    expect(component.open).toBeTrue();
    expect(badge.classList.contains('is-open')).toBeTrue();
    badge.click();
    fixture.detectChanges();
    expect(component.open).toBeFalse();
  });

  it('should close the tooltip when clicking outside the badge', () => {
    render(1.8, 5);
    component.open = true;
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(component.open).toBeFalse();
  });
});
