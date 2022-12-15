import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ConfigProvider, ErrorsProvider, ExternalLinkProvider, OrderProvider } from 'src/app/providers';
import { IOrder } from '../../swap/model/order-model';

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'popup.component.html',
  styleUrls: ['./popup.component.scss']
})


export class PopupCustomComponent {
  constructor(
    public dialogRef: MatDialogRef<PopupCustomComponent>,
  ) {}
}