import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'claim-voucher-modal',
  templateUrl: './claim-voucher-modal.component.html',
  styleUrls: ['./claim-voucher-modal.component.scss'],
})
export class ClaimVoucherModalComponent implements OnInit {
  name: string;
  result: any;
  dataModal: any;
  constructor(
    private modalCtrl: ModalController,
    private navParams : NavParams
    ) {
      this.result = this.navParams.data.result;
    }

  ngOnInit() {
    if (this.result) {
      // Call api to validate & get data voucher 
      this.dataModal = {
        name: this.result.pageName,
        voucher: {
          value: this.result.amount,
          chain: 'XPI'
        },
        walletName: this.result.name,
        keyName: this.result.walletGroupName
      }
    }
  }
}
