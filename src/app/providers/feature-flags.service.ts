import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { truncateSync } from "fs";
import { get, has, truncate } from "lodash";
import { of } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from '@angular/router';
import { SwapPage } from "../pages/swap/swap.component";


export interface FeatureConfig {
    abcpay: boolean,
    swap: boolean
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
    //   return this.http
    //     .get<FeatureConfig>(this.configUrl)
    //     .pipe(tap(data => (this.config = data)))
    //     .toPromise();
        return of({
            abcpay: false,
            swap: true
        } as FeatureConfig).pipe(tap(data =>{
          if(!data.abcpay && data.swap){
            const routes = this.Router.config;
            routes.shift();
            routes.unshift({ path: '', component: SwapPage });
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