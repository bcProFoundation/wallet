import { HttpClient, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { reject } from "lodash";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
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
        return this.http.get(`${this.bwsURL}/v3/order/${orderId}`).toPromise();
      }

      public getAllOrderInfo(opts): Promise<any> {
        return this.http.post(`${this.bwsURL}/v3/order/all`, opts).toPromise();
      }

      public createOrder(orderOpts): Promise<any> {
          return this.http.post(`${this.bwsURL}/v3/order/create/`, orderOpts).toPromise();
      }

      public updateOrder(orderOpts): Promise<any> {
        return this.http.post(`${this.bwsURL}/v3/order/update/`, orderOpts).toPromise();
      }

      public getCoinConfigList(): Promise<any>{
        return this.http.get(`${this.bwsURL}/v3/coinconfig/`).toPromise();
      }

      public login(userOpts): Promise<any> {
        const options = {
          headers: {'authorization': userOpts.id_token}
        };
        return this.http.post(`${this.bwsURL}/v3/login`, userOpts, options).toPromise();
      }

      public createPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/admin/password`, userOpts, options).toPromise();
      }

      public renewPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/admin/password/renew`, userOpts, options).toPromise();
      }

      public verifyPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/admin/password/verify`, userOpts, options).toPromise();
      }

      public importSeed(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/admin/seed/import`, userOpts, options).toPromise();
      }

      // public login(userOpts): Promise<any> {
      //   const options = {
      //     headers: {'authorization': userOpts.id_token}
      //   };
      //   return this.http.post(`${this.bwsURL}/v3/login`, userOpts, options).toPromise();
      // }
      
      private handleError(error: HttpErrorResponse) {
        if (error.status === 0) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong.
          console.error(
            `Backend returned code ${error.status}, body was: `, error.error);
        }
        // Return an observable with a user-facing error message.
        return throwError(() => new Error('Something bad happened; please try again later.'));
      }
  }