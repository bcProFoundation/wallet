import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { truncateSync } from "fs";
import { get, has, truncate } from "lodash";
import { of } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from '@angular/router';
import { CreateSwapPage } from "../pages/swap/create-swap/create-swap.component";
import { OrderSwapPage } from "../pages/swap/order-swap/order-swap.component";
import { SettingsPage } from "../pages/settings/settings";
import env from 'src/environments';
import { OrderTrackingComponent } from "../pages/admin/order-tracking/order-tracking.component";
import { LoginAdminComponent } from "../pages/admin/login-admin/login-admin.component";
import { CoinConfigComponent } from "../pages/admin/coin-config/coin-config.component";

export interface FeatureConfig {
    abcpay: boolean,
    swap: boolean,
    admin: boolean
}

@Injectable({
    providedIn: "root"
  })
  export class FeatureFlagsService {
    config: FeatureConfig = null;
    configUrl = ``; // <-- URL for getting the config
  
    constructor(private http: HttpClient, private Router: Router) {}
  
    /**
     * We convert it to promise so that this function can
     * be called by the APP_INITIALIZER
     */
    loadConfig() : Promise<any> {
      let buildSwapAlone = false;
        return of({
            abcpay: true,
            swap: true,
            admin: true
        } as FeatureConfig).pipe(tap(data =>{
          if(data.admin && env.buildAdmin){
            data.abcpay = false;
            const routes = this.Router.config;
            routes.shift();
            routes.unshift({ path: '', component: LoginAdminComponent, data: {
              feature: 'admin'
            } });
            this.Router.resetConfig(routes);
          }
          else if(data.swap && env.buildSwapALone){
            if(env.buildSwapALone){
              data.abcpay = false;
            }
            const routes = this.Router.config;
            routes.shift();
            routes.unshift({ path: '', component: CreateSwapPage });
            const indexPath = routes.findIndex(r => r.path === 'create-swap');
            routes.splice(indexPath, 1);
            this.Router.resetConfig(routes);
          }
          this.config = data;
        } ))
            .toPromise();;
    }
  
    isFeatureEnabled(key: string) {
      if (this.config && has(this.config, key)) {
        return get(this.config, key, false);
      }
     return false;
    }
  }