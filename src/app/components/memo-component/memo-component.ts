import { Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'memo-component',
  templateUrl: 'memo-component.html',
  styleUrls: ['memo-component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MemoComponent extends ActionSheetParent {
  public memoForm: UntypedFormGroup;

  constructor(private formBuilder: UntypedFormBuilder) {
    super();
    this.memoForm = this.formBuilder.group({
      memo: ['']
    });
  }

  ngOnInit() {
    this.memoForm.setValue({
      memo: this.params.memo || ''
    });
  }

  public optionClicked(): void {
    this.dismiss(this.memoForm.value.memo);
  }
}
