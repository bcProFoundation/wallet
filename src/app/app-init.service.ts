import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AppInitService {

  constructor(private Router: Router) {}

  init() {
    return new Promise<void>((resolve, reject) => {

        // Simple example from an array. In reality, I used the response of
        // a GET. Important thing is that the app will wait for this promise to resolve
        // const newDynamicRoutes = [{
        //     routeName: '',
        //     component: 'SwapPage'
        // }]
        const routes = this.Router.config;
        // routes.push({ path: '', component: SwapPage });
        this.Router.resetConfig(routes);
        resolve();
    });
  }
}