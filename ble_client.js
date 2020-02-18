const maxApi = require('max-api');
var noble = require('@abandonware/noble');

var serviceUUID = "02366E80CF3A11E19AB40002A5D5C51B";
var characteristicUUID = "340A1B80CF4B11E1AC360002A5D5C51B";
var deviceName = "BlueNRG"


noble.on('stateChange', function (state) {
  if (state === 'poweredOn') {
    noble.startScanning();
    maxApi.post('Scanning...!')
  } else {
    noble.stopScanning();
    maxApi.post('Stop.')
  }
});

noble.on('discover', function (peripheral) {
  // Look for BlueNRG device and connect to it
  if (peripheral.advertisement.localName == deviceName) {
    maxApi.post('BlueNRG found!');
    maxApi.post('Connecting to  ' + peripheral.address + ' ' + peripheral.advertisement.localName);    

    // Execute connection
    connectToDevice(peripheral);
  }
});

let connectToDevice = function (peripheral) {
  // BLE cannot scan and connect in parallel, so we have to stop scanning process
  noble.stopScanning()

  peripheral.connect((error) => {
    if (error) {
      maxApi.post('Connection error: ' + error)
      noble.startScanning([], true)
      return
    }
    
    maxApi.post('Connected!')

    peripheral.on('servicesDiscovered', (peripheral, services) => {
      maxApi.post('servicesDiscovered: Found ' + services.length + ' services! ')
      meta.services = services
      for (let i in services) {
        const service = services[i]
        maxApi.post('\tservice ' + i + ' : ' + JSON.stringify(service))
      }
    });

    peripheral.discoverServices([], (error, services) => {
      let sensorCharacteristic

      servicesToRead = services.length
      
      // Browse through the services looking for the desired one  
      for (let i = 0; i < services.length; i++) {
        let service = services[i]

        if (service.uuid.toUpperCase() == serviceUUID) {
          maxApi.post('Acceleremoter service found.');

          // Look up the desired characteristic for the desired service
          service.discoverCharacteristics([], function (error, characteristics) {
            for (let j = 0; j < characteristics.length; j++) {
              let ch = characteristics[j];

              if (ch.uuid.toUpperCase() === characteristicUUID) {
                ch.subscribe(function (error) {
                  maxApi.post('Subscribed to acc. characteristic. Waiting for data each 10ms');
                });

                ch.on('data', function (data, isNotification) {
                  // let x = data.readInt16LE(0) * 4.0 / 32768.0;
                  // let y = data.readInt16LE(2) * 4.0 / 32768.0;
                  // let z = data.readInt16LE(4) * 4.0 / 32768.0;

                  // let x = data.readInt16LE(0) * 0.061 * 8 / 1000;
                  // let y = data.readInt16LE(2) * 0.061 * 8 / 1000;
                  // let z = data.readInt16LE(4) * 0.061 * 8 / 1000;
                  
                  
                  // let xNorm = (x+1)/2;
                  // let yNorm = (y+1)/2;
                  // let zNorm = (z+1)/2;
                  
                  // Read raw data
                  let x = data.readInt16LE(0);
                  let y = data.readInt16LE(2);                  
                  let z = data.readInt16LE(4);
                  
                  const vals = [x, y, z];

                  // Send data to the console
                  maxApi.post(vals);

                  //Send data to MAX
                  maxApi.outlet("xVal", x);
                  maxApi.outlet("yVal", y);
                  maxApi.outlet("zVal", z);
                });
                break;
              }
            }
          })
          break
        }
      }
    })
  })
}