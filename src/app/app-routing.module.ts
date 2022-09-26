import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AddPage } from './pages/add/add';
import { CreateWalletPage } from './pages/add/create-wallet/create-wallet';
import { ImportWalletPage } from './pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from './pages/add/join-wallet/join-wallet';
import { SelectCurrencyPage } from './pages/add/select-currency/select-currency';
import { SendFeedbackPage } from './pages/feedback/send-feedback/send-feedback';
import { PricePage } from './pages/home/price-page/price-page';
import { FeatureEducationPage } from './pages/onboarding/feature-education/feature-education';
import { RecoveryKeyPage } from './pages/onboarding/recovery-key/recovery-key';
import { ScanPage } from './pages/scan/scan';
import { AboutPage } from './pages/settings/about/about';
import { SessionLogPage } from './pages/settings/about/session-log/session-log';
import { AddressbookAddPage } from './pages/settings/addressbook/add/add';
import { AddressbookPage } from './pages/settings/addressbook/addressbook';
import { AddressbookViewPage } from './pages/settings/addressbook/view/view';
import { AdvancedPage } from './pages/settings/advanced/advanced';
import { WalletRecoverPage } from './pages/settings/advanced/wallet-recover-page/wallet-recover-page';
import { AltCurrencyPage } from './pages/settings/alt-currency/alt-currency';
import { FeePolicyPage } from './pages/settings/fee-policy/fee-policy';
import { KeySettingsPage } from './pages/settings/key-settings/key-settings';
import { LanguagePage } from './pages/settings/language/language';
import { LocalThemePage } from './pages/settings/local-theme/local-theme';
import { LockPage } from './pages/settings/lock/lock';
import { NavigationPage } from './pages/settings/navigation/navigation';
import { NotificationsPage } from './pages/settings/notifications/notifications';
import { SharePage } from './pages/settings/share/share';
import { WalletSettingsPage } from './pages/settings/wallet-settings/wallet-settings';
import { RedirectGuard } from './providers';
import { BackupKeyPage } from './pages/backup/backup-key/backup-key';
import { BackupGamePage } from './pages/backup/backup-game/backup-game';
import { WalletDetailsPage } from './pages/wallet-details/wallet-details';
import { AddWalletPage } from './pages/add-wallet/add-wallet';
import { SendPage } from './pages/send/send';
import { AmountPage } from './pages/send/amount/amount';
import { WalletNamePage } from './pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletInformationPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletAddressesPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletExportPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletServiceUrlPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';
import { WalletDuplicatePage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-duplicate/wallet-duplicate';
import { WalletDeletePage } from './pages/settings/wallet-settings/wallet-delete/wallet-delete';
import { WalletMnemonicRecoverPage } from './pages/settings/advanced/wallet-recover-page/wallet-mnemonic-recover-page/wallet-mnemonic-recover-page';
import { ClearEncryptPasswordPage } from './pages/settings/key-settings/clear-encrypt-password/clear-encrypt-password';
import { KeyDeletePage } from './pages/settings/key-settings/key-delete/key-delete';
import { KeyQrExportPage } from './pages/settings/key-settings/key-qr-export/key-qr-export';
import { ExtendedPrivateKeyPage } from './pages/settings/key-settings/extended-private-key/extended-private-key';
import { KeyNamePage } from './pages/settings/key-settings/key-name/key-name';
import { LockMethodPage } from './pages/onboarding/lock-method/lock-method';
import { ProposalsNotificationsPage } from './pages/wallets/proposals-notifications/proposals-notifications';
import { ConfirmPage } from './pages/send/confirm/confirm';
import { MultiSendPage } from './pages/send/multi-send/multi-send';
import { SelectInputsPage } from './pages/send/select-inputs/select-inputs';
import { TransferToModalPage } from './pages/send/transfer-to-modal/transfer-to-modal';
import { CustomAmountPage } from './pages/receive/custom-amount/custom-amount';
import { AddFundsPage } from './pages/onboarding/add-funds/add-funds';
import { CopayersPage } from './pages/add/copayers/copayers';
import { PaperWalletPage } from './pages/paper-wallet/paper-wallet';
import { TokenDetailsPage } from './pages/token-details/token-details';
import { ConfirmTokenPage } from './pages/confirm-token/confirm-token';
import { TokenInforPage } from './pages/token-info/token-info';
import { SelectInputsSendPage } from './pages/send/send-select-inputs/send-select-inputs';
import { AccountsPage } from './pages/accounts/accounts';
import { SettingsPage } from './pages/settings/settings';
import { SearchContactPage } from './pages/search/search-contact/search-contact.component';
import { SelectFlowPage } from './pages/onboarding/select-flow/select-flow';
import { ChartViewPage } from './pages/chart-view/chart-view';
import { FeatureGuard } from './providers/feature-gaurd.service';
import { CreateSwapPage } from './pages/swap/create-swap/create-swap.component';
import { OrderSwapPage } from './pages/swap/order-swap/order-swap.component';
import { OrderTrackingComponent } from './pages/admin/order-tracking/order-tracking.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canLoad: [FeatureGuard],
    data: {
      feature: 'abcpay'
    }
  },
  // {
  //   path: '',
  //   component: OrderTrackingComponent,
  //   data: {
  //     feature: 'admin'
  //   }
  // },
  {
    path: 'select-flow',
    component: SelectFlowPage,
    canActivate: [FeatureGuard],
    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'feature-education',
    component: FeatureEducationPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'about',
    component: AboutPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'accounts-page',
    component: AccountsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'token-details',
    component: TokenDetailsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'token-info',
    component: TokenInforPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'confirm-token',
    component: ConfirmTokenPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  
  {
    path: 'alt-curency',
    component: AltCurrencyPage
  },
  {
    path: 'language',
    component: LanguagePage
  },
  {
    path: 'advanced',
    component: AdvancedPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'local-theme',
    component: LocalThemePage
  },
  {
    path: 'navigation',
    component: NavigationPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'addressbook',
    component: AddressbookPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'fee-policy',
    component: FeePolicyPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'notifications',
    component: NotificationsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-settings',
    component: WalletSettingsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'share',
    component: SharePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'lock',
    component: LockPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'key-settings',
    component: KeySettingsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'add',
    component: AddPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-recover',
    component: WalletRecoverPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'address-book-add',
    component: AddressbookAddPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'address-book-view',
    component: AddressbookViewPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'scan',
    component: ScanPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'price',
    component: PricePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'session-log',
    component: SessionLogPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'send-feedback',
    component: SendFeedbackPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'share',
    component: SharePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'select-currency',
    component: SelectCurrencyPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'join-wallet',
    component: JoinWalletPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'create-wallet',
    component: CreateWalletPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'import-wallet',
    component: ImportWalletPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'recovery-key',
    component: RecoveryKeyPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-details',
    component: WalletDetailsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'send-page',
    component: SendPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'add-wallet',
    component: AddWalletPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'amount',
    component: AmountPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-name',
    component: WalletNamePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-information',
    component: WalletInformationPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-addresses',
    component: WalletAddressesPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-export',
    component: WalletExportPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-service-url',
    component: WalletServiceUrlPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-transaction-history',
    component: WalletTransactionHistoryPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-duplicate',
    component: WalletDuplicatePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-delete',
    component: WalletDeletePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'wallet-mnemonic-recover',
    component: WalletMnemonicRecoverPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'backup-key',
    component: BackupKeyPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'backup-game',
    component: BackupGamePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'clear-encrypt-password',
    component: ClearEncryptPasswordPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'key-delete',
    component: KeyDeletePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'key-qr-export',
    component: KeyQrExportPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'extended-private-key',
    component: ExtendedPrivateKeyPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'key-name',
    component: KeyNamePage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'lock-method',
    component: LockMethodPage,
    canActivate: [RedirectGuard],
    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'proposals-notifications',
    component: ProposalsNotificationsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'confirm',
    component: ConfirmPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'multi-send',
    component: MultiSendPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'select-inputs',
    component: SelectInputsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'send-select-inputs',
    component: SelectInputsSendPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'transfer-to-modal',
    component: TransferToModalPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'custom-amount',
    component: CustomAmountPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'add-funds',
    component: AddFundsPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'copayers',
    component: CopayersPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  }, 
  {
    path: 'paper-wallet',
    component: PaperWalletPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'address-book-add',
    component: AddressbookAddPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'setting',
    component: SettingsPage
  },
  {
    path: 'search-contact',
    component: SearchContactPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'chart-view',
    component: ChartViewPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'abcpay'
    }
  },
  {
    path: 'create-swap',
    component: CreateSwapPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'swap'
    }
  },
  {
    path: 'order-swap',
    component: OrderSwapPage,
    canActivate: [FeatureGuard],

    data: {
      feature: 'swap'
    }
  },
  {
    path: 'order-tracking',
    component: OrderTrackingComponent,
    canActivate: [FeatureGuard],

    data: {
      feature: 'swap'
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
