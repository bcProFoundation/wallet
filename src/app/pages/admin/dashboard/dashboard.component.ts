import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthenticationService } from '../service/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;

  reason = '';
  opened = false;
  constructor(    private authenticationService: AuthenticationService,
    ) { }

  ngOnInit() {}

  close(reason: string) {
    this.reason = reason;
    this.sidenav.close();
  }

  logOut(){
    this.authenticationService.logout();
  }
}
