const
// UnzipClass = require('./lib/unzip'),
// fs = require('fs'),
    fs = require('fs-extra'),
    request = require('request'),
    progress = require('request-progress'),
    unzip = require('unzip2'),
    defaultHandle = require('./lib/defaultHandle'),
    errCode = require('./lib/errCode');

//临时文件目录
let tempDirectory = './downloadtemp';

class Downloader {
    constructor(url, options, privateModule) {
        options = options || {};
        privateModule = privateModule || {};

        //创建临时文件目录
        if (!fs.existsSync(tempDirectory)) {
            fs.mkdirSync(tempDirectory);
        }
        let random = ~~(Math.random() * 1000 * 1000);

        // this._req = request(url, options); //request实例 !!!bug
        this._url = url;
        this._options = options;
        this._privateModule = privateModule; //自定义标记
        this._tempPath = `${tempDirectory}/${new Date().getTime()}${random}.zip`; //临时文件
        this._savePath = ''; //下载路径
        this._unzipStream = null; //解压流
        this._handle = defaultHandle; //操作行为
    }

    /**
     * 开始下载
     * @param  {[type]} savePath [保存地址]
     * @param  {[type]} handle   [触发行为]
     */
    start(savePath, handle) {
        let self = this;
        self._savePath = savePath;
        self._handle = handle = Object.assign(self._handle, handle);
        let privateModule = self._privateModule; //自定义标记
        let tempPath = self._tempPath; //临时文件

        self._req = request(self._url, self._options); //request实例
        progress(self._req, { throttle: 200 }) //throttle the progress event to 200ms
            .on('response', (res) => {
                if (res.statusCode != 200 || res.headers['content-type'].includes('application/json')) { //服务自定义错误
                    res.setEncoding('utf-8');
                    res.on('data', function(data) {
                        handle.error({ code: errCode.server, message: data }, privateModule);
                        self._req.abort(); //结束request
                    });
                }
            })
            .on('progress', (state) => {
                let formatState = {
                    progress: parseFloat(state.percentage * 100).toFixed(2)
                };
                //下载中事件
                handle.started(formatState, privateModule);
            })
            .on('error', (err) => {
                //错误事件
                handle.error({ code: errCode.http, message: err }, privateModule);
            })
            .on('end', () => {
                //fs: EPERM inconsistency between synchronous and asynchronous API on Windows 7
                //https://github.com/nodejs/node-v0.x-archive/issues/6599
                // if (fs.existsSync(tempPath)) {
                //     //解压实例
                //     let unziper = self._unziper = unzip.Extract({ path: savePath });

                //     unziper.on('finish', () => {
                //         //解压完成事件
                //         handle.finished(privateModule);
                //         fs.unlink(tempPath);
                //     });

                //     unziper.on('error', (err) => {
                //         if (['ENOENT', 'EEXIST'].includes(err.code)) {
                //             // console.log(err.code, '------------')
                //         } else {
                //             //解压错误事件
                //             handle.error({ code: errCode.unzip, message: err }, privateModule);
                //             fs.unlink(tempPath);
                //         }
                //     });

                //     // 需要解压的文件流

                //     // let unzipFile = self._unzipStream = fs.createReadStream('./downloadtemp/1477823446663.zip');
                //     let unzipFile = self._unzipStream = fs.createReadStream(tempPath);

                //     //下载完成事件
                //     handle.downloadFinished(privateModule);
                //     unzipFile.pipe(unziper); //开始解压

                // } else {
                //     //下载未完成时abort
                // }
            })
            .on('abort', () => {
                if (fs.existsSync(tempPath)) { //下载过程中取消
                    try {
                        fs.unlinkSync(tempPath);
                    } catch (err) {
                        // console.log('may not exist');
                    }
                }

                if (self._unziper) {
                    // self._unziper.end();
                    if (self._unzipStream) { //解压过程中取消
                        self._unzipStream.close();
                    }
                }

                //解压读取流 到 解压写入流 会创建文件
                handle.destroyed(privateModule);

            })
            .pipe(fs.createWriteStream(tempPath).on('finish', () => {
                if (fs.existsSync(tempPath)) {
                    //解压实例
                    let unziper = self._unziper = unzip.Extract({ path: savePath });

                    unziper.on('finish', () => {
                        //解压完成事件
                        handle.finished(privateModule);
                        fs.unlink(tempPath);
                    });

                    unziper.on('error', (err) => {
                        if (['ENOENT', 'EEXIST'].includes(err.code)) {
                            // console.log(err.code, '------------')
                        } else {
                            //解压错误事件
                            handle.error({ code: errCode.unzip, message: err }, privateModule);
                            fs.unlink(tempPath);
                        }
                    });

                    // 需要解压的文件流

                    // let unzipFile = self._unzipStream = fs.createReadStream('./downloadtemp/1477823446663.zip');
                    let unzipFile = self._unzipStream = fs.createReadStream(tempPath);

                    //下载完成事件
                    handle.downloadFinished(privateModule);
                    unzipFile.pipe(unziper); //开始解压
                }
            }));
    }

    /**
     * 取消下载
     */
    destroy() {
        this._req.abort();
    }
};

module.exports = Downloader;
