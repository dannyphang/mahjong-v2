import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MahjongComponent } from './mahjong.component';

describe('MahjongComponent', () => {
  let component: MahjongComponent;
  let fixture: ComponentFixture<MahjongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MahjongComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MahjongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
