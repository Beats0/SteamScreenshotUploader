import React, { useEffect, useState } from 'react';
import { remote } from 'electron';
import fs from 'fs';
import Jimp from 'jimp';
import dayjs from 'dayjs';
import Table from './Table';
import { getVersionInfo } from '../api';
import { generateDate, openLink, hasNewVersion, sleep } from '../utils/common';
import ConfigDao from '../dao/configDao';
import pkg from '../../package.json';

const vdfParser = require('vdf-parser');

const { dialog } = remote;
const win = remote.getCurrentWindow();
const config = ConfigDao.get();

export default function Home(): JSX.Element {
  const [steamPath, setSteamPath] = useState(config.steamPath);
  const [userId, setUserId] = useState(config.userId);
  const [appId, setAppId] = useState(config.appId);
  const [latestVersion, setLatestVersion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLists, setImageLists] = useState<TableDataProps[]>([]);

  const isNewVersion =
    latestVersion !== '' && hasNewVersion(config.version, latestVersion);

  const getSteamPath = () => {
    dialog
      .showOpenDialog({
        title: 'open',
        buttonLabel: 'select',
        properties: ['openDirectory'],
      })
      .then((result) => {
        if (result.filePaths[0]) {
          setSteamPath(result.filePaths[0]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const openImageDialog = () => {
    if (steamPath === '') {
      setErrorMsg('Please enter the steam root path');
      return;
    }
    if (userId === 0) {
      setErrorMsg('Please enter the user Id');
      return;
    }
    if (appId === 0) {
      setErrorMsg('Please enter the app Id');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const latestConfig: ConfigStateType = {
      version: pkg.version,
      steamPath,
      userId,
      appId,
    };
    ConfigDao.save(latestConfig);

    dialog
      .showOpenDialog({
        title: 'open',
        buttonLabel: 'select',
        filters: [
          { name: 'Custom File Type', extensions: ['png', 'jpg', 'webp'] },
        ],
        properties: ['multiSelections'],
      })
      .then(async (result) => {
        const { filePaths } = result;
        for (let i = 0; i < filePaths.length; i++) {
          const img: TableDataProps = {
            path: filePaths[i],
            savedPath: '-',
            status: '-',
            };
          imageLists.push(img);
        }
        setImageLists([...imageLists]);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const cropImage = (imgPath: string) => {
    const d = generateDate();
    const screenshotsPath = `${steamPath}\\userdata\\${userId}\\760\\remote\\${appId}\\screenshots\\${d}_1.jpg`;
    const thumbnailsPath = `${steamPath}\\userdata\\${userId}\\760\\remote\\${appId}\\screenshots\\thumbnails\\${d}_1.jpg`;
    if (!imgPath) return;
    Jimp.read(imgPath)
      .then((image) => {
        const { width, height } = image.bitmap;
        image
          .write(`${screenshotsPath}`)
          .resize(200, Jimp.AUTO)
          .quality(60)
          .write(`${thumbnailsPath}`);
        fixVrFile(d, width, height, imgPath);
        console.log(`resize img ${d} done`);
      })
      .catch((err) => {
        console.log('error', err);
      });
  };

  // 注意 date 是唯一标识
  const fixVrFile = (
    date: string,
    width: number,
    height: number,
    imgPath: string
  ) => {
    const creation = dayjs(date).unix();
    const vdfPath = `${steamPath}\\userdata\\${userId}\\760\\screenshots.vdf`;
    const data = fs.readFileSync(vdfPath);
    const screenshotsData = vdfParser.parse(data.toString());
    const gameScreenShot = screenshotsData.Screenshots[appId];
    const vdf: ScreenshotVDF = {
      Location: '',
      Permissions: 2,
      caption: '',
      creation,
      filename: `${appId}/screenshots/${date}_1.jpg`,
      gameid: appId,
      width,
      height,
      hscreenshot: 938341111787252000,
      imported: 1,
      thumbnail: `${appId}/screenshots/thumbnails/${date}_1.jpg`,
      type: 1,
      vrfilename: '',
    };

    // gameScreenShot是Object，key即是index
    const newGameScreenShot = {
      '0': {},
    };
    for (const key in gameScreenShot) {
      newGameScreenShot[`${Number(key) + 1}`] = gameScreenShot[key];
    }

    newGameScreenShot['0'] = vdf;
    screenshotsData.Screenshots[appId] = newGameScreenShot;
    vdfParser.stringify(screenshotsData);

    fs.writeFile(vdfPath, vdfParser.stringify(screenshotsData), function (err) {
      if (err) {
        return console.error(err);
      }
      setImageLists((lists) => {
        const oldLists = lists;
        oldLists.map((i) => {
          if (i.path === imgPath) {
            i.savedPath = `${appId}/screenshots/${date}_1.jpg`;
            i.status = 'success';
          }
        });
        return [...oldLists];
      });
      console.log('write vdf success');
    });
  };

  const startTask = async () => {
    for (let i = 0; i < imageLists.length; i++) {
      // 强制停留1s，防止文件名重复被覆盖
      await sleep(1000);
      cropImage(imageLists[i].path);
    }
  };

  useEffect(() => {
    getVersionInfo().then((version) => {
      setLatestVersion(version);
    });
  }, []);

  return (
    <div className="container" data-tid="container">
      <div className="top-title flex-center">
        <h2 onClick={() => openLink('https://github.com/Beats0/SteamScreenshotUploader')}><span style={{color: '#4470FF'}}>STEAM</span> SCREENSHOT UPLOADER</h2>
        <span className="version" onClick={() => openLink('https://github.com/Beats0/SteamScreenshotUploader/releases')}> V {config.version} </span>
        {isNewVersion && <span className="newVersionText">new</span>}
        <span title="Dev Tools" onClick={() => win.webContents.toggleDevTools()} style={{marginLeft: 2, cursor: 'pointer'}}>
          <svg t="1596965551351" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <path d="M800.692 922.764c-31.378 0-62.757-11.945-86.643-35.833l-223.087-223.1c-47.386 17.316-98.342 22.05-148.702 13.653-59.335-9.894-113.317-37.409-156.111-79.574-82.771-81.553-109.231-204.304-67.412-312.721 5.769-14.956 18.588-25.87 34.292-29.195 15.755-3.333 31.955 1.469 43.336 12.851l114.05 114.056 72.918-72.922-114.046-114.055c-11.379-11.38-16.182-27.577-12.846-43.327 3.331-15.723 14.263-28.557 29.247-34.334 107.52-41.448 229.626-15.593 311.086 65.871 42.91 42.913 70.979 97.116 81.176 156.749 8.668 50.701 3.959 102.031-13.578 149.773l222.965 222.978c47.775 47.778 47.775 125.518 0 173.297-23.888 23.888-55.267 35.833-86.645 35.833zM507.339 586.899l15.698 18.163a59.178 59.178 0 0 0 2.942 3.168l233.377 233.391c22.793 22.795 59.881 22.793 82.672 0 22.794-22.795 22.794-59.884 0-82.677L608.652 525.552a61.283 61.283 0 0 0-3.117-2.897L587.4 506.921l10.009-21.823c19.154-41.767 25.166-87.901 17.383-133.415-7.947-46.487-29.845-88.757-63.325-122.238-57.262-57.265-140.271-79.311-217.508-59.465l139.989 139.997-163.533 163.542L170.42 333.516c-20.043 77.876 2.471 161.377 60.697 218.746 33.349 32.857 75.423 54.301 121.68 62.013 45.298 7.555 91.186 1.532 132.702-17.412l21.84-9.964z" fill="#ffffff"></path>
          </svg>
        </span>
      </div>
      <div className="id-container">
        <div className="col">
          <span className="label-title">Steam Path: </span>
          <input
            onClick={getSteamPath}
            value={steamPath || ''}
            readOnly
            type="text"
          />
        </div>
        <div className="col">
          <span className="label-title">UserID: </span>
          <input
            value={userId || ''}
            onChange={(e) => setUserId(Number(e.target.value))}
            type="text"
          />
        </div>
        <div className="col">
          <span className="label-title">AppID: </span>
          <input
            value={appId || ''}
            onChange={(e) => setAppId(Number(e.target.value))}
            type="text"
          />
        </div>
        <div className="col">
          <span className="label-title">Add Images: </span>
          <input onClick={openImageDialog} type="text" />
        </div>
      </div>
      <div className="errorText">{errorMsg}</div>
      <div className="upload-container">
        {loading && <span>Loading...</span>}
        <Table data={imageLists} />
        <div onClick={() => setImageLists([])} className="flex-center">
          <span className="flex-center select-btn select-btn-clear">Clear</span>
        </div>
        <div onClick={startTask} className="flex-center">
          <span className="flex-center select-btn">Start</span>
        </div>
      </div>
    </div>
  );
}
