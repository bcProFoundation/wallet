import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConversionAuthenticationService } from "src/app/pages/admin-conversion/service/authentication.service";
import { ConfigProvider } from "../config/config";
import { Logger } from "../logger/logger";

@Injectable({
    providedIn: 'root'
  })
  export class ConversionProvider {
    private bwsURL: string;
    
    
    constructor(
        private logger: Logger,
        private configProvider: ConfigProvider,
        private http: HttpClient,
        private authenticationService: ConversionAuthenticationService,
        ) {
        this.logger.debug('ConversionProvider initialized');
        const defaults = this.configProvider.getDefaults();
        this.bwsURL = defaults.bws.url;
      }

      public login(userOpts): Promise<any> {
        const options = {
          headers: {'authorization': userOpts.id_token}
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/login`, userOpts, options).toPromise();
      }

      public createPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/admin/password`, userOpts, options).toPromise();
      }

      public renewPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/admin/password/renew`, userOpts, options).toPromise();
      }

      public verifyPassword(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/admin/password/verify`, userOpts, options).toPromise();
      }

      public importSeed(userOpts): Promise<any> {
        const options = {
          headers: {
            'authorization': userOpts.id_token,
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/admin/seed/import`, userOpts, options).toPromise();
      }

      public checkKeyExist(): Promise<any>{
        const userOpts ={
          id_token: this.authenticationService.currentUserValue        
        }
        const options = {
          headers: {
            'Content-Type': 'application/json'
          }
        };
        return this.http.post(`${this.bwsURL}/v3/conversion/admin/seed/check`, userOpts, options).toPromise();
      } 
  }