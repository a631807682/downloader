let Download = require('../index').simpleDownloader;


let options = {

};

let url = 'http://192.168.1.205:4001/api/public/attachment/download?id=421';

// let url = 'http://127.0.0.1:4001/api/public/attachment/download?id=395';
// let url = 'http://192.168.1.205:4001/api/public/attachment/download?id=371';

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

download.start('./output', handle);

setTimeout(function() {
    // setImmediate(function() {
    // download.destroy();
    // });
    // download.destroy();
}, 1000);
