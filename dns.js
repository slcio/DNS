var dgram = require("dgram"), config = require('./config')(), fs = require('fs');
var cluster = require('cluster'), isMaster = cluster.isMaster, workerProcesses = 0;

const DNSADDRESS = config.DNSADDRESS;
const DNSPORT = config.DNSPORT;
console.log("DNS Server: " + DNSADDRESS + ":" + DNSPORT);

//loder white list
var whiteList = [];
config.domains.forEach(function (domain) {
    whiteList[domainToHex(domain.domain).toString('hex')] = domain.ip;
});

//start master process
if (isMaster) {
    // start worker process
    if (config.worker_processes !== undefined) {
         workerProcesses = parseInt(config.worker_processes, 10);
    } else {
         workerProcesses = require('os').cpus().length;
    }
    for (var i = 0; i < workerProcesses; i++) {
          cluster.fork();
    }
    console.log('start master process, workerProcesses: ' + workerProcesses);
} else {
    dgram.createSocket("udp4", function (msg, rinfo) {
        var server = this;
        var client = dgram.createSocket("udp4");
        var address = rinfo.address;
        var port = rinfo.port;
        client.send(msg, 0, msg.length, DNSPORT, DNSADDRESS);
        var tid = 0, buf = null;
        client.on("message", function (msg, rinfo) {
            var domain = getDomain(msg);
            //check white list
            if (whiteList[domain]){
                //changeip
                msg = changeIp(msg, domain);
            }
            //sending
            buf = msg;
            if (tid) clearTimeout(tid);
            tid = setTimeout(function () {
                tid = 0;
                server.send(buf, 0, buf.length, port, address);
                client.close();
            }, 15);

        });
    }).bind(config.port, config.hostname);
}

function changeIp(msg, domain){
    var bufs = [], len = msg.length, resourcesmun, typesite = 14, ip = whiteList[domain], type;
    ip.split('.').forEach(function (data) {
        temp = new Buffer(1);
        temp.writeUInt8(parseInt(data,10), 0);
        bufs.push(temp);
    });
    //构造将IP转化成16进制
    ip =  parseInt('0x' + Buffer.concat(bufs).toString('hex'), 16);
    var text = msg.toString('hex');
    //获取资源数
    resourcesmun = msg.readInt8(7);
    if (!isNaN(resourcesmun) && resourcesmun > 0 ) {
        var begin = 1; //默认不处理第一个资源
        //获取第一个资源的类型
        type = msg.readUInt16BE(domain.length/2 + 12 + 4);
        if (!isNaN(type) && type == 1 ) {
            //如果资源类型==1，则处理第一个资源
            begin = 0;
        }
        //从后面倒数修改
        for (begin ; begin <= resourcesmun ; begin++ ) {
            //判断资源类型，如果资源类型为1，则进行处理
            if (msg.readUInt16BE(len - typesite) == 1 ) {
                //处理ip
                msg.writeUInt32BE(ip,len - typesite + 10);
                //处理缓存时间
              //  msg.writeUInt32BE(ip,len - typesite + 4);
            }
            typesite += 16;
        }
    }
    return msg;
}


//从数据中提取domain的值
function getDomain(msg){
    var buf = new Buffer(msg,'hex'), length = 12, hasNext;
    hasNext = buf.readUInt8(length);
    while ( !isNaN(hasNext) && hasNext > 0 ) {
        length = length + 1 + hasNext;
        hasNext = buf.readUInt8(length);
    }
    length = length + 3;
    return buf.slice(12,length).toString('hex');
}

//将domain按照dns包协议转换成16进制
function domainToHex(domain){
    var bufs  = [], temp;
    domain = domain.split('.');
    domain.forEach(function (data){
        temp = new Buffer(1);
        temp.writeUInt8(data.length, 0);
        bufs.push(temp);
        bufs.push(new Buffer(data));
    });
    temp = new Buffer(1);
    temp.writeUInt8(0, 0);
    bufs.push(temp);
    temp = new Buffer(2);
    temp.writeUInt16BE(1, 0);
    bufs.push(temp);
    return Buffer.concat(bufs);
}

