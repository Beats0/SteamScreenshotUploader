import pkg from '../../package.json';

const API_SERVER_PACKAGE = `https://cdn.jsdelivr.net/gh/Beats0/steamscreenshotuploader@master/package.json`;

// 获取服务器端version
export async function getVersionInfo(): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(API_SERVER_PACKAGE)
      .then((res) => res.json())
      .then((res: { version: string }) => {
        resolve(res.version);
      })
      .catch((error) => {
        console.log(error);
        resolve(pkg.version);
      });
  });
}
