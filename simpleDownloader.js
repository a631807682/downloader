const fs = require('fs-extra'),
    request = require('request'),
    progress = require('request-progress'),
    defaultHandle = require('./lib/defaultHandle'),
    errCode = require('./lib/errCode'),
    path = require('path'),
    urldecode = require('urldecode');

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

        this._url = url;
        this._options = options;
        this._privateModule = privateModule; //自定义标记
        this._tempPath = `${tempDirectory}/${new Date().getTime()}`; //临时文件
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
        progress(self._req, { throttle: 200, lengthHeader: 'x-transfer-length' }) //throttle the progress event to 200ms
            .on('response', (res) => {
                if (res.statusCode != 200 || res.headers['content-type'].includes('application/json')) { //服务自定义错误
                    res.setEncoding('utf-8');
                    res.on('data', function(data) {
                        handle.error({ code: errCode.server, message: data }, privateModule);
                        self._req.abort(); //结束request
                    });
                } else if (!path.extname(savePath).includes('.')) { //未传文件名
                    let disposition = res.headers['content-disposition'];

                    if (!disposition) {
                        handle.error({ code: errCode.http, message: '未知文件名' }, privateModule);
                        self._req.abort(); //结束request
                    } else {
                        let match = disposition.match(/(filename=|filename\*='')(.*)$/);
                        let filename = match && match[2] || 'default-filename.out';
                        filename = urldecode(filename);
                        savePath = path.join(savePath, filename);
                    }
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
                // if (fs.existsSync(tempPath)) {
                //     //重命名
                //     fs.move(tempPath, savePath, { clobber: true }, function(err) {
                //         if (err) {
                //             fs.unlinkSync(tempPath);
                //             handle.error({ code: errCode.dir, message: err }, privateModule);
                //         }
                //         handle.downloadFinished(privateModule);
                //     });
                // }
            })
            .on('abort', () => {
                if (fs.existsSync(tempPath)) { //下载过程中取消
                    fs.unlinkSync(tempPath);
                }

                //解压读取流 到 解压写入流 会创建文件
                handle.destroyed(privateModule);
            })
            .pipe(fs.createWriteStream(tempPath).on('finish', () => {
                if (fs.existsSync(tempPath)) {
                    //重命名
                    fs.move(tempPath, savePath, { clobber: true }, function(err) {
                        if (err) {
                            fs.unlinkSync(tempPath);
                            handle.error({ code: errCode.dir, message: err }, privateModule);
                        }
                        handle.downloadFinished(privateModule);
                    });
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
