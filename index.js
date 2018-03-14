#!/usr/bin/env node

const mqttURL = 'mqtt://192.168.10.124';

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var mqtt = require('mqtt');
var particle = require('./src/particle');

program
    .version('0.0.1', '-v, --version')
    .option('-d, --debug', 'Display diagnostic information')

program
    .command('photons')
    .option('-u, --username <username>', 'Particle login username')
    .option('-p, --password <password>', 'Particle login password')
    .description('list all active photons')
    .action(function(options) {
        listPhotons(options.username,options.password);
    });

program
    .command('devices')
    .option('-u, --username <username>', 'Particle login username')
    .option('-p, --password <password>', 'Particle login password')
    .description('list all active devices')
    .action(function(options) {
        listDevices(options.username,options.password);
    });

program
    .command('on <device> [otherDevices')
    .alias('set')
    .alias('enable')
    .alias('start')
    .description('turn on the specified devices(s)')
    .action(function(device, otherDevices){
        console.log("ON %s",device);
        setDevice(100, device, otherDevices);
    });

program
    .command('off <device> [otherDevices')
    .alias('clear')
    .alias('disable')
    .alias('stop')
    .description('turn on the specified devices(s)')
    .action(function(device, otherDevices){
        console.log("OFF %s",device);
        setDevice(0, device, otherDevices);
    });

program
    .command('reconnect')
    .description('reconnect photons to MQTT broker')
    .action(function(options){
        console.log("RECONNECT");
        reconnect();
    });

program.parse(process.argv);

if (!program.args.length) {
    console.log("No args, calling help");
    program.help();
};

function login(username,password) {
    username = username || process.env.PARTICLE_USERNAME;
    password = password || process.env.PARTICLE_PASSWORD;
    if( !username || !password) {
        console.log("\nThis command requires a particle.io account login.");
        console.log("     Please specify your particle.io credentials:");
        console.log("     patriot login -u username and -p password");
        console.log("\n     Alternatively, you can set environment variables:\n");
        console.log("     PARTICLE_USERNAME to your Particle.io login username");
        console.log("     PARTICLE_PASSWORD to your Particle.io password\n");
    
        if( !username ) {
            co(function *() {
                username = yield prompt('username: ');
            });
        }
        if( !password ) {
            co(function *() {
                password = yield prompt.password('password: ');
            });
        }
    }
    return particle.login(username, password);
}

function setDevice(level, device, otherDevices) {
    console.log("Setting device %s to %s",device,level);
    var client = mqtt.connect(mqttURL);
    client.publish('patriot',device+':'+level);
    client.end();
}

function reconnect(device) {
    console.log("Reconnecting");
    var client = mqtt.connect(mqttURL);
    client.publish('patriot','reconnect');
    client.end();
}

function listPhotons(username,password) {
    login(username,password)
    .then(function(token) {
        particle.getPhotons(token)
            .then(function(photons) {
                console.log("Photons: ");
                photons.forEach(function (photon) {
                    console.log("  %s",photon);
                });
        },
            function(err) {
                console.log("List photons failed: ", err);
            })

    },
    function(err) {
        console.log("Could not log in.", err);
    });
}

function listDevices(username,password) {
login(username, password)
    .then(function(token) {
        particle.getSupportedDevices(token)
            .then(function(devices) {   // Actually, activities
                console.log("Devices: ");
                devices.forEach(function (device) {
                    console.log("  %s",device);
                });
        },
            function(err) {
                console.log("List devices failed: ", err);
            })

    },
    function(err) {
        console.log("Could not log in.", err);
    });
}
