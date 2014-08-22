var domains = [
    {
        domain: 'ad.ec61.com',
        ip:'255.255.255.255'
    },

    {
        domain: 'v.youku.com',
        ip:'255.255.255.255',
    },
    {
       domain: 'vpn.nogfw.com',
      ip:'127.0.0.1',
 }
];
var config = {
    DNSADDRESS: '114.114.114.114',
    DNSPORT: '53',
    hostname: '0.0.0.0',
    port: 53,
    domains: domains,
    worker_processes: 1
};
module.exports = function() {
  return config;
};




