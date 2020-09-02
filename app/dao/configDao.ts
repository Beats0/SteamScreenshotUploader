import pkg from '../../package.json';

const prefixKey = 'config';

export const defaultConfig: ConfigStateType = {
  version: pkg.version,
  steamPath: '',
  userId: 0,
  appId: 0,
};

export default class ConfigDao {
  static get(): ConfigStateType {
    const configStr = localStorage.getItem(prefixKey);
    if (!configStr) return defaultConfig;
    const configData: ConfigStateType = JSON.parse(configStr);
    configData.version = pkg.version;
    // 与最新版config合并
    this.save({ ...defaultConfig, ...configData });
    return configData;
  }

  static save(config: ConfigStateType) {
    localStorage.setItem(prefixKey, JSON.stringify(config));
  }
}
