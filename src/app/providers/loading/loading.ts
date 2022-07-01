import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingProvider {
  defaultDuration: any = 1000;
  defaultMessage: any = 'Loading...';
  isLoading: boolean = false;
  constructor(
    private loadingCtr: LoadingController
  ) { }

  public async simpleLoader(message?) {
    this.isLoading = true;
    return await this.loadingCtr.create({
      message: message ? message : this.defaultMessage,
      backdropDismiss: true
    }).then(a => {
      a.present().then(() => {
        console.log('presented');
        if (!this.isLoading) {
          a.dismiss();
        }
      });
    });
  }

  public async dismissLoader() {
    this.isLoading = false;
    return await this.loadingCtr.dismiss();
  }

  // Auto hide show loader
  public autoLoader(message? , duration?) {
    this.loadingCtr.create({
      message: message ? message : this.defaultMessage,
      duration: duration ? duration : this.defaultDuration,
      backdropDismiss: true
    }).then((response) => {
      response.present();
      response.onDidDismiss().then((response) => {
        console.log('Loader dismissed', response);
      });
    });
  }

}
