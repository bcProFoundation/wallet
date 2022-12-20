import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  BwcErrorProvider,
  ErrorsProvider,
  OnGoingProcessProvider,
  ConversionProvider
} from 'src/app/providers';
import {
  CreatePasswordConversionComponent,
  PassWordHandleCases
} from '../create-password/create-password.component';
import { IApproveOpts } from '../login-admin/login-admin.component';
import { ConversionAuthenticationService } from '../service/authentication.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-import-seed',
  templateUrl: './import-seed.component.html',
  styleUrls: ['./import-seed.component.scss']
})
export class ImportSeedConversionComponent implements OnInit {
  public password!: string;
  public formData!: FormGroup;
  public showErrorVerifyPassword = false;
  public showErrorImportSeed = false;
  public message: string;
  public isShowImportSeed = false;
  public keyFund!: string;
  public keyReceive!: string;
  public isFinish = false;
  public isShowMessageFoundKey = false;
  public isTextFieldType: boolean;
  constructor(
    private conversionProvider: ConversionProvider,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private authenticationService: ConversionAuthenticationService,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private router: Router,
    public dialog: MatDialog,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.formData = new FormGroup({
      password: new FormControl('', [Validators.required]),
      keyFund: new FormControl('', [Validators.required]),
    });
    this.conversionProvider
      .login({ id_token: this.authenticationService.currentUserValue })
      .then((approveReq: IApproveOpts) => {
        if (approveReq.isVerified) {
          if (!approveReq.isCreatePassword) {
            // this.router.navigate(['/dashboard/create-password'], {
            //   state: {
            //     passwordHandleCases: PassWordHandleCases.CreateNewPassword
            //   }
            // });
            this.dialog.open(CreatePasswordConversionComponent, {
              width: '604px',
              panelClass: 'create-password-dialog',
              data: {
                passWordHandleCases: PassWordHandleCases.CreateNewPassword
              }
            });
          }
        }
      })
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
  }

  async presentToast(finishText, cssClass?) {
    const toast = await this.toastController.create({
      message: finishText,
      duration: 3000,
      position: 'top',
      animated: true,
      cssClass: `custom-finish-toast ${cssClass}`,
    });
    toast.present();
  }

  startQueue(){
    this.onGoingProcessProvider.set('Processing');
    this.conversionProvider.startQueue().then(result => {
      if(result){
        this.presentToast("Queue start successfully")
      } else{
        this.showErrorInfoSheet("Can not show info sheet");
      }
    }).catch(e => {
      this.showErrorInfoSheet(e);
    }).finally(()=>{
      this.onGoingProcessProvider.clear();
    })
  }

  stopQueue(){
    this.onGoingProcessProvider.set('Processing');
    this.conversionProvider.stopQueue().then(result => {
      if(result){
        this.presentToast("Queue stop successfully")
      } else{
        this.showErrorInfoSheet("Can not show info sheet");
      }
    }).catch(e => {
      this.showErrorInfoSheet(e);
    }).finally(()=>{
      this.onGoingProcessProvider.clear();
    })
  }
  verifyPassword(data: any) {
    const userOpts = {
      id_token: this.authenticationService.currentUserValue,
      password: data.password
    };
    this.conversionProvider
      .verifyPassword(userOpts)
      .then(result => {
        this.isShowImportSeed = result;
        this.conversionProvider
          .checkKeyExist()
          .then(result => {
            this.isShowMessageFoundKey = result.isKeyExisted;
          })
          .catch(e => {
            this.showErrorVerifyPassword = true;
            this.message = e.error.error;
            // this.showErrorInfoSheet(e);
          });
      })
      .catch(e => {
        this.showErrorVerifyPassword = true;
        this.message = e.error.error;
        // this.showErrorInfoSheet(e);
      });
  }
  importSeed(data: any) {
    const keysOpts = {
      id_token: this.authenticationService.currentUserValue,
      keyFund: data.keyFund
    };
    this.onGoingProcessProvider.set('Processing');
    this.conversionProvider
      .importSeed(keysOpts)
      .then(result => {
        this.isFinish = result;
      })
      .catch(e => {
        this.isFinish = false;
        this.showErrorImportSeed = true;
        this.message = e.error.error;
      })
      .finally(() => {
        this.onGoingProcessProvider.clear();
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
      }
    );
  }
  redirectForgotPasswordPage() {
    this.dialog.open(CreatePasswordConversionComponent, {
      width: '604px',
      panelClass: 'create-password-dialog',
      data: { passWordHandleCases: PassWordHandleCases.ForgotPassword }
    });
  }

  togglemyPasswordFieldType() {
    this.isTextFieldType = !this.isTextFieldType;
  }
}
