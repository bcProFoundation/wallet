import { Component, NgZone, OnInit } from '@angular/core';
import jwt_decode from "jwt-decode";

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss'],
})
export class LoginAdminComponent implements OnInit {

  constructor(    private ngZone: NgZone
    ) {
    window['handleCredentialResponse'] = user => ngZone.run(
      ()=>{
        this.afterSignInUser(user);
      }
    )
   }

  ngOnInit() {}

  afterSignInUser(user){
    const userDecoded = jwt_decode(user.credential);
    console.log(userDecoded);
  }

}
