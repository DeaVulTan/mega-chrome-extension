var nacl = require('tweetnacl');
var read = require('read')
var crypto = require('crypto');
var fs = require('fs');

if (process.argv.length !== 3) {
    console.error("Please run " + process.argv[0] + " " + process.argv[1] +  " secureboot.js");
    process.exit();
}

var config = JSON.parse(fs.readFileSync("config.json"));
var source = fs.readFileSync(process.argv[2]).toString('binary');
source = source.replace(/function xhr_load/, 'function xhr_load_xhr');
source = new Buffer(source, 'binary');

function toArrayBuffer(string) {
    var buffer = new Buffer(string, 'binary');
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return view;
}

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}



read({ prompt: 'Password: ', silent: true }, function(er, password) {
    var decipher = crypto.createDecipher('aes192', password);
    var plain = "";
    decipher.on('readable', function() {
        var data = decipher.read();
        if (data) {
            plain += data.toString('binary');
        }
    });
    decipher.on('end', function() {
        var signed = nacl.sign(source, toArrayBuffer(plain)); 
        var out    = process.argv[2].replace(/\.js$/, '.bin');
        fs.writeFileSync(out, toBuffer(signed));
        console.log("Wrote " + out);
    });
    decipher.write(new Buffer(config.privateKey, 'base64'));
    decipher.end();
});
