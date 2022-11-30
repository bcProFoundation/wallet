import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ErrorsProvider, OrderProvider } from 'src/app/providers';
import { AuthenticationService } from '../service/authentication.service';

export enum PassWordHandleCases {
  ForgotPassword = 1,
  CreateNewPassword,
  SuccessfulInfo
}

@Component({
  selector: 'app-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
})
export class CreatePasswordComponent implements OnInit {
  public PassWordHandleCases = {
    ForgotPassword : 1,
    CreateNewPassword : 2,
    SuccessfulInfo:3
  }
  navPramss: any;
  public password = '';
  public oldPassword = '';
  public newPassword = '';
  public recoveryKey = '';
  public confirmPassword = '';
  public recoveryKeyInput = '';
  public passwordHandleCases = 0;
  public handleCasePassword = 0;

  constructor(
    private orderProvider: OrderProvider,
    private authenticaionService: AuthenticationService,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private router: Router,
    public dialogRef: MatDialogRef<CreatePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { 
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    if(this.navPramss.passwordHandleCases){
      this.passwordHandleCases = this.navPramss.passwordHandleCases;
    }
    this.passwordHandleCases = this.data.passWordHandleCases;
    this.handleCasePassword = this.data?.passWordHandleCases;
  }

    ngOnInit(): void {
    }

  createPassword(){
    if(this.password.trim().length === 0 ){
      return this.showErrorInfoSheet(new Error("Password can not be empty"));
    }
    if(this.password !== this.confirmPassword){
      return this.showErrorInfoSheet(new Error("Invalid password confirmation . Please try again"))
    }
    const userOpts ={ 
      id_token: this.authenticaionService.currentUserValue,
      password: this.password
    }
    this.orderProvider.createPassword(userOpts).then(recoveryKeyServerReturn => {
      this.handleCasePassword = PassWordHandleCases.SuccessfulInfo;
      this.recoveryKey = recoveryKeyServerReturn;
    }).catch(e => {
      this.showErrorInfoSheet(e);
    })
  }

  reNewPassword(){
    const userOpts = {
      id_token: this.authenticaionService.currentUserValue,
      newPassword: this.newPassword,
      oldPassword: '',
      recoveryKey: ''
    } ;
    
    if(this.oldPassword){
     userOpts.oldPassword = this.oldPassword
    } else {
     userOpts.recoveryKey = this.recoveryKeyInput
    }
    this.orderProvider.renewPassword(userOpts).then(recoveryKey => {
      this.data.passwordHandleCases = PassWordHandleCases.SuccessfulInfo;
      this.recoveryKey = recoveryKey;
    })
  }

  reNewPassword1(){
    this.handleCasePassword = 3;
  }

  reNewPassword2(){
    this.handleCasePassword = 2;
  }

  public showErrorInfoSheet(
    error: any,
    title?: string,
    exit?: boolean
  ): void {
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
