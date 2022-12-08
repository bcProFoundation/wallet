import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ConversionAuthenticationService } from '../pages/admin-conversion/service/authentication.service';
import { AuthenticationService } from '../pages/admin/service/authentication.service';
import { FeatureFlagsService } from './feature-flags.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureGuard implements CanActivate, CanLoad {
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private conversionAuthenticationService: ConversionAuthenticationService
  ) {}
    canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        const {
            data: { feature }, // <-- Get the module name from route data
          } = route;
          if (feature) {
            const isEnabled = this.featureFlagsService.isFeatureEnabled(feature);
            if (isEnabled) {
              return true;
            }
          }
          this.router.navigate(['/']);
          return false;    
        }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        const {
            data: { feature }, // <-- Get the module name from route data
          } = route;
          if (feature) {
            const isEnabled = this.featureFlagsService.isFeatureEnabled(feature);
            if (isEnabled) {
              if(feature === 'admin'){
                // authenticate before routing
                if(this.authenticationService.currentUserValue){
                  return true;
                } else{
                  this.router.navigate(['']).then(()=>{
                    window.location.reload();
                  });
                  return false;
                }
              }
              else if(feature === 'conversion'){
                // authenticate before routing
                if(this.conversionAuthenticationService.currentUserValue){
                  return true;
                } else{
                  this.router.navigate(['']).then(()=>{
                    window.location.reload();
                  });
                  return false;
                }
              }
              return true;
            }
          }
          this.router.navigate(['']).then(()=>{
            window.location.reload();
          });
          return false;
    }
//   canActivate(
//     route: Route,
//     segments: UrlSegment[]
//   ):
//    boolean {
//     const {
//       data: { feature }, // <-- Get the module name from route data
//     } = route;
//     if (feature) {
//       const isEnabled = this.featureFlagsService.isFeatureEnabled(feature);
//       if (isEnabled) {
//         return true;
//       }
//     }
//     this.router.navigate(['/swap']);
//     return false;
//   }

  CanDeactivate(
    route: Route,
    segments: UrlSegment[]
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const {
      data: { feature }, // <-- Get the module name from route data
    } = route;
    if (feature) {
      const isEnabled = this.featureFlagsService.isFeatureEnabled(feature);
      if (isEnabled) {
        return true;
      }
    }
    this.router.navigate(['/swap']);
    return false;
  }
}