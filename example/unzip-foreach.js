const Download = require('../index').unzipDownloader,
    EE = require('events').EventEmitter,
    fs = require('fs-extra');

let getId = function(min, max) {
    let r = [];
    for (let i = min; i < max; i++) {
        r.push(i);
    }
    return r;
};

// let arr = [1074];
// let arr = [1068, 1069, 1070, 1073,  1075];
// let arr = [1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1451];
let arr = getId(1451, 1460);
// let arr = [1442];

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
        let sp = `./output/gvim_${module.id}`;

        // fs.renameSync(`./output/${module.id}`, sp);
        fs.move(`./output/${module.id}`, sp, function(err) {
            if (err) console.error('move ', err);
        });
        // console.log('finished callback', module, fs.existsSync(`./output/${module.id}`))
        // event.emit('all');
    }
};

try {
    fs.removeSync('./output');
} catch (e) {}


arr.forEach(id => {
    let url = `http://192.168.1.205:4003/api/public/attachment/download?id=${id}`;

    let download = new Download(url, null, { 'id': id });

    download.start(`./output/${id}`, handle);
});
