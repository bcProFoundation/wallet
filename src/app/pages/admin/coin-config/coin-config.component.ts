import { Component, OnInit } from '@angular/core';
import { OrderProvider } from 'src/app/providers';
import { CoinConfig } from '../../swap/config-swap';

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
  listCoinConfig : CoinConfig[] = [];
  listSwap : CoinConfig[] = [];
  listReceive: CoinConfig[] = [];
  listCoinUpdate: UpdateCoinConfigOpts[] = [];
  checked = true;
  lists
  constructor(private orderProvider: OrderProvider) { }

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
    this.orderProvider.updateCoinConfig(finalListUpdate).then(result => console.log(result)).catch(e => console.log(e));
  }
  rescan(){
    this.orderProvider.rescan().then(result => console.log(result)).catch(e => console.log(e));
  }
}
