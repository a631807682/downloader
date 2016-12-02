const fs = require('fs'),
    unzip = require('unzip2'),
    fstream = require('fstream');

// let unzipStream = unzip.Extract({ path: './output' });
// let readStream = fs.createReadStream('./MySocial.zip');
// // let readStream = fs.createReadStream('./downloadtemp/1477548558694.zip');
// readStream.pipe(unzipStream);

// let unzipStream = fs.createReadStream('./MySocial.zip');
// let index = 0;

// unzipStream.pipe(unzip.Parse())
//     .on('entry', function(entry) {
//         // console.log(entry)
//         var fileName = entry.path;
//         var type = entry.type; // 'Directory' or 'File'

//         // console.log('-------', fileName, type);
//         if (type === "File") {
//             index++;
//             entry.pipe(fstream.Writer(`./output/${fileName}`));
//         } else {
//             entry.autodrain();
//         }
//     })
//     .on('close', function() {
//         console.log('close', index);
//     });


let unzipStream = unzip.Extract({ path: './output/test' });
let readStream = fs.createReadStream('./output/empty_test/empty_test.zip');
readStream.pipe(unzipStream);