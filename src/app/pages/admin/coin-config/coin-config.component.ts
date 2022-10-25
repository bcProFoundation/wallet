import { Component, OnInit, ViewChild } from '@angular/core';
import { CurrencyProvider, OnGoingProcessProvider, OrderProvider } from 'src/app/providers';
import { CoinConfig } from '../../swap/config-swap';
import {MatAccordion} from '@angular/material/expansion';

interface UpdateCoinConfigOpts{
  code: string;
  network: string;
  isEnableSwap: boolean;
  isEnableReceive: boolean;
}

@Component({
  selector: 'app-coin-config',
  templateUrl: './coin-config.component.html',
  styleUrls: ['./coin-config.component.scss'],
})
export class CoinConfigComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  listCoinConfig : CoinConfig[] = [];
  listSwap : CoinConfig[] = [];
  listReceive: CoinConfig[] = [];
  listCoinUpdate: UpdateCoinConfigOpts[] = [];
  checked = true;
  lists
  constructor(private orderProvider: OrderProvider,     
    private onGoingProcessProvider: OnGoingProcessProvider,
    private currencyProvider: CurrencyProvider
    ) { }

  ngOnInit() {
    this.orderProvider.getCoinConfigList().then(result => {
      this.listCoinConfig = result;
      this.listSwap = this.listCoinConfig.filter(coin => coin.isSwap);
      this.listReceive = this.listCoinConfig.filter(coin => coin.isReceive);
    })
  }

  // setCoinConfig(checked: boolean, coin: CoinConfig, isSwap: boolean){
  //   const coinUpdateFound = this.listCoinUpdate.find(coinUpdate => coinUpdate && coinUpdate.code === coin.code && coinUpdate.network === coin.network);
  //   if(coinUpdateFound){
  //     coinUpdateFound.isEnableSwap = isSwap ? checked : coin.isEnableSwap;
  //     coinUpdateFound.isEnableReceive = !isSwap ? checked : coin.isEnableReceive;
  //   } else{
  //     this.listCoinUpdate.push(coinUpdateFound);
  //   }
  
  // }

  updateAllCoin(){
    const finalListUpdate = this.listSwap.concat(this.listReceive);
    this.onGoingProcessProvider.set('Updating');
    this.orderProvider.updateCoinConfig(finalListUpdate)
    .catch(e => console.log(e)).finally(()=>{
      this.onGoingProcessProvider.clear();
    });
  }

  rescan(){
    this.onGoingProcessProvider.set('Processing');
    this.orderProvider.rescan().then(result => {
      this.orderProvider.getCoinConfigList().then(result => {
        this.onGoingProcessProvider.clear();
        this.listCoinConfig = result;
        this.listSwap = this.listCoinConfig.filter(coin => coin.isSwap);
        this.listReceive = this.listCoinConfig.filter(coin => coin.isReceive);
      }).catch(e => {
        console.log(e); 
        this.onGoingProcessProvider.clear();
      });
    }).catch(e => {
      console.log(e);
      this.onGoingProcessProvider.clear();
    });
  }

  getCoinName(coin: CoinConfig): string{
    if(coin.isToken){
      return coin.tokenInfo.name;
    } else{
      const objCoin = this.currencyProvider.getCoin(coin.code.toUpperCase());
      const nameCoin = this.currencyProvider.getCoinName(objCoin) || '';
      return nameCoin;
    }
  }

  getUnitName(coin: CoinConfig): string{
    if(coin.isToken){
      return coin.tokenInfo.symbol.toUpperCase();
    } else{
      return coin.code.toUpperCase();
    }
  }
}
