import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrcamentoInputComponent } from './orcamento-input.component';

describe('OrcamentoInputComponent', () => {
  let fixture: ComponentFixture<OrcamentoInputComponent>;
  let component: OrcamentoInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrcamentoInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrcamentoInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be invalid when empty', () => {
    component.orcamento = null;
    expect(component.invalido).toBeFalse();
  });

  it('should not be invalid for a positive value', () => {
    component.orcamento = 120;
    expect(component.invalido).toBeFalse();
  });

  it('should be invalid for zero', () => {
    component.orcamento = 0;
    expect(component.invalido).toBeTrue();
  });

  it('should be invalid for a negative value', () => {
    component.orcamento = -5;
    expect(component.invalido).toBeTrue();
  });

  it('should emit orcamentoChange on change', () => {
    const spy = jasmine.createSpy('change');
    component.orcamentoChange.subscribe(spy);
    component.onChange(120);
    expect(spy).toHaveBeenCalledWith(120);
  });

  it('should emit null when the field is cleared to empty string', () => {
    const spy = jasmine.createSpy('change');
    component.orcamentoChange.subscribe(spy);
    component.onChange('');
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('should coerce NaN input to null', () => {
    component.onChange(Number.NaN);
    expect(component.orcamento).toBeNull();
  });

  it('should reset and emit on limpar', () => {
    const changeSpy = jasmine.createSpy('change');
    const limparSpy = jasmine.createSpy('limpar');
    component.orcamentoChange.subscribe(changeSpy);
    component.limpar.subscribe(limparSpy);
    component.orcamento = 100;
    component.onLimpar();
    expect(component.orcamento).toBeNull();
    expect(changeSpy).toHaveBeenCalledWith(null);
    expect(limparSpy).toHaveBeenCalled();
  });

  it('should show the clear button only when a value is set', () => {
    component.orcamento = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-btn')).toBeFalsy();
    component.orcamento = 50;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-btn')).toBeTruthy();
  });

  it('should show the error message when invalid', () => {
    component.orcamento = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });

  it('should emit submit on Enter when valid', () => {
    const spy = jasmine.createSpy('submit');
    component.submit.subscribe(spy);
    component.orcamento = 120;
    component.onEnter();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit submit on Enter when invalid', () => {
    const spy = jasmine.createSpy('submit');
    component.submit.subscribe(spy);
    component.orcamento = 0;
    component.onEnter();
    expect(spy).not.toHaveBeenCalled();
  });
});
