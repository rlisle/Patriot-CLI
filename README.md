# Patriot-CLI
Command line interface for Patriot

This utility allows interrogating and controlling Patriot devices
using the command line.

## Commands

   patriot <options> <command>
   
### photons
This will display a list of all active photon devices

### devices 
This will display a list of all active Patriot devices.

### on <device>
This will turn on the device named <device>

### off <device>
This will turn off the device named <device>

### reconnect
Reconnect each photon to the MQTT broker.

This is useful after the MQTT broker has been restarted.