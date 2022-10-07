import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import jwt_decode from "jwt-decode";
import { BwcErrorProvider, ErrorsProvider, OrderProvider } from 'src/app/providers';
import { PassWordHandleCases } from '../create-password/create-password.component';
import { AuthenticationService } from '../service/authentication.service';

interface IApproveOpts {
  isVerified: boolean;
  isCreatePassword: boolean;
}
@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss'],
})
export class LoginAdminComponent implements OnInit {

  constructor(       private orderProvider: OrderProvider,
    private _cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private ngZone: NgZone,
    private authenticationService: AuthenticationService,
    private router: Router
    ) {
    window['handleCredentialResponse'] = user => ngZone.run(
      ()=>{
        this.afterSignInUser(user);
      }
    )
   }

  ngOnInit() {
    // if(this.authenticationService.currentUser){
    //   this.router.navigate(['/order-tracking']);
    // }
  }

  afterSignInUser(user){
    const userDecoded = jwt_decode(user.credential);
   this.orderProvider.login({id_token: user.credential}).then( (approveReq : IApproveOpts) => {
    if(approveReq.isVerified){
      this.authenticationService.login(user.credential);
      if(!approveReq.isCreatePassword) {
        this.router.navigate(['/create-password'], {
          state: {
            passwordHandleCases: PassWordHandleCases.CreateNewPassword
          }
        });
      }else{
      this.router.navigate(['/order-tracking']);
      }
    }
   }).catch(e => {
    this.showErrorInfoSheet(e);
   })
  //  console.log(userDecoded);
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
