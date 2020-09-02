type ConfigStateType = {
  // 客户端版本号
  version: string;
  steamPath: string;
  userId: number;
  appId: number;
};

interface ScreenshotVDF {
  Location: string;
  Permissions: number;
  caption: string;
  creation: number;
  filename: string;
  gameid: number;
  height: number;
  hscreenshot: number;
  imported: number;
  thumbnail: string;
  type: number;
  vrfilename: string;
  width: number;
}

interface TableDataProps {
  path: string;
  savedPath: string;
  status: string;
}

interface Props {
  data: TableDataProps[];
}
