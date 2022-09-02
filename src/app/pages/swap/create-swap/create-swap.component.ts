import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CountdownComponent } from 'ngx-countdown';
import { AppProvider, RateProvider, ThemeProvider } from 'src/app/providers';

@Component({
  selector: 'page-create-swap',
  templateUrl: './create-swap.component.html',
  styleUrls: ['./create-swap.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSwapPage implements OnInit {
  public isScroll = false;
  public currentTheme:any;
  public rates: any;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;

  public listConfig = {
    "coinSwap": [
      {
        "code": "xpi",
        "isToken": false,
        "networkFee": 226,
        "rateUSD": 0,
      }
    ],
    "coinReceived": [
      {
        "code": "eat",
        "isToken": true,
        "networkFee": 1342,
        "rateUSD": 0
      }
    ]
  }

  constructor(
    private router: Router,
    private themeProvider: ThemeProvider,
    private rateProvider: RateProvider
    ) 
    { 
      // this.router.navigate(['/setting']);
    }
    handleEvent(event){
      if(event.action === 'done'){
        this.countdown.restart();
        this.handleUpdateRate();
      }
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
      // this.rates = this.rateProvider.getRates();
      // this.rates = this.rates.map()
     this.handleUpdateRate();
    }

    handleUpdateRate(){
      this.rateProvider.updateRatesCustom().then(data => {
        this.listConfig.coinSwap.forEach(coin =>{
          coin.rateUSD = data[coin.code].USD ? data[coin.code].USD : 0;
        })
        this.listConfig.coinReceived.forEach(coin =>{
          coin.rateUSD = data[coin.code].USD ? data[coin.code].USD : 0;
        })
      });
    }

    ionViewWillEnter() {
      this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
    }

    public openSettingPage() {
      this.router.navigate(['/setting']);
    }
}
