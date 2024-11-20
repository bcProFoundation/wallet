import { Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'email-component',
  templateUrl: 'email-component.html',
  styleUrls: ['email-component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmailComponent extends ActionSheetParent {
  public emailForm: UntypedFormGroup;

  constructor(private externalLinkProvider: ExternalLinkProvider) {
    super();
    this.emailForm = new UntypedFormGroup({
      email: new UntypedFormControl(
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
          )
        ])
      ),
      agreement: new UntypedFormControl(false, Validators.requiredTrue)
    });
  }

  ngOnInit(){
    this.emailForm.setValue({
      email: ''
    });
  }

  public optionClicked(): void {
    this.dismiss(this.emailForm.value.email);
  }

  public openPolicy() {
    let url = 'https://bitpay.com/about/privacy';
    this.externalLinkProvider.open(url);
  }
}
