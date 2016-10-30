// var unzip = require('unzip2'),
//     fs = require('fs'),
//     fstream = require('fstream');

// let i = 0;
// let unzipStream = fs.createReadStream('./downloadtemp/1477807723050.zip');

// unzipStream.pipe(unzip.Parse())
//     .on('entry', function(entry) {
//         var fileName = entry.path;
//         var type = entry.type; // 'Directory' or 'File'
//         var size = entry.size;
//         console.log('-------', fileName, type);
//         if (type === "File") {
//             entry.pipe(fstream.Writer(`./output/${fileName}`));
//             i++;
//         } else {
//             entry.autodrain();
//         }
//     });


// unzipStream.on('close', function() {
//     console.log('close', i);
//     this.emit('finish')
// });


// setTimeout(function() {
//     console.log('===============================unzipStream.close');
//     unzipStream.close();
// }, 100);


const UnzipClass = require('../lib/unzip');

let myUnzip = new UnzipClass('./downloadtemp/1477823446663.zip');
// myUnzip.unzipStream.on('stop', () => {
//     console.log('stop...');
// });

myUnzip.unzipStream.on('close', () => {
    console.log('close...');
});


myUnzip.unzipStream.on('error', (err) => {
    console.log('error...', err);
});

myUnzip.start('./output');

setTimeout(function() {
    // myUnzip.stop();
}, 100);
