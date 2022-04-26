import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  value?: any;
  
  @Input()
  keySelected?: any;

  @Input()
  walletGroup?: any;

  @Output()
  getKeySelect: EventEmitter<any> = new EventEmitter();

  public isEditKeyName = false;
  public currentTheme;
  constructor(
    private themeProvider: ThemeProvider,
    private profileProvider: ProfileProvider,
    private events: EventManagerService,
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
  }

  ngOnInit() {}

  public editKeyChange() {
    this.isEditKeyName = !this.isEditKeyName;
  }

  public editKeyName(value) {
    if (this.isEditKeyName) {
      this.profileProvider.setWalletGroupName(
        this.walletGroup[0].keyId,
        value
      );
      this.events.publish('Local/GetData', true);
      this.getKeySelect.emit(this.walletGroup[0].keyId);
    }
    this.isEditKeyName = !this.isEditKeyName;
  }

  public getKeySelected(keyId) {
    this.getKeySelect.emit(keyId);
  }

}
