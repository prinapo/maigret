export function useVersion() {
  const version = process.env.APP_VERSION;
  const versionCode = process.env.VERSION_CODE;

  return {
    version,
    versionCode,
    getFullVersion: () => `v${version} (${versionCode})`,
  };
}
