// notarize.cjs
module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // MAS builds are notarized by Apple during review — skip here
  if (process.env.MAS_BUILDING) {
    console.log('Skipping notarization for MAS build');
    return;
  }

  // Check for required env vars
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Skipping notarization: APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD not set');
    return;
  }

  const { notarize } = require('@electron/notarize');
  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing ${appName}...`);

  return await notarize({
    appBundleId: 'com.ianclark.positivepopups',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID || 'C224CY39M8',
    notarytoolPath: '/Applications/Xcode.app/Contents/Developer/usr/bin/notarytool',
  });
};

