import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigSwap } from "src/app/pages/swap/config-swap";
import { ConfigProvider } from "../config/config";
import { Logger } from "../logger/logger";

@Injectable({
    providedIn: 'root'
  })
  export class OrderProvider {
    private bwsURL: string;
    
    
    constructor(
        private logger: Logger,
        private configProvider: ConfigProvider,
        private http: HttpClient
        ) {
        this.logger.debug('LixiLotusProvider initialized');
        const defaults = this.configProvider.getDefaults();
        this.bwsURL = defaults.bws.url;
      }

      public getTokenInfo(): Promise<any> {
        return new Promise(resolve =>{
            this.http.get(`${this.bwsURL}/v3/tokenInfo/`).subscribe(res =>{
                resolve(res);
            });
        });
      }

      public getConfigSwap(): Promise<ConfigSwap> {
        return new Promise(resolve =>{
            this.http.get(`${this.bwsURL}/v3/configSwap/`).subscribe(res =>{
                resolve(ConfigSwap.fromObj(res));
            });
        });
      }

      public getOrderInfo(orderId): Promise<any> {
        return new Promise(resolve =>{
            this.http.get(`${this.bwsURL}/v3/order/${orderId}`).subscribe(res =>{
                resolve(res);
            });
        });
      }

      public createOrder(orderOpts): Promise<any> {
        return new Promise(resolve =>{
            this.http.post(`${this.bwsURL}/v3/order/create/`, orderOpts).subscribe(res =>{
                resolve(res);
            });
        });
      }
  }