import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { IOrder } from '../../swap/model/order-model';

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'modal.component.html',
})


export class DialogCustomComponent {
  public noteValue = '';
  public isUpdate = false;
  constructor(
    public dialogRef: MatDialogRef<DialogCustomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IOrder,
  ) {
    if(data.note && data.note.trim().length > 0){
      this.noteValue = data.note;
      this.isUpdate = true;
    }
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
  
}