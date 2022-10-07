import {
    Directive,
    Input,
    OnInit,
    TemplateRef,
    ViewContainerRef
  } from "@angular/core";
import { FeatureFlagsService } from "src/app/providers/feature-flags.service";
  
  @Directive({
    selector: "[featureFlag]"
  })
  export class FeatureFlagDirective implements OnInit {
    @Input() featureFlag: string;
    constructor(
      private tpl: TemplateRef<any>,
      private vcr: ViewContainerRef,
      private featureFlagService: FeatureFlagsService
    ) {}
  
    ngOnInit() {
      const isEnabled = this.featureFlagService.isFeatureEnabled(this.featureFlag);
      if (isEnabled) {
        this.vcr.createEmbeddedView(this.tpl);
      }
    }
  }