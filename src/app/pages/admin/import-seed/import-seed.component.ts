import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ErrorsProvider, OrderProvider } from 'src/app/providers';
import { PassWordHandleCases } from '../create-password/create-password.component';
import { IApproveOpts } from '../login-admin/login-admin.component';
import { AuthenticationService } from '../service/authentication.service';

@Component({
  selector: 'app-import-seed',
  templateUrl: './import-seed.component.html',
  styleUrls: ['./import-seed.component.scss'],
})
export class ImportSeedComponent implements OnInit {
  public password = '';
  public isShowImportSeed = false;
  public keyFund = '';
  public keyReceive = '';
  public isFinish = false;
  constructor(
    private orderProvider: OrderProvider,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private authenticationService: AuthenticationService,
    private router: Router

  ) { }

  ngOnInit() {
    this.orderProvider.login({id_token: this.authenticationService.currentUserValue}).then( (approveReq : IApproveOpts) => {
      if(approveReq.isVerified){
        if(!approveReq.isCreatePassword) {
          this.router.navigate(['/dashboard/create-password'], {
            state: {
              passwordHandleCases: PassWordHandleCases.CreateNewPassword
            }
          });
        }
      }
     }).catch(e => {
      this.showErrorInfoSheet(e);
     })
  }

  verifyPassword(){
    const userOpts = {
      id_token: this.authenticationService.currentUserValue,
      password: this.password
    };
    this.orderProvider.verifyPassword(userOpts).then(result =>{
      this.isShowImportSeed = result;
    }).catch(e => {
      this.isShowImportSeed = false;
      this.showErrorInfoSheet(e);
    })
  }
  importSeed(){
    const keysOpts = {
      id_token: this.authenticationService.currentUserValue,
      keyFund: this.keyFund,
      keyReceive: this.keyReceive
    }
    this.orderProvider.importSeed(keysOpts).then(result =>{
      this.isFinish = result;
    }).catch(e => {
      this.isFinish = false;
      this.showErrorInfoSheet(e);
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
