import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ClaimVoucherModalComponent } from './claim-voucher-modal.component';

describe('ClaimVoucherModalComponent', () => {
  let component: ClaimVoucherModalComponent;
  let fixture: ComponentFixture<ClaimVoucherModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClaimVoucherModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimVoucherModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
