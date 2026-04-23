import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TeamViewComponent } from './team-view.component';
import { TimeResponse } from '../../../../shared/models/time.model';
import { Atleta } from '../../../../shared/models/atleta.model';

const makeAtleta = (overrides: Partial<Atleta>): Atleta => ({
  apelido: 'Atleta',
  posicao: 'MEI',
  clube: 'Time (TIM)',
  mediaPontos: 5.0,
  valorizacao: 0.5,
  preco: 10.0,
  score: 6.0,
  emDuvida: false,
  ...overrides
});

const gol = makeAtleta({ apelido: 'Santos', posicao: 'GOL', score: 5.5 });
const lat1 = makeAtleta({ apelido: 'Rodinei', posicao: 'LAT', score: 5.0 });
const lat2 = makeAtleta({ apelido: 'Alex Sandro', posicao: 'LAT', score: 4.8 });
const zag1 = makeAtleta({ apelido: 'David Luiz', posicao: 'ZAG', score: 6.0 });
const zag2 = makeAtleta({ apelido: 'Léo Pereira', posicao: 'ZAG', score: 5.8 });
const mei1 = makeAtleta({ apelido: 'Arrascaeta', posicao: 'MEI', score: 9.5 });
const mei2 = makeAtleta({ apelido: 'Gerson', posicao: 'MEI', score: 8.0 });
const mei3 = makeAtleta({ apelido: 'Everton Ribeiro', posicao: 'MEI', score: 7.5 });
const ata1 = makeAtleta({ apelido: 'Gabigol', posicao: 'ATA', score: 10.0 });
const ata2 = makeAtleta({ apelido: 'Pedro', posicao: 'ATA', score: 9.5 });
const ata3 = makeAtleta({ apelido: 'Bruno Henrique', posicao: 'ATA', score: 8.8 });
const tec = makeAtleta({ apelido: 'Tite', posicao: 'TEC', score: 5.0 });

const mockTime: TimeResponse = {
  titulares: [gol, lat1, lat2, zag1, zag2, mei1, mei2, mei3, ata1, ata2, ata3, tec],
  reservas: [],
  capitao: ata1,
  reservaLuxo: ata2,
  alertasDuvida: [],
  avisoMercado: null,
  rodada: 15
};

describe('TeamViewComponent', () => {
  let fixture: ComponentFixture<TeamViewComponent>;
  let component: TeamViewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamViewComponent);
    component = fixture.componentInstance;
    component.time = mockTime;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter atacantes correctly', () => {
    expect(component.atacantes.length).toBe(3);
    expect(component.atacantes.every((a) => a.posicao === 'ATA')).toBeTrue();
  });

  it('should filter meias correctly', () => {
    expect(component.meias.length).toBe(3);
    expect(component.meias.every((a) => a.posicao === 'MEI')).toBeTrue();
  });

  it('should filter goleiros correctly', () => {
    expect(component.goleiros.length).toBe(1);
    expect(component.goleiros[0].posicao).toBe('GOL');
  });

  it('should filter tecnicos correctly', () => {
    expect(component.tecnicos.length).toBe(1);
    expect(component.tecnicos[0].posicao).toBe('TEC');
  });

  it('should include LAT and ZAG in defensores in order LAT-ZAG-ZAG-LAT', () => {
    const def = component.defensores;
    expect(def.length).toBe(4);
    expect(def[0].posicao).toBe('LAT');
    expect(def[1].posicao).toBe('ZAG');
    expect(def[2].posicao).toBe('ZAG');
    expect(def[3].posicao).toBe('LAT');
  });

  it('should identify captain correctly', () => {
    expect(component.isCapitao(ata1)).toBeTrue();
    expect(component.isCapitao(mei1)).toBeFalse();
  });

  it('should identify reserva de luxo correctly', () => {
    expect(component.isReservaLuxo(ata2)).toBeTrue();
    expect(component.isReservaLuxo(ata1)).toBeFalse();
  });

  it('should render pitch element', () => {
    const pitch = fixture.nativeElement.querySelector('.pitch');
    expect(pitch).toBeTruthy();
  });

  it('should render coach section when TEC is present', () => {
    const coachSection = fixture.nativeElement.querySelector('.coach-section');
    expect(coachSection).toBeTruthy();
  });

  it('should not render coach section when no TEC in titulares', () => {
    component.time = {
      ...mockTime,
      titulares: mockTime.titulares.filter((a) => a.posicao !== 'TEC')
    };
    fixture.detectChanges();
    const coachSection = fixture.nativeElement.querySelector('.coach-section');
    expect(coachSection).toBeNull();
  });

  it('should handle defensores when only ZAG (no LAT)', () => {
    const noLatTime: TimeResponse = {
      ...mockTime,
      titulares: mockTime.titulares.filter((a) => a.posicao !== 'LAT')
    };
    component.time = noLatTime;
    const def = component.defensores;
    expect(def.every((a) => a.posicao === 'ZAG')).toBeTrue();
  });
});
