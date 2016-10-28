//默认handle
const defaultHandle = {
    /*
        取消
     */
    destroyed: function(module) {
        console.log('Download destroyed.');
    },
    /*
        出错
     */
    error: function(code, err, module) {
        console.log('Download  error : ' + code + ':' + err);
    },
    /*
        尝试连接 服务器未反应
     */
    notStarted: function(module) {
        console.log('Download  not started.');
    },
    /*
        正在下载
     */
    started: function(state, module) {
        console.log('Download progress: ' + state.progress + ' %');
    },
    /*
        下载成功
     */
    downloadFinished: function(module) {
        console.log('Download completed');
    },
    /*
        下载并解压成功
     */
    finished: function(module) {
        console.log('Download and unzip completed !');
    }
};

module.exports = defaultHandle;
