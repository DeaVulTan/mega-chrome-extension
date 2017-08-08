(function() {
    var publicKey = nacl.util.decodeBase64("pGzCwa73i8ryEb38T6IZ0dm/9ZXt6lfnRTFo0osSEHA=");

    // fix me
    // This the secureboot.bin (https://mega.nz/secureboot.js signed)
    // with PHP in front of it to set the Allow Origin headers
    var secureboot = "http://localhost:8080/secureboot.php";
    // static server, until we can fix secureboot.js to not do anything
    // special on extensions
    localStorage.staticpath = "https://eu.static.mega.co.nz/3/";

    function toJavascript(content) {
        var blob = new Blob([content], { type: 'text/javascript' });
        var url  = URL.createObjectURL(blob);
        var script = document.createElement('script');
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    var cdn = new Storage("meganz");

    function hex(buffer) {
        var hexCodes = [];
        var view = new DataView(buffer);
        for (var i = 0; i < view.byteLength; i += 4) {
            // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
            var value = view.getUint32(i)
                // toString(16) will give the hex representation of the number without padding
                var stringValue = value.toString(16)
                // We use concatenation and slice for padding
                var padding = '00000000'
                var paddedValue = (padding + stringValue).slice(-padding.length)
                hexCodes.push(paddedValue);
        }

        // Join all the hex strings into one
        return hexCodes.join("");
    }


    function sendfile(content, jsi, xhri) {
        crypto.subtle.digest("SHA-256", str2ab(content)).then(function(hash) {
            if (!compareHashes(hex(hash), jsl[jsi].f)) {
                return console.error("bug");
            }
            jsl[jsi].text = content;
            jsl_current += jsl[jsi].w || 1;
            jsl_progress();
            if (++jslcomplete == jsl.length) initall();
            else jsl_load(xhri);
        });
    }

    function xhr_load_local(url, jsi, xhri) {
        cdn.get(url, function(found, content) {
            if (found) return sendfile(content, jsi, xhri);
            fetch(localStorage.staticpath + url).then(function(response) {
                return response.text();
            }).then(function(js) {
                cdn.put(url, js, function() {
                    sendfile(js, jsi, xhri);
                });
            });
        });
    }

    fetch(secureboot).then(function(response) {
        return response.arrayBuffer();
    }).then(function(response) {
        var binary = new Uint8Array(response);
        if (!nacl.sign.open(binary, publicKey)) {
            // fix me
            return alert("men in the middle attack");
        }

        return binary.slice(64)
    }).then(function(securebootjs) {
        toJavascript(securebootjs);
        var doBoot = setInterval(function() {
            if (typeof jsl_start === "function") {
                clearInterval(doBoot);
                xhr_load = xhr_load_local;
                jsl_start();
            }
        }, 10);
    });

})();
