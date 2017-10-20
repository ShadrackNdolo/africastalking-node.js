const _ = require('lodash');
const grpc = require('grpc');
const path = require('path');
const unirest = require('unirest');


const fd = grpc.load(path.join(__dirname, './proto/com/africastalking/SdkServerService.proto')).africastalking;

let config = null;

const sipCredentials = [];


const getToken = (cxt, callback) => {

    let url = 'https://';
    const type = cxt.request.type;
    switch(type) {
        case 'API':
            url += 'api.';
            break;
        case 'Payment':
            url += 'payment.';
            break;
        default:
            callback(new Error(`Invalid/Unknown token type: ${type}`));
            return;
    }

    if (config.username === 'sandbox') {
        url += 'sandbox.';
    }

    // url += 'africastalking.com/token/generate';
    url = 'https://kaende-api-rs-host.africastalking.com/token/generate';
    console.log(url);

    unirest.post(url)
        .headers({
            'apiKey': config.apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        .send({ username: config.username })
        .end(function (response) {
            if (response.status >= 200 && response.status < 300) {
                const tokenResponse = response.body;
                callback(null, {
                    token: tokenResponse.token,
                    expiration: Date.now() + (tokenResponse.lifetimeInSeconds * 1000),
                    username: config.username,
                    environment: config.username === 'sandbox' ? 'sandbox' : 'production',
                });
            } else {
                callback(new Error(response.body), null);
            }
        });
};

const getSipCredentials = (cxt, callback) => {
    callback(null, { credentials: sipCredentials });
};

module.exports = (params) => {
    config = _.cloneDeep(params);
    return {
        definition: fd.SdkServerService.service,
        implementation: {
            getToken,
            getSipCredentials,
        },

        addSipCredentials: (username, password, host, port = 5060, transport = "udp") => {
            sipCredentials.push({
                username,
                password,
                host,
                port,
                transport,
            });
        },
    };
};