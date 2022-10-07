import { Component, OnInit } from '@angular/core';
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
  navPramss: any;
  public password = '';
  public oldPassword = '';
  public newPassword = '';
  public recoveryKey = '';
  public recoveryKeyInput = '';
  public passwordHandleCases = 0;
  public PassWordHandleCases = PassWordHandleCases;

  constructor(
    private orderProvider: OrderProvider,
    private authenticaionService: AuthenticationService,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private router: Router
  ) { 
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    if(this.navPramss.passwordHandleCases){
      this.passwordHandleCases = this.navPramss.passwordHandleCases;
    }
  }

  ngOnInit() {}

  createPassword(){
    const userOpts ={ 
      id_token: this.authenticaionService.currentUserValue,
      password: this.password
    }
    this.orderProvider.createPassword(userOpts).then(recoveryKeyServerReturn => {
      this.passwordHandleCases = PassWordHandleCases.SuccessfulInfo;
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
      this.passwordHandleCases = PassWordHandleCases.SuccessfulInfo;
      this.recoveryKey = recoveryKey;
    })
    
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
