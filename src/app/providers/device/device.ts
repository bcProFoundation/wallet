import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigProvider } from '../config/config';
import { Observable } from 'rxjs';
import { AppProvider } from '../app/app';
import * as moment from 'moment';

export interface DeviceInfo {
  deviceId: string;
  location?: string;
  platform?: string;
  countNumber?: number;
  attendance?: boolean;
  token?: string;
  isFirstInstall?: boolean;
  packageName?: string;
}

export interface UpdateAppreciationClaim {
  deviceId: string;
  claimCode: string;
  dateClaim: string;
}

@Injectable({
  providedIn: 'root'
})

export class DeviceProvider {
  private bwsURL: string;
  constructor(
    private http: HttpClient,
    private configProvider: ConfigProvider,
    private appProvider: AppProvider
  ) {
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
  }

  public storeLogDevice(opts: any): Observable<any> {
    const deviceInfo: DeviceInfo = {
      deviceId: opts?.deviceId,
      location: opts?.location,
      platform: opts?.platform,
      packageName: this.appProvider?.info?.packageNameId,
      token: opts?.token,
    }
    return this.http.post<any>(`${this.bwsURL}/v3/device/add`, deviceInfo);
  }

  public updateLogDevice(opts: any): Observable<any> {
    const deviceInfo: DeviceInfo = {
      deviceId: opts?.deviceId,
      location: opts?.location,
      attendance: opts?.attendance,
      token: opts?.token,
    }
    return this.http.post<any>(`${this.bwsURL}/v3/device/update`, deviceInfo);
  }

  public updateAppreciationClaim(deviceId, claimCode): Observable<any> {
    const opts: UpdateAppreciationClaim = {
      deviceId: deviceId,
      claimCode: claimCode,
      dateClaim: moment().format('DD/MM/YYYY - HH:mm:ss')
    }
    return this.http.post<any[]>(`${this.bwsURL}/v3/appreciation/claim`, opts);
  }

}
