import { Component, ComponentRef, NgZone, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AnimationController, Platform } from '@ionic/angular';
import { InfoSheetType } from 'src/app/providers/action-sheet/action-sheet';
import { AppProvider } from 'src/app/providers/app/app';
import { DomProvider } from 'src/app/providers/dom/dom';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'encrypt-password',
  templateUrl: 'encrypt-password.html',
  styleUrls: ['encrypt-password.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EncryptPasswordComponent extends ActionSheetParent {
  public encryptPasswordForm: UntypedFormGroup;
  public isCopay: boolean;
  public passwordInputType: string = 'password';
  public confirmPasswordInputType: string = 'password';
  zone;
  public currentTheme: string;
  constructor(
    private domProvider: DomProvider,
    private fb: UntypedFormBuilder,
    private appProvider: AppProvider,
    public animationCtrl: AnimationController,
    public platform: Platform
  ) {
    super();
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isCopay = this.appProvider.info.name === 'copay';
    this.encryptPasswordForm = this.fb.group(
      {
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      },
      { validator: this.matchingPasswords('password', 'confirmPassword') }
      );
      this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  private matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: UntypedFormGroup) => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];
      if (password.value !== confirmPassword.value) {
        return {
          mismatchedPasswords: true
        };
      }
      return undefined;
    };
  }

  public createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  private setupSheet<T extends ActionSheetParent>(
    componentType: { new(...args): T },
    sheetType?: string,
    params?
  ): ComponentRef<T> {
    const sheet = this.domProvider.appendComponentToBody<T>(componentType);
    sheet.instance.componentRef = sheet;
    sheet.instance.sheetType = sheetType;
    sheet.instance.params = params;
    return sheet;
  }
  
  public confirm(password: string): void {
    this.dismiss(password);
  }
  public skipEncryptPass(): void{
    this.dismiss();
  }
}
