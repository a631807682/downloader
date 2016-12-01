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
            .pipe(fs.createWriteStream(tempPath).on('close', () => {
                //The 'finish' event is emitted after the stream.end() method has been called, and all data has been flushed to the underlying system.

                //The 'close' event is emitted when the stream and any of its underlying resources (a file descriptor, for example) have been closed. 
                //The event indicates that no more events will be emitted, and no further computation will occur.
                //Not all Writable streams will emit the 'close' event.
                if (fs.existsSync(tempPath)) {
                    //解压实例
                    // //测试fs释放
                    // fs.unlinkSync(tempPath);
                    // console.log(privateModule);
                    let unziper = self._unziper = unzip.Extract({ path: savePath });
                    // unziper.on('finish', () => {
                    //     console.log('unziper finish', privateModule);

                    //     // fs.unlink(tempPath);
                    //     // handle.finished(privateModule);
                    // });

                    unziper.on('close', () => {
                        // console.log('unziper close', privateModule);
                        fs.unlink(tempPath);
                        handle.finished(privateModule);
                    });

                    unziper.on('error', (err) => {
                        handle.error({ code: errCode.unzip, message: err }, privateModule);
                        fs.unlink(tempPath);
                    });

                    // 需要解压的文件流
                    let unzipFile = self._unzipStream = fs.createReadStream(tempPath);

                    //下载完成事件
                    handle.downloadFinished(privateModule);
                    unzipFile.pipe(unziper);
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
