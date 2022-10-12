import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

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
  constructor() { }

  ngOnInit() {}

  close(reason: string) {
    this.reason = reason;
    this.sidenav.close();
  }

}
