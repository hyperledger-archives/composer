var http = require('http');
var visits = 0;

let host = '127.0.0.1';
let port = 3001;

let server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    visits += 1;
    var msg = 'Visits: ' + visits;
    res.end(msg + '\n'); console.log(msg);
    if(visits == 5) {
        process.exit();
    }
}).listen(port, host);
console.log('Server running at http://' + host + ':' +port);

process.on('message', (msg) => {
    switch(msg.cmd)
    {
        case 'cleanup':
            console.log('Cleaning up server');
            server.close();
            process.exit();
            break;
        default:
            console.log('Processing default');
            server.close();
            process.exit();
    }
});
