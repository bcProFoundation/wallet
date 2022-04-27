import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { EventManagerService, ProfileProvider, ThemeProvider } from 'src/app/providers';

@Component({
  selector: 'sub-menu-account',
  templateUrl: './sub-menu-account.component.html',
  styleUrls: ['./sub-menu-account.component.scss'],
})
export class SubMenuAccountComponent implements OnInit {
  @Input()
  index?: number;

  @Input()
  isDisableBtn?: boolean;

  @Input()
  value?: any;
  
  @Input()
  keySelected?: any;

  @Input()
  walletGroup?: any;

  @Output()
  getKeySelect: EventEmitter<any> = new EventEmitter();

  @Output()
  disableBtn: EventEmitter<any> = new EventEmitter();

  @ViewChild('menuItem', { read: ElementRef, static: false }) menuItem: ElementRef;

  public isEditKeyName = false;
  public currentTheme;
  private tempName: string = '';
  constructor(
    private themeProvider: ThemeProvider,
    private profileProvider: ProfileProvider,
    private events: EventManagerService,
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
  }

  ngOnInit() {}

  public onClickOutSide(ev) {
    if (ev.target.className.includes('edit-flag-btn')) {
      this.tempName = this.value;
    } else {
      this.value = this.tempName;
      this.isEditKeyName = false;
      this.disableBtn.emit(false);
    }
  }

  public editKeyChange() {
    this.isEditKeyName = !this.isEditKeyName;
    if (this.isEditKeyName) this.disableBtn.emit(true);
  }

  public editKeyName(value) {
    if (this.isEditKeyName) {
      this.profileProvider.setWalletGroupName(
        this.walletGroup[0].keyId,
        value
      );
      this.events.publish('Local/GetData', true);
      this.getKeySelect.emit(this.walletGroup[0].keyId);
      this.disableBtn.emit(false);
    }
    this.isEditKeyName = !this.isEditKeyName;
  }

  public getKeySelected(keyId) {
    this.getKeySelect.emit(keyId);
  }

}
