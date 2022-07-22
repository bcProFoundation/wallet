import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { CurrencyProvider } from 'src/app/providers';

@Component({
  selector: 'claim-voucher-modal',
  templateUrl: './claim-voucher-modal.component.html',
  styleUrls: ['./claim-voucher-modal.component.scss'],
})
export class ClaimVoucherModalComponent implements OnInit {
  name: string;
  result: any;
  dataModal: any;
  coinSupport: string = 'xpi'
  constructor(
    private currencyProvider: CurrencyProvider,
    private navParams : NavParams
    ) {
      this.result = this.navParams.data.result;
    }

  ngOnInit() {
    if (this.result) {
      // Call api to validate & get data voucher 
      this.dataModal = {
        name: this.result.pageName || 'Shop',
        voucher: {
          value: this.result.amount / this.currencyProvider.coinOpts[this.coinSupport].unitInfo.unitToSatoshi,
          chain: this.coinSupport
        },
        walletName: this.result.name,
        keyName: this.result.walletGroupName
      }
    }
  }
}
