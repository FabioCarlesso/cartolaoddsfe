import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForbiddenPageComponent } from './forbidden-page.component';

describe('ForbiddenPageComponent', () => {
  let fixture: ComponentFixture<ForbiddenPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should explain the restriction and offer a way back', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Acesso restrito');
    expect(fixture.nativeElement.querySelector('a.btn').getAttribute('href')).toBe('/time');
  });
});
