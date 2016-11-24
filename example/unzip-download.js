const Download = require('../index').unzipDownloader;

let options = {
    rejectUnauthorized: false,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": 0,
        "ei": "BFEBFBFF-000206A7-00000000-00000000+WD-WXA1A91X2323",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1.7601; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36",
        "token": "ArWd5mglXQEqzpZVnbXHQpcEauELvQu4y8a75vtf/2xL/0QUfTPQf6Ph9VHJ6iOuaYoAIz4u3DdbMYfr+bPaospckn92zL6T234pFoRY5CQ=",
        "language": "zh-CN"
    }
};

// let url = 'http://www.sqlite.org/2016/sqlite-dll-win64-x64-3130000.zip';
// let url = 'http://192.168.1.205:10060/application/download/5816c4522c77252007df6b93';
// let url = 'https://gw.alicdn.com/bao/uploaded/LB1vovgMVXXXXXaXVXXXXXXXXXX.zip';
// let url = 'https://img.alicdn.com/tps/TB1uu1rNVXXXXaxXXXXXXXXXXXX-160-280.jpg';//解压错误测试
// let url = 'http://192.168.1.153/info/iproces';//404测试
let url = 'http://192.168.1.205:10060/application/download/5815a2d642815c0e4f87a0e6';

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
        console.log('Download or unzip error : ',  err, module);
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
        // setImmediate(function() {
        //     download.destroy();
        // });
        // download.destroy();
    },
    /*
        下载并解压成功
     */
    finished: function(module) {
        console.log('Download and unzip completed !', module);
    }
};

// download.start('./output', handle);

setTimeout(function() {
            // setImmediate(function() {
            // download.destroy();
        // });
    // download.destroy();
    download.start('./output', handle);
}, 200);
