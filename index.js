const fs = require('fs'),
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

        this._req = request(url, options); //request实例
        this._privateModule = privateModule; //自定义标记
        this._tempPath = `${tempDirectory}/${new Date().getTime()}.zip`; //临时文件
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

        progress(self._req, { throttle: 1000 }) //throttle the progress event to 1000ms
            .on('response', (res) => {
                if (res.headers['content-type'].includes('application/json')) { //服务自定义错误
                    res.setEncoding('utf-8');
                    res.on('data', function(data) {
                        handle.error(errCode.server, data, privateModule);
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
                handle.error(errCode.http, err, privateModule);
            })
            .on('end', () => {
                if (fs.existsSync(tempPath)) {

                    //解压实例
                    let unziper = unzip.Extract({ path: savePath });
                    unziper.on('close', () => {
                        //解压完成事件
                        handle.finished(privateModule);
                    });

                    unziper.on('error', (err) => {
                        //解压错误事件
                        handle.error(errCode.unzip, err, privateModule);
                    });
                    // 需要解压的文件流
                    let unzipFile = self._unzipStream = fs.createReadStream(tempPath);

                    //下载完成事件
                    handle.downloadFinished(privateModule);
                    // console.log('start unzip...');

                    unzipFile.pipe(unziper); //开始解压
                    // console.log('unlink unzip...');
                    try {
                        fs.unlinkSync(tempPath); //尝试删除 避免解压过程中取消后的重复删除
                    } catch (err) {
                        // console.log('unlink...',err);
                    }

                } else {
                    //下载未完成时abort
                }
            })
            .on('abort', () => {
                if (fs.existsSync(tempPath)) { //下载过程中取消
                    if (self._unzipStream) { //解压过程中取消
                        // console.log('abort unzipFile close');
                        //结束解压
                        self._unzipStream.close();
                    }
                    // console.log('abort fs unlink');
                    fs.unlink(tempPath);
                }
                handle.destroyed(privateModule);
            })
            .pipe(fs.createWriteStream(tempPath));
    }

    destroy() {
        this._req.abort();
    }

};

module.exports = Downloader;
