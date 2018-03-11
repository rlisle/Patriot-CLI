#!/usr/bin/env node
var program = require('commander');
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

program.parse(process.argv);

if (!program.args.length) {
    console.log("No args, calling help");
    program.help();
};

function setDevice(level, device, otherDevices) {
    console.log("Setting device %s to %s",device,level);
    var client = mqtt.connect('mqtt://192.168.10.124');
    client.publish('patriot',device+':'+level);
    client.end();
}

function listPhotons(username,password) {
    username = username || process.env.PARTICLE_USERNAME;
    password = password || process.env.PARTICLE_PASSWORD;
    if( username==null || password==null) {
        console.log("\nError: this command requires a particle.io account login.");
        console.log("       Please specify your particle.io login info using");
        console.log("       patriot login -u username and -p password");
        console.log("\nAlternatively, you can set environment variables:\n");
        console.log("   PARTICLE_USERNAME to your Particle.io login user");
        console.log("   PARTICLE_PASSWORD to your Particle.io login password\n");
    } else {
        console.log("Listing Photons: user: %s, pw: %s",username,password);
        // Log into particle
        particle.login(username, password)
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
}

function listDevices(username,password) {
    username = username || process.env.PARTICLE_USERNAME;
    password = password || process.env.PARTICLE_PASSWORD;
    if( username==null || password==null) {
        console.log("\nError: this command requires a particle.io account login.");
        console.log("       Please specify your particle.io login info using");
        console.log("       patriot login -u username and -p password");
        console.log("\nAlternatively, you can set environment variables:\n");
        console.log("   PARTICLE_USERNAME to your Particle.io login user");
        console.log("   PARTICLE_PASSWORD to your Particle.io login password\n");
    } else {
        console.log("Listing devices: user: %s, pw: %s",username,password);
        // Log into particle
        particle.login(username, password)
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
}
