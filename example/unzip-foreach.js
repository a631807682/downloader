const Download = require('../index').unzipDownloader;

// let arr = [1074];
// let arr = [1068, 1069, 1070, 1073,  1075];
let arr = [1068, 1069, 1070, 1073, 1074, 1075];

const handle = {

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
        console.log('Download progress: ' + state.progress + ' %', module);
    },
    /*
        下载成功
     */
    downloadFinished: function(module) {
        console.log('Download completed', module);
    },
    finished: function(module) {
        console.log('Download and unzip completed !', module);
    }
};

arr.forEach(id => {
    let url = `http://192.168.1.205:4003/api/public/attachment/download?id=${id}`;

    let download = new Download(url, null, { 'id': id });

    download.start('./output', handle);
});
