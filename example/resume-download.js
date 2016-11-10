/**
 * 说明
 * url带文件名 或 保存路径带文件名 二选一
 * 原因是 对于未知文件名 在发送请求前无法确定文件是否下载过 也就无法计算继续下载的开始字节
 */
let Download = require('../index').resumeDownloader;

let options = {

};
// let url = 'http://www.sqlite.org/2016/sqlite-dll-win64-x64-3130000.zip';
// let url = 'http://192.168.1.205:4001/api/public/attachment/download?id=421';

// let url = 'http://127.0.0.1:4001/api/public/attachment/download?id=395';
// let url = 'http://192.168.1.205:4001/api/public/attachment/download?id=371';
let url = 'http://127.0.0.1:8000';

let download = new Download(url, options, { 'abc': 'hahaha' });

const handle = {
    /*
        取消
     */
    destroyed: function(module) {
        console.log('Download destroyed.', module);
    },
    /*
        出错
     */
    error: function(err, module) {
        console.log('Download or unzip error : ', err, module);
    },
    /*
        正在下载
     */
    started: function(state, module) {
    	 // console.log('Download progress: ', state);
        console.log('Download progress: ' + state.progress + ' %', module);
    },
    /*
        下载成功
     */
    downloadFinished: function(module) {
        console.log('Download completed', module);
        // setImmediate(function() {
        //     download.destroy();
        // });
        // download.destroy();
    }
};

// download.start('./output/myeclipse.zip', handle);
download.start('./output/abc.zip', handle);

// setTimeout(function() {
//     download.destroy();
// }, 3000);