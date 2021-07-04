import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import SlideVerify from 'slide-verify';

/**
 * Generated class for the SliderCaptchaComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'slider-captcha',
  templateUrl: 'slider-captcha.html'
})
export class SliderCaptchaComponent {

  constructor(
    private viewContrl: ViewController,
    
  ) { }

  ngOnInit() {
    new SlideVerify({
      elementId: "slider",
      lang: 'en',
      onSuccess: () => {
        console.log('success');
        this.viewContrl.dismiss('success');
      },
      onFail: () => { console.log("fail") },
      onRefresh: () => { console.log('refresh')},
      photo: 'assets/img/add-wallet/moon_and_earth.jpg'
    });
  }

  closeModal() {
    this.viewContrl.dismiss();
  }

}
