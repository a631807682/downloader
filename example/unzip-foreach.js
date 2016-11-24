const Download = require('../index').unzipDownloader,
    EE = require('events').EventEmitter;


// let arr = [1074];
// let arr = [1068, 1069, 1070, 1073,  1075];
let arr = [1068, 1069, 1070, 1073, 1074, 1075];

//测试监听所有完成事件
let index = 0;
let max = arr.length;
let event = new EE();
event.on('all', () => {
    ++index;
    console.log('over =>', index, max);
    if (index == max) {
        console.log('--------------all over--------------');
        event.removeAllListeners();
        console.log('removeListener...');
    }
});

const handle = {
    /*
        出错
     */
    error: function(err, module) {
        console.log('Download or unzip error : ', err, module);
        max--;
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
        event.emit('all');
    }
};

arr.forEach(id => {
    let url = `http://192.168.1.205:4003/api/public/attachment/download?id=${id}`;

    let download = new Download(url, null, { 'id': id });

    download.start('./output', handle);
});
