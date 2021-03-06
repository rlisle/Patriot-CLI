'use strict';

const Particle = require("particle-api-js");
const particle = new Particle();

var token;

// Log into particle
/**
 * login to particle.io account
 * @param userid
 * @param password
 * @returns {PromiseLike<T> | Promise<T> | *} access token
 */
function login(userid, password) {
    return particle.login({username: userid, password: password})
        .then(function (data) {
            token = data.body.access_token
            return token;
        });
}

/**
 * getPhotons
 * @param token
 * @returns {Promise} array of active particle.io devices
 */
function getPhotons(token) {

    // Get list of active Photons
    return particle.listDevices({ auth: token}).then(function(result) {

            let statusCode = result.statusCode; // s/b 200
            if(statusCode != 200) {
                return [];
            }

            let photonNames = result.body.filter(function(item) {
                return item.connected;
            }).map(function(item){
                return item.name;
            });
            return photonNames;
        });
}

/**
 * getSupportedDevices
 * @param token
 * @returns {Promise} array of supported activity names
 */
function getSupportedDevices(token) {

    // Get list of active Photons
    return particle.listDevices({ auth: token}).then(function(result) {

            let statusCode = result.statusCode; // s/b 200
            if(statusCode != 200) {
                return [];
            }

            let photonNames = result.body.filter(function(item) {
                return item.connected;
            }).map(function(item){
                return item.name;
            });

            // Read list of devices from each Photon
            // Use promises to wait until all are done'
            let devices = [];
            let promises = [];
            photonNames.forEach(function(name) {

                let p = Promise.race([
                    getVariable(name, 'Devices', token).then(function (supported) {
                            //Split string into array of individual strings
                            let supportedStrings = supported.split(',');
                            supportedStrings.forEach(function (item) {
                                if(item) {
                                    devices.push(item);
                                }
                            });
                            return 0;
                        },
                        function (err) {
                            return 1;
                        }),
                    new Promise(function(resolve,reject){
                        setTimeout(function() { resolve('[]'); }, 5000);
                    })
                ]);
                promises.push(p);
            });
            return Promise.all(promises).then(values => {
                return devices;
        }); /*.timeout(5000,"timeout");*/
        },
        function(err){
            return devices;
        });
}


/**
 * getDeviceIdForDevice
 * @param device
 * @param token
 * @returns {Promise} deviceId for Photon implementing device
 */
function getDeviceIdForDevice(device, token) {

    // Get list of active Photons
    return particle.listDevices({ auth: token}).then(function(result) {

            let statusCode = result.statusCode; // s/b 200
            if(statusCode != 200) {
                return undefined;
            }

            let photonNames = result.body.filter(function(item) {
                return item.connected;
            }).map(function(item){
                return item.name;   //TODO: need ID also!
            });

            // Read list of devices from each Photon
            // Use promises to wait until all are done'
            let deviceId = undefined;
            let promises = [];
            photonNames.forEach(function(name) {

                let p = getVariable(name, 'Devices', token).then(function (devices) {
                        //TODO: Case mismatch. Need to perform case insensitive match.
                        let lcDevices = devices.toLocaleLowerCase();
                        if (lcDevices.indexOf(device) != -1) {
                            deviceId = name;
                            return name;
                        }
                    },
                    function (err) {
                        return undefined;
                    });
                promises.push(p);
            });
            return Promise.all(promises).then(values => {
                return deviceId;
        });
        },
        function(err){
            return undefined;
        });
}

function getVariable(deviceId, variableName, token) {
    let args = { deviceId: deviceId, name: variableName, auth: token};
    return particle.getVariable(args).then(function(response){
        return response.body.result;
    })
}

function callFunction(deviceId, functionName, argument, token) {
    let args = { deviceId: deviceId, name: functionName, argument: argument, auth: token};
    return particle.callFunction(args).then(function(response){
        return response.body.return_value;
    })
}

/**
 * Call particle.io publish.
 * @param data
 * @param token
 */
function publish(data, token) {
    let args = { name: "patriot", data: data, auth: token, isPrivate: true };
    return particle.publishEvent(args)
        .then((response) => {
    return response.body.ok;
},
    (err) => {  // Want to differentiate between invalid token, network error, API error
        //TODO: parse the error and return a meaningful message
        let errorText = err.body.error_description;
        throw(errorText);
    });
}

module.exports = {
    login: login,
    getSupportedDevices: getSupportedDevices,
    getPhotons: getPhotons,
    getDeviceIdForDevice: getDeviceIdForDevice,
    getVariable: getVariable,
    callFunction: callFunction,
    publish: publish
};
