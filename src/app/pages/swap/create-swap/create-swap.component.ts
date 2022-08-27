import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AppProvider, ThemeProvider } from 'src/app/providers';

@Component({
  selector: 'page-create-swap',
  templateUrl: './create-swap.component.html',
  styleUrls: ['./create-swap.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSwapPage implements OnInit {
  public isScroll = false;
  public currentTheme:any;
  constructor(
    private router: Router,
    private themeProvider: ThemeProvider
    ) 
    { 
      // this.router.navigate(['/setting']);
    }

    async handleScrolling(event) {
      if (event.detail.currentY > 0) {
        this.isScroll = true;
      }
      else {
        this.isScroll = false;
      }
    }

    ngOnInit() {
    }

    ionViewWillEnter() {
      this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
    }

    public openSettingPage() {
      this.router.navigate(['/setting']);
    }
}
