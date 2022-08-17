import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { get, has } from "lodash";
import { of } from "rxjs";
import { tap } from "rxjs/operators";

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
  
    constructor(private http: HttpClient) {}
  
    /**
     * We convert it to promise so that this function can
     * be called by the APP_INITIALIZER
     */
    loadConfig() : Promise<any> {
    //   return this.http
    //     .get<FeatureConfig>(this.configUrl)
    //     .pipe(tap(data => (this.config = data)))
    //     .toPromise();
        return Promise.resolve({
            abcpay: true,
            swap: false
        } as FeatureConfig);
    }
  
    isFeatureEnabled(key: string) {
      if (this.config && has(this.config, key)) {
        return get(this.config, key, false);
      }
     return false;
    }
  }