import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ConfigProvider, ExternalLinkProvider } from 'src/app/providers';
import { IOrder } from '../../swap/model/order-model';

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'modal.component.html',
})


export class DialogCustomComponent {
  public noteValue = '';
  public isUpdate = false;
  blockexplorerUrl = '';
  public endedOnStr = '';
  public createdOnStr = '';
  constructor(
    private bwcErrorProvider: BwcErrorProvider,
    private externalLinkProvider: ExternalLinkProvider,
    public dialogRef: MatDialogRef<DialogCustomComponent>,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    @Inject(MAT_DIALOG_DATA) public data: IOrder,
  ) {
    if(data.note && data.note.trim().length > 0){
      this.noteValue = data.note;
      this.isUpdate = true;
    }
    this.createdOnStr = new Date(data.createdOn).toUTCString();
    this.endedOnStr = new Date(data.endedOn).toUTCString();
  }


  onNoClick(): void {
    this.dialogRef.close();
  }

  handleNote(){
    if(this.noteValue && this.noteValue.trim().length > 0 && this.noteValue !== this.data.note){
      this.data.note = this.noteValue;
      this.dialogRef.close(this.data);
    } else
      this.dialogRef.close();
    
  }

  public viewOnBlockchain(coin, isToken, txId): void {
    let defaults = this.configProvider.getDefaults();
    const coinSelected = isToken ? 'xec' : coin;
    this.blockexplorerUrl = defaults.blockExplorerUrl[coinSelected];
    // let btx = this.btx;
    // const coin = btx.coin;
    const url = `https://${this.blockexplorerUrl}tx/${txId}`;
    this.externalLinkProvider.openBrowser(true, url);
    // let optIn = true;
    // let title = null;
    // let message = this.translate.instant('View Transaction');
    // let okText = this.translate.instant('Open');
    // let cancelText = this.translate.instant('Go Back');
    // this.externalLinkProvider.open(
    //   url,
    //   optIn,
    //   title,
    //   message,
    //   okText,
    //   cancelText
    // );
  }
  
}