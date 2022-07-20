import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import env from 'src/environments';
import { Logger } from '../logger/logger';

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
  private apiUrl =
    env.lixiLotusUrl && env.lixiLotusUrl.length > 0
      ? env.lixiLotusUrl
      : 'https://lixilotus.com/api';
  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.debug('LixiLotusProvider initialized');
  }

  public getOfficialInfo(address: string): Promise<PageDto> {
    return new Promise((resolve, reject) => {
      let args = [];
      if (!address && address.length <= 0) {
        reject(new Error('Not have address'));
      }
      this.http.get(this.apiUrl + '/pages/address/' + address).subscribe(
        data => {
          resolve(data as PageDto);
        },
        err => {
          this.logger.error(err);
          reject(err);
        }
      );
    });
  }
}
