import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PlatformProvider } from 'src/app/providers';

@Component({
  selector: 'chart-view',
  templateUrl: './chart-view.html',
  styleUrls: ['./chart-view.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChartViewPage implements OnInit {

  constructor(
    public platformProvider: PlatformProvider,
  ) {

  }

  ngOnInit() {
  }

}
