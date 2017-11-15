# pCloudy-node-connector-test
- Run Appium Automation over multiple devices of pCloudy.
- Launches App and takes screenshot.
- Saves screenshot of App launch inside screenshot folder.
- Know more about pCloudy www.pcloudy.com.

## Install

```shell
npm init

npm install appium-pcloudy --save

```


## Writing a script
```javascript

//1: Create screenshot named folder.
//2: Create log named folder.
//3: config.json which has following fields.
//4: app file
{
  "desiredCapabilities": {
    "launchTimeout" : 90000,
    "CommandTimeout" : 600,
    "appPackage" : "YOUR_APP_PACKAGE_NAME",
    "appActivity" : "YOUR_APP_LAUNCH_ACTIVITY_NAME",
    "rotatable" : true
  },
  "logLevel" : "verbose",
  "logOutput" : "./log/",
  "protocol" : "https",
  "host" : "device.pcloudy.com",
  "port" : 443,
  "coloredLogs" : true,
  "bail" : 0,
  "screenshotPath" : "./screenshot/",
  "screenshotOnReject" : false,
  "username" : "YOUR_PCLOUDY_USERNAME",
  "password" : "YOUR_PCLOUDY_ACCESS_KEY",
  "appname" : "YOUR_APP_NAME"
}


var appiumpCloudy = require('pcloudy-appium');

instance = new appiumpCloudy();

instance.appiumInterface('config.json');


```

## Known issues / limitations
- more test scripts has to be written.


## Contact us
- muthuraj.bharathi@sstsinc.com

## Authors
- Muthu raj bharathi ([muthurajbharathi](https://github.com/pankyopkey/pCloudy-sample-projects/tree/master/NodeJS/AppiumConnector_v1))

## License

The MIT License (MIT)

Copyright (c) 2017 pCloudy
