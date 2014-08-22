var domains = [
    {
        domain: 'www.google.com',
        ip:'8.8.8.8'
    },
];
var config = {
    DNSADDRESS: '8.8.8.8',
    DNSPORT: '53',
    hostname: '0.0.0.0',
    port: 53,
    domains: domains,
    worker_processes: 1
};
module.exports = function() {
  return config;
};




