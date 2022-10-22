import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IonicModule, IonicRouteStrategy, NavParams } from '@ionic/angular';
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateDefaultParser, TranslateLoader, TranslateModule, TranslateParser } from '@ngx-translate/core';
import { env } from 'src/environments';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { CopayApp } from './app.component';
import { Animate } from './directives/animate/animate';
import { CopyToClipboard } from './directives/copy-to-clipboard/copy-to-clipboard';
import { ExternalizeLinks } from './directives/externalize-links/externalize-links';
import { FixedScrollBgColor } from './directives/fixed-scroll-bg-color/fixed-scroll-bg-color';
import { IonContentBackgroundColor } from './directives/ion-content-background-color/ion-content-background-color';
import { IonMask } from './directives/ion-mask/ion-mask';
import { LongPress } from './directives/long-press/long-press';
import { NavbarBg } from './directives/navbar-bg/navbar-bg';
import { NoLowFee } from './directives/no-low-fee/no-low-fee';
import { RevealAtScrollPosition } from './directives/reveal-at-scroll-pos/reveal-at-scroll-pos';
import { ScrolledIntoView } from './directives/scrolled-into-view/scrolled-into-view';
import { FormatCurrencyPipe, sharedPipes } from './pipes';
import { LanguageLoader } from './providers';
import { CustomErrorHandler } from './providers/custom-error-handler.service';
import { ProvidersModule } from './providers/providers.module';
import { NgxTextOverflowClampModule } from 'ngx-text-overflow-clamp';
import { MomentModule } from 'angular2-moment';
import { NgxBarcodeModule } from 'ngx-barcode';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { MarkdownModule } from 'ngx-markdown';
import { COMPONENTS } from './components/components';
import { PAGES } from './pages/pages';

import { SwiperModule } from 'swiper/angular'

import { WebView } from '@ionic-native/ionic-webview/ngx';
import { IonicImageLoaderModule } from 'ionic-image-loader-v5';
import { enterAnimation } from './animations/nav-animation';

import { MatGridListModule } from '@angular/material/grid-list'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';
import { ClickOutsideModule } from 'ng-click-outside';
import { CountdownModule } from 'ngx-countdown';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from "ng-recaptcha";

import { NgxMaskModule } from 'ngx-mask';
import { FeatureFlagsService } from './providers/feature-flags.service';

import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import {MatSortModule} from '@angular/material/sort';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';

const featureFactory = (featureFlagsService: FeatureFlagsService) => () =>
  featureFlagsService.loadConfig();



export function translateParserFactory() {
  return new InterpolatedTranslateParser();
}

export class InterpolatedTranslateParser extends TranslateDefaultParser {
  public templateMatcher: RegExp = /{\s?([^{}\s]*)\s?}/g;
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  public parser: TranslateParser = translateParserFactory();
  public handle(params: MissingTranslationHandlerParams) {
    return this.parser.interpolate(params.key, params.interpolateParams);
  }
}

@NgModule({
    declarations: [
        /* Pipes */
        ...sharedPipes,
        // ...PAGES,
        ...COMPONENTS,
        ...PAGES,
        CopayApp,
        /* Directives */
        CopyToClipboard,
        ExternalizeLinks,
        FixedScrollBgColor,
        IonContentBackgroundColor,
        IonMask,
        LongPress,
        NavbarBg,
        NoLowFee,
        Animate,
        RevealAtScrollPosition,
        ScrolledIntoView,
        // WideHeaderBarButton,
    ],
    imports: [
        IonicModule.forRoot({
            animated: env.enableAnimations,
            scrollPadding: false,
            backButtonIcon: 'arrow-round-back',
            backButtonText: '',
            navAnimation: enterAnimation
        }),
        MatCheckboxModule,
        MatTableModule,
        MatPaginatorModule,
        MatDialogModule,
        MatSortModule,
        MatExpansionModule,
        NgxMaskModule.forRoot(),
        MatGridListModule,
        MatFormFieldModule,
        MatSelectModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatInputModule,
        MatSidenavModule,
        FormsModule,
        ReactiveFormsModule,
        NgxTextOverflowClampModule,
        IonicImageLoaderModule,
        HttpClientModule,
        MarkdownModule.forRoot(),
        MomentModule,
        BrowserModule,
        FormsModule,
        A11yModule,
        ReactiveFormsModule,
        NgxBarcodeModule,
        NgxQRCodeModule,
        AppRoutingModule,
        ProvidersModule,
        SwiperModule,
        RecaptchaV3Module,
        ClickOutsideModule,
        CountdownModule,
        TranslateModule.forRoot({
            parser: { provide: TranslateParser, useFactory: translateParserFactory },
            missingTranslationHandler: {
                provide: MissingTranslationHandler,
                useClass: MyMissingTranslationHandler
            },
            loader: {
                provide: TranslateLoader,
                useClass: LanguageLoader
            }
        }),
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: env.name === 'production' })
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: featureFactory,
            deps: [FeatureFlagsService],
            multi: true
        },

        {
            provide: RouteReuseStrategy,
            useClass: IonicRouteStrategy
        },
        {
            provide: ErrorHandler,
            useClass: CustomErrorHandler
        },
        FormatCurrencyPipe,
        NavParams,
        FormBuilder,
        WebView,
        { provide: RECAPTCHA_V3_SITE_KEY, useValue: "6Lc1rGwdAAAAABrD2AxMVIj4p_7ZlFKdE5xCFOrb" }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [CopayApp]
})
export class AppModule {}
