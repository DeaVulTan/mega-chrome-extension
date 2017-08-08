var nacl = require('tweetnacl');
var read = require('read')
var crypto = require('crypto');
var fs = require('fs');

read({ prompt: 'Password: ', silent: true }, function(er, password) {
    var cipher = crypto.createCipher('aes192', password);
    var encrypted = "";
    var keys = nacl.sign.keyPair();
    cipher.on('readable', function() {
        var data = cipher.read();
        if (data) {
            encrypted += data.toString('binary');
        }
    });
    cipher.on('end', function() {
        fs.writeFile('config.json', JSON.stringify({
            publicKey: new Buffer(keys.publicKey).toString('base64'),
            privateKey: new Buffer(encrypted, 'binary').toString('base64'),
        }, null, '   '));
    });
    cipher.write(new Buffer(keys.secretKey));
    cipher.end();
});
