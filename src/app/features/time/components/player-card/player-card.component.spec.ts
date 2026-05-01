import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PlayerCardComponent } from './player-card.component';
import { Atleta } from '../../../../shared/models/atleta.model';

const baseAtleta: Atleta = {
  apelido: 'Gabigol',
  posicao: 'ATA',
  clube: 'Flamengo (FLA)',
  mediaPontos: 7.5,
  valorizacao: 1.2,
  preco: 15.0,
  score: 6.0,
  emDuvida: false
};

describe('PlayerCardComponent', () => {
  let fixture: ComponentFixture<PlayerCardComponent>;
  let component: PlayerCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerCardComponent);
    component = fixture.componentInstance;
    component.atleta = { ...baseAtleta };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display player apelido', () => {
    const name = fixture.nativeElement.querySelector('.player-name');
    expect(name.textContent.trim()).toBe('Gabigol');
  });

  it('should display player club', () => {
    const club = fixture.nativeElement.querySelector('.player-club');
    expect(club.textContent.trim()).toBe('Flamengo (FLA)');
  });

  it('should display position badge with correct data-pos attribute', () => {
    const badge = fixture.nativeElement.querySelector('.pos-badge');
    expect(badge.getAttribute('data-pos')).toBe('ATA');
    expect(badge.textContent.trim()).toBe('ATA');
  });

  it('should not show doubt tag when emDuvida is false', () => {
    const tag = fixture.nativeElement.querySelector('.tag-doubt');
    expect(tag).toBeNull();
  });

  it('should show doubt tag when emDuvida is true', () => {
    component.atleta = { ...baseAtleta, emDuvida: true };
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('.tag-doubt');
    expect(tag).toBeTruthy();
  });

  it('should not show captain tag by default', () => {
    const tag = fixture.nativeElement.querySelector('.tag-captain');
    expect(tag).toBeNull();
  });

  it('should show captain tag when isCaptain is true', () => {
    component.isCaptain = true;
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('.tag-captain');
    expect(tag).toBeTruthy();
  });

  it('should apply is-captain class when isCaptain is true', () => {
    component.isCaptain = true;
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.player-card');
    expect(card.classList.contains('is-captain')).toBeTrue();
  });

  it('should apply is-doubt class when emDuvida is true', () => {
    component.atleta = { ...baseAtleta, emDuvida: true };
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.player-card');
    expect(card.classList.contains('is-doubt')).toBeTrue();
  });

  it('should show luxury reserve tag when isLuxuryReserve is true', () => {
    component.isLuxuryReserve = true;
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('.tag-luxury');
    expect(tag).toBeTruthy();
  });

  it('should show substitute info when emDuvida and substitutoProvavel are set', () => {
    component.atleta = {
      ...baseAtleta,
      emDuvida: true,
      substitutoProvavel: { ...baseAtleta, apelido: 'Pedro' }
    };
    fixture.detectChanges();
    const subRow = fixture.nativeElement.querySelector('.sub-row');
    expect(subRow).toBeTruthy();
    expect(subRow.textContent).toContain('Pedro');
  });

  it('should not show substitute info when emDuvida is false', () => {
    component.atleta = { ...baseAtleta, emDuvida: false };
    fixture.detectChanges();
    const subRow = fixture.nativeElement.querySelector('.sub-row');
    expect(subRow).toBeNull();
  });

  it('should calculate scorePercent as 50% when score is 6 (max 12)', () => {
    component.atleta = { ...baseAtleta, score: 6 };
    expect(component.scorePercent).toBe(50);
  });

  it('should clamp scorePercent at 100 for scores above 12', () => {
    component.atleta = { ...baseAtleta, score: 20 };
    expect(component.scorePercent).toBe(100);
  });

  it('should calculate scorePercent as 0 for score 0', () => {
    component.atleta = { ...baseAtleta, score: 0 };
    expect(component.scorePercent).toBe(0);
  });

  it('should show score criteria from API metadata', () => {
    component.atleta = { ...baseAtleta, criterioScore: 'Atacante ofensivo' };
    fixture.detectChanges();
    const context = fixture.nativeElement.querySelector('.score-context');
    expect(context.textContent).toContain('Atacante ofensivo');
  });

  it('should show defensive fallback score criteria for goalkeepers', () => {
    component.atleta = { ...baseAtleta, posicao: 'GOL' };
    fixture.detectChanges();
    const context = fixture.nativeElement.querySelector('.score-context');
    expect(context.textContent).toContain('Critério defensivo da posição');
  });

  it('should show positive valorizacao', () => {
    component.atleta = { ...baseAtleta, valorizacao: 2.5 };
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.valorizacao');
    expect(val).toBeTruthy();
    expect(val.textContent).toContain('+');
    expect(val.classList.contains('pos')).toBeTrue();
  });

  it('should show negative valorizacao', () => {
    component.atleta = { ...baseAtleta, valorizacao: -1.5 };
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.valorizacao');
    expect(val.classList.contains('neg')).toBeTrue();
  });

  it('should not show valorizacao row when valorizacao is 0', () => {
    component.atleta = { ...baseAtleta, valorizacao: 0 };
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.valorizacao');
    expect(val).toBeNull();
  });
});
