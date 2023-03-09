import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ConfigProvider } from '../config/config';
import { Device } from '@capacitor/device';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Logger } from '../logger/logger';

@Injectable({
  providedIn: 'root'
})
export class LanguageProvider {
  private languages = [{
    name: this.translate.instant('English'),
    isoCode: 'en'
  },
  {
    name: this.translate.instant('Vietnamese'),
    isoCode: 'vi'
  }];
  private current: string;

  constructor(
    private logger: Logger,
    private translate: TranslateService,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('LanguageProvider initialized');
    this.translate.onLangChange.subscribe(event => {
      this.logger.info('Setting new default language to: ' + event.lang);
    });
  }

  public async load() {
    let lang = this.configProvider.get().wallet.settings.defaultLanguage;
    if (!_.isEmpty(lang)) this.current = lang;
    else {
      // Get from browser
      // const browserLang = this.translate.getBrowserLang();
      let languageDevice = await this.detectLanguageDevice();
      this.current = this.getName(languageDevice)
        ? languageDevice
        : this.getDefault();
    }
    this.logger.info('Default language: ' + this.current);
    this.translate.setDefaultLang(this.current);
    moment.locale(this.current);
  }

  public set(lang: string): void {
    this.current = lang;
    this.translate.use(lang);
    moment.locale(lang);
    this.configProvider.set({
      wallet: { settings: { defaultLanguage: lang } }
    });
  }

  public getName(lang: string): string {
    return _.result(
      _.find(this.languages, {
        isoCode: lang
      }),
      'name'
    );
  }

  public async detectLanguageDevice() {
    return await Device.getLanguageCode().then(lang => lang.value);
  }

  private getDefault(): string {
    return this.languages[0]['isoCode'];
  }

  public getCurrent() {
    return this.current;
  }

  public getAvailables() {
    return this.languages;
  }
}
