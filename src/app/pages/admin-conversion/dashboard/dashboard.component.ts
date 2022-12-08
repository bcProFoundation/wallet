import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ConversionAuthenticationService } from '../service/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConversionComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;

  reason = '';
  opened = false;
  constructor(    
    private authenticationService: ConversionAuthenticationService,
    private router: Router
  ) { }

  ngOnInit() {}

  close(reason: string) {
    this.reason = reason;
    this.sidenav.close();
  }

  logOut(){
    this.authenticationService.logout();
  }
  navigateToImportSeed(){
    this.router.navigate(['/conversion/import-seed']);
  }
}
