import { Injectable } from '@angular/core';
import env from 'src/environments';
import { Logger } from '../logger/logger';
import { Http, HttpResponse } from '@capacitor-community/http';

type Nullable<T> = T | null;
export declare class PageDto {
  id: string;
  pageAccountId: number;
  name: string;
  title: string;
  description: string;
  avatar: string;
  cover: string;
  parentId: Nullable<string>;
  handleId: string;
  address: string;
  website: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(partial: Partial<PageDto>);
}

export declare class PageModel extends PageDto {
  addressCrypto: string;
  index: number;
}

@Injectable({
  providedIn: 'root'
})
export class LixiLotusProvider {
  private apiUrl: string;
  constructor(private logger: Logger) {
    this.logger.debug('LixiLotusProvider initialized');
    this.apiUrl =
      env.lixiLotusUrl && env.lixiLotusUrl.length > 0
        ? env.lixiLotusUrl
        : 'https://dev.lixilotus.test/api';
  }

  public getOfficialInfo(address: string): Promise<PageDto> {
    return new Promise((resolve, reject) => {
      let args = [];
      if (!address && address.length <= 0) {
        return Promise.reject(new Error('Not have address'));
      }

      const options = {
        url: this.apiUrl + '/pages/address/' + address
      };

      return Http.get(options)
        .then(response => {
          if(response.status === 200){
          resolve(response.data as PageDto);
          } else {
            reject(response);
          }
        })
        .catch(err => {
          this.logger.error(err);
          reject(err);
        });
    });
  }

  public claimVoucher(body): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!body) {
        reject(new Error('Not have address'));
      }
      const options = {
        url: this.apiUrl + '/claims',
        data: body
      };
      Http.post(options).then(
        response => {
          if(response.status === 200){
            resolve(response.data as any);
          } else{
            reject(response);
          }
        }
      ).catch(e => {
        this.logger.error(e);
        reject(e);
      });
    });
  }
}
