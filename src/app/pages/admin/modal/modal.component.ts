import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ConfigProvider, ErrorsProvider, ExternalLinkProvider, OrderProvider } from 'src/app/providers';
import { IOrder } from '../../swap/model/order-model';
import { PopupCustomComponent } from '../popup/popup.component';

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'modal.component.html',
  styleUrls: ['./modal.component.scss']
})


export class DialogCustomComponent {
  public noteValue = '';
  public isUpdate = false;
  blockexplorerUrl = '';
  public endedOnStr = '';
  public createdOnStr = '';
  constructor(
    private orderProvider: OrderProvider,
    public dialog: MatDialog,
    private errorsProvider: ErrorsProvider,
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
  
  handleChangeStatus(order) {
    order.status = 'complete';
    this.orderProvider
      .updateOrder(order)
      .then()
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
  }
  public viewChangeStatusPopup(order: IOrder, $event) {
    $event.stopPropagation()
    this.handleOpenPopupStatus(order)
  }
  handleOpenPopupStatus(order) {
    this.popupChangeStatusDialog(order);
  }
  popupChangeStatusDialog(order): void {
    const popupDialogRef = this.dialog.open(PopupCustomComponent, {
      data: order
    });

    popupDialogRef.afterClosed().subscribe(result => {
      if (result == true) {
        this.handleChangeStatus(order);
      }
      order.status == 'pending';
      order.status = order.status === 'pending';
      result = order.status === true ? null : false;
    });
  }


  handleChangeResolve(order) {
    order.isResolve = true;
    this.orderProvider
      .updateOrder(order)
      .then()
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
  }
  public viewChangeResolvePopup(order: IOrder, $event) {
    $event.stopPropagation()
    this.handleOpenPopupResolve(order)
  }
  handleOpenPopupResolve(order) {
    this.popupChangeResolveDialog(order);
  }
  popupChangeResolveDialog(order): void {
    const popupDialogRef = this.dialog.open(PopupCustomComponent, {
      data: order
    });

    popupDialogRef.afterClosed().subscribe(result => {
      if (result == true) {
        this.handleChangeResolve(order);
      }
      order.isResolve = order.isResolve === true ? null : true;
      result = order.isResolve === true ? null : false;
    });
  }

  public showErrorInfoSheet(error: any, title?: string, exit?: boolean): void {
    let msg: string;
    if (!error) return;
    // Currently the paypro error is the following string: 500 - "{}"
    if (error.status === 500) {
      msg = error.error.error;
    }

    const infoSheetTitle = title ? title : this.translate.instant('Error');

    this.errorsProvider.showDefaultError(
      msg || this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        // if (exit) {
        //   this.location.back()
        // }
      }
    );
  }
}