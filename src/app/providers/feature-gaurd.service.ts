import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FeatureFlagsService } from './feature-flags.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureGuard implements CanActivate, CanLoad {
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private router: Router
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
          this.router.navigate(['/swap']);
          return false;    }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
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