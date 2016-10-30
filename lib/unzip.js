const unzip = require('unzip2'),
    fs = require('co-fs'),
    fstream = require('fstream'),
    co = require('co');

class Unzip {

    constructor(path) {
        this.path = path;
        this._stopFlag = false;
        this._unzipStream = fs.createReadStream(path);
        this.entries = [];
    }

    start(savePath) {
        let self = this;
        let unzipStream = self._unzipStream;
        let entries = self.entries;

        unzipStream.pipe(unzip.Parse())
            .on('entry', function(entry) {
                entries.push(entry);
                entry.autodrain();

                // let fileName = entry.path;
                // let type = entry.type; // 'Directory' or 'File'
                // let size = entry.size;
                // if (!self._stopFlag) {
                //     let ws = fstream.Writer(`${savePath}/${fileName}`);
                //     self._writeStream.push(ws);
                //     console.log(fileName, type);
                //     if (type === "File") {
                //         entry.pipe(fstream.Writer(`${savePath}/${fileName}`));
                //     } else {
                //         entry.autodrain();
                //     }
                // } else {
                //     unzipStream.close(() => {
                //         console.log('---------stop--------');
                //         // console.log(self._writeStream)
                //         self._writeStream.forEach((s) => {
                //             s.endSync();
                //         });
                //         self._unzipStream.emit('stop');
                //     });
                // }

            }).on('close', () => {
                // co(function*() {
                //     for (e of entries) {
                //         if (!self.isStop) {
                //             entry.pipe(fstream.Writer(`${savePath}/${fileName}`));
                //         }
                //     }
                // }).then((success) => {
                //     console.log('success');
                // }, (error) => {
                //     console.log('error');
                // });

                console.log(entries.length);
            }).on('error', (err) => {
                self._unzipStream.emit('error', err);
            });
    }

    get unzipStream() {
        return this._unzipStream;

    }

    stop() {
        this._stopFlag = true;
    }

}

module.exports = Unzip;
