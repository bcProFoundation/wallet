import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ErrorsProvider, ConversionProvider } from 'src/app/providers';
import { ConversionAuthenticationService } from '../service/authentication.service';

export enum PassWordHandleCases {
  ForgotPassword = 1,
  CreateNewPassword,
  SuccessfulInfo
}

@Component({
  selector: 'conversion-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreatePasswordConversionComponent implements OnInit {
  public PassWordHandleCases = {
    ForgotPassword : 1,
    CreateNewPassword : 2,
    SuccessfulInfo:3
  }
  navPramss: any;
  public password!: string;
  public oldPassword!: string;
  public newPassword!: string;
  public recoveryKey!: string;
  public confirmPassword!: string;
  public recoveryKeyInput!: string;
  public formData!: FormGroup;
  public showError: boolean = false;
  public message:string;
  public passwordHandleCases = 0;
  public handleCasePassword = 0;
  public isPasswordHide = true;
  public isConfirmPasswordHide = true;
  public isOldPasswordHide = true;
  public isRecoveryKeyHide = true;
  public isNewPassword = true;

  constructor(
    private conversionProvider: ConversionProvider,
    private authenticaionService: ConversionAuthenticationService,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private router: Router,
    public dialogRef: MatDialogRef<CreatePasswordConversionComponent>,
    private changeRef: ChangeDetectorRef,
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

  ngOnInit() {
    this.formData = new FormGroup({
      password: new FormControl("", [Validators.required]),
      oldPassword: new FormControl("", [Validators.required]),
      newPassword: new FormControl("", [Validators.required]),
      recoveryKey: new FormControl("", [Validators.required]),
      recoveryKeyInput: new FormControl("", [Validators.required]),
      confirmPassword: new FormControl("", [Validators.required]),
    });
  }

  createPassword(data: any){
    if(data.password.trim().length === 0 ){
      // return this.showErrorInfoSheet(new Error("Password can not be empty"));
      this.showError = true,
      this.message = "Password can not be empty"
    }
    else if(data.password !== this.confirmPassword) {
      // return this.showErrorInfoSheet(new Error("Invalid password confirmation . Please try again"))
      this.showError = true,
      this.message = "Invalid password confirmation . Please try again"
    } else{
      const userOpts ={ 
        id_token: this.authenticaionService.currentUserValue,
        password: data.password
      }
      this.conversionProvider.createPassword(userOpts).then(recoveryKeyServerReturn => {
        this.handleCasePassword = PassWordHandleCases.SuccessfulInfo;
        this.recoveryKey = recoveryKeyServerReturn;
        this.changeRef.markForCheck();
      }).catch(e => {
        // this.showErrorInfoSheet(e);
        this.showError = true;
        this.message = e.error.error; 
      })
    }
  }

  reNewPassword(data: any){
    const userOpts = {
      id_token: this.authenticaionService.currentUserValue,
      newPassword: data.newPassword,
      oldPassword: '',
      recoveryKey: ''
    } ;
    
    if(this.oldPassword){
     userOpts.oldPassword = data.oldPassword
    } else {
     userOpts.recoveryKey = data.recoveryKeyInput
    }
    this.conversionProvider.renewPassword(userOpts).then(recoveryKey => {
      this.handleCasePassword = PassWordHandleCases.SuccessfulInfo;
      this.recoveryKey = recoveryKey;
      this.changeRef.markForCheck();
    }).catch(e => {
      // this.showErrorInfoSheet(e);
      this.showError = true;
      this.message = e.error.error; 
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
