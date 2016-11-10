const fs = require('fs-extra'),
    request = require('request'),
    progress = require('request-progress'),
    defaultHandle = require('./lib/defaultHandle'),
    errCode = require('./lib/errCode'),
    path = require('path'),
    urldecode = require('urldecode'),
    url = require('url');

class Downloader {
    constructor(url, options, privateModule) {
        //属性
        this._url = url;
        this._options = options || {};
        this._privateModule = privateModule || {}; //自定义标记
    }

    /**
     * 开始下载
     * @param  {[type]} savePath [保存地址]
     * @param  {[type]} handle   [触发行为]
     */
    start(savePath, handle) {
        let self = this;
        self._savePath = savePath;
        self._handle = handle = Object.assign(defaultHandle, handle);

        //保存文件目录
        let dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        if (!path.extname(savePath).includes('.')) { //savePath未命名文
            let pathname = url.parse(self._url).pathname;
            // console.log(pathname);
            let urlFileName = path.basename(pathname);
            // console.log(urlFileName);
            if (urlFileName.includes('.')) {
                self._savePath = path.join(self._savePath, urlFileName);
                self._resumedl();
            } else {
                //下载名未知 -> 无法得知文件是否下载过 -> 请求前无法确定byte开始位置
                throw new Error('start err: savePath must include filename');
            }
        } else { //已命名
            self._resumedl();
        }
    }

    /**
     * 取消下载
     */
    destroy() {
        this._req.abort();
    }

    /**
     * 继续下载
     */
    _resumedl() {
        let self = this;
        let tempPath = self._savePath + '.mt';
        let localSize = 0; //本地已存在的文件大小
        let maxSize = 0;
        let abortFlag = false; //是否取消
        let handle = self._handle;
        let privateModule = self._privateModule;

        //获取原下载文件大小
        if (fs.existsSync(tempPath)) {
            let stat = fs.statSync(tempPath);
            localSize = stat.size;
        }

        let options = self._options;
        options.headers = Object.assign({ Range: `bytes=${localSize}-` }, options.headers); //续传请求头

        self._req = request(self._url, options);

        progress(self._req, { throttle: 200, lengthHeader: 'x-transfer-length' })
            .on('response', (res) => {
                //普通下载状态:200 续连状态:206
                if (res.statusCode < 200 || res.statusCode > 299 || res.headers['content-type'].includes('application/json')) { //服务自定义错误
                    res.setEncoding('utf-8');
                    res.on('data', function(data) {
                        handle.error({ code: errCode.server, message: data }, privateModule);
                        self._req.abort(); //结束request
                    });
                } else { // 正常
                    switch (res.statusCode) {
                        case 200:
                            if (res.headers['content-length'] != undefined) {
                                maxSize = +res.headers['content-length']; //文件总长
                                localSize = 0;
                            } else {
                                console.warn('warning: res.headers.content-length is not defined , can not calculate progress .');
                            }
                            self._req.pipe(fs.createWriteStream(tempPath)); //文件流覆盖
                            break;
                        case 206:
                            if (res.headers['x-transfer-length'] != undefined) {
                                maxSize = +res.headers['x-transfer-length']; //文件总长
                            } else {
                                console.warn('warning: res.headers.x-transfer-length is not defined , can not separate download .');
                            }
                            self._req.pipe(fs.createWriteStream(tempPath, { 'flags': 'a' })); //文件流增加
                            break;
                        default:
                            console.error('res.statusCode is not handle', res.statusCode);
                            break;
                    }

                }
            })
            .on('progress', (state) => {
                //计算续传进度
                let percentage = 0;
                if (maxSize > 0) {
                    percentage = (state.size.transferred + localSize) / maxSize;
                }

                let formatState = {
                    progress: parseFloat(percentage * 100).toFixed(2)
                };
                //下载中事件
                handle.started(formatState, privateModule);
            })
            .on('error', (err) => {
                //错误事件
                handle.error({ code: errCode.http, message: err }, privateModule);
            })
            .on('end', () => {
                if (fs.existsSync(tempPath)) {
                    let stat = fs.statSync(tempPath);
                    //非中断,下载完成或未知文件大小
                    if ((!abortFlag)) {
                        fs.move(tempPath, self._savePath, { clobber: true }, function(err) {
                            if (err) {
                                handle.error({ code: errCode.dir, message: err }, privateModule);
                            }
                            handle.downloadFinished(privateModule);
                        });
                    }
                }
            })
            .on('abort', () => {
                abortFlag = true;
                //解压读取流 到 解压写入流 会创建文件
                handle.destroyed(privateModule);
            });
    }
};

module.exports = Downloader;
