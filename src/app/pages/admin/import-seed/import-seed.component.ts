import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider, ErrorsProvider, OrderProvider } from 'src/app/providers';
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

  ngOnInit() {}

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
