import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';

const configProvider = require("../src/assets/appConfig.json");


// This takes a CapacitorConfig, such as the one in capacitor.config.ts, but only needs a few properties
// to know where the ios and android projects are
const config: CapacitorConfig = {
  ios: {
    path: 'ios',
  }
};
const updateIos = async() => {
    const project = new CapacitorProject(config);
    await project.load();
    const appTarget = project.ios?.getAppTarget();
    project.ios.setVersion(appTarget.name, null , configProvider.iOSBuildVersion);
    await project.ios?.updateInfoPlist(appTarget.name, null, {
      NSCameraUsageDescription: 'This app needs Camera Permission to scan QR code.',
      NSFaceIDUsageDescription: 'This allows you to securely sign into "AbcPay Wallet".',
      NSUserNotificationsUsageDescription: 'Enable notification, location service and regularly check-in AbcPay wallet so businesses can pay your for your attention. Your identity is completely private.',
      NSLocationAlwaysUsageDescription: 'Enabling your service location, notification and regularly check-in AbcPay wallet so businesses can pay you for your attention. Your identity is completely private.',
      NSLocationWhenInUseUsageDescription: 'Enabling your service location, notification and regularly check-in AbcPay wallet so businesses can pay you for your attention. Your identity is completely private.'
    });
    // project.ios.setDisplayName(appTarget.name, 'Release', '')
    project.commit();
}
updateIos();