import dayjs from 'dayjs';
import { lt } from 'semver';
import { shell } from 'electron';

function openLink(href: string) {
  shell.openExternal(href).catch((e) => {
    console.warn(e);
  });
}

function generateDate(): string {
  return dayjs(Date.now()).format('YYYYMMDDHHmmss');
}

/**
 * @param {string} clientVersion 客户端版本
 * @param {string} serverVersion 服务器端版本.
 * @return {boolean} 判断是否能更新
 */
const hasNewVersion = (
  clientVersion: string,
  serverVersion: string
): boolean => {
  return lt(clientVersion, serverVersion);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { openLink, generateDate, hasNewVersion, sleep };
