var logger = require('.././helpers/logger.js'),
pcloudyConnector = require('./services.js'),
readline = require('readline'),
token = '',
configs = {};

var webdriverio = require('webdriverio');

module.exports = function appiumEngine(configs) {
    pcloudyConnectorServices = new pcloudyConnector(configs.host);
    return {
        appiumCore: function(token, platform, app) {
            var pointer = this;
            var promise = new Promise(function(resolve, reject) {
                pcloudyConnectorServices.GetDevices(token, 10, platform, "true").then(function(devices) {
                    //logger.log(JSON.stringify(devices));
                    var devDetails = JSON.parse(devices);
                    //logger.log(JSON.stringify(devDetails));
                    var allDevsavilable = devDetails.result.models,
                    availabledevs = [],
                    sessionname = '';
                    if (allDevsavilable.length) {
                        logger.info(" == Avialable devices == ");

                        allDevsavilable.forEach(function(entry) {
                            logger.info("=========================================================================================");
                            logger.info(" Full Name : " + entry.full_name);
                            logger.info(" Device_ID  : " + entry.id);
                            /*logger.log(" model : "+entry.model);
                            logger.log(" display name : "+entry.display_name);
                            logger.log(" version : "+entry.version);
                            logger.log(" manufacturer : "+entry.manufacturer);
                            logger.log(" platform : "+entry.platform);
                            logger.log(" availability : "+entry.available);*/
                        });
                    } else {
                        logger.warn(" == There no devices available at this time try to book after some time == ");
                        process.exit(0);
                    }
                    try {
                        var chosenDevs = [];
                        var readdev = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });
                        logger.info('================================================================ \n');
                        readdev.question('\n Enter did value as shown above to select devices (use comma for multiple devices) \n ', (answer) => {
                            logger.info('================================================================ \n');

                            logger.info(`You have chosen devices : ${answer}`);
                            answer = answer.split(',');
                            chosenDevs = answer;
                            logger.info(' chosen Devices are ');
                            readdev.close();
                            var bookedDevsInfo = {};
                            Object.keys(allDevsavilable).forEach(function(key) {
                                //console.log(allDevsavilable[key].id);
                                var did = allDevsavilable[key].id;
                                if (chosenDevs.indexOf(did.toString()) >= 0) {
                                    bookedDevsInfo[did] = allDevsavilable[key];
                                }
                            });

                            Object.keys(bookedDevsInfo).forEach(function(key) {
                                logger.info(' device id ==> ' + bookedDevsInfo[key].id + ', Device name ==> ' + bookedDevsInfo[key].full_name);
                            })
                            pcloudyConnectorServices.BookDevicesForAppium(devDetails.result.token, 5, chosenDevs, platform, 'pcloudytest-' + platform, "true").then(function(bookDevstatus) {
                                logger.log('bookDev '+JSON.stringify(bookDevstatus));
                                try {
                                    var bookedDevDetails = JSON.parse(bookDevstatus);

                                    var bookedDevices = bookedDevDetails.result.device_ids,
                                    rid = bookedDevices[0].rid;

                                    //logger.info("booked devices "+JSON.stringify(bookedDevices));

                                    logger.info('app passed ' + app);
                                    pcloudyConnectorServices.initAppiumHubForApp(bookedDevDetails.result.token, app).then(function(initAppiumHubForAppStat) {
                                        var initHubresp = JSON.parse(initAppiumHubForAppStat);

                                        pcloudyConnectorServices.getAppiumEndPoint(initHubresp.result.token).then(function(getAppiumEndPointstat) {

                                            var endPoint = JSON.parse(getAppiumEndPointstat);
                                            endPoint.rid = rid;
                                            logger.info(JSON.stringify(endPoint));
                                            logger.info(" ===================== Started Appium and Received Endpoint ================== \n ");
                                            logger.info(" endpoint  ==> " + endPoint.result.endpoint);
                                            var options = {};

                                            var totalBokkedDevs = bookedDevices.length;
                                            try {
                                                bookedDevices.forEach(function(i, index, bookedDevices) {

                                                    options.desiredCapabilities = {};
                                                    options.desiredCapabilities.launchTimeout = configs.desiredCapabilities.host;
                                                    options.desiredCapabilities.CommandTimeout = configs.desiredCapabilities.CommandTimeout;
                                                    options.desiredCapabilities.deviceName = i.capabilities.deviceName;
                                                    options.desiredCapabilities.browserName = i.capabilities.browserName;
                                                    options.desiredCapabilities.platformName = i.capabilities.platformName;
                                                    options.desiredCapabilities.appPackage = configs.desiredCapabilities.appPackage;
                                                    options.desiredCapabilities.appActivity = configs.desiredCapabilities.appActivity;
                                                    options.desiredCapabilities.rotatable = configs.desiredCapabilities.rotatable;
                                                    options.logLevel = configs.loglevel;
                                                    options.logOutput = configs.logOutput;
                                                    options.protocol = configs.protocol;
                                                    options.host = configs.host;
                                                    options.port = configs.port;
                                                    options.coloredLogs = configs.coloredLogs;
                                                    options.bail = configs.bail;
                                                    options.screenshotPath = configs.screenshotPath;
                                                    options.screenshotOnReject = configs.screenshotOnReject;

                                                    var hubUrl = endPoint.result.endpoint + '/wd/hub';
                                                    var p = options.protocol + "://" + options.host;
                                                    options.path = hubUrl.split(p)[1];
                                                    var unixTime = Math.round(+new Date() / 1000);
                                                    pointer.timeConverter(unixTime).then(function(readableTime) {
                                                        unixTime = readableTime;
                                                    })

                                                    var client = webdriverio.remote(options)
                                                    .init().saveScreenshot(configs.screenshotPath + '/pcloudy-' + i.manufacturer + '-' + i.model + '-' + i.version + '-' + i.capabilities.deviceName + '-' + unixTime + '.png')

                                                    /*################################################### Add your code for testing #####################################*/


                                                    /*################################################## Add your code ################################################*/
                                                    .end();
                                                    //logger.debug('devicename passed in desired capabilities '+i.capabilities.deviceName);
                                                    //logger.info("options passed to webdriver "+JSON.stringify(options));
                                                    logger.debug("Webdriver Init : " + i.model);
                                                    logger.debug("Next: " + ((bookedDevices.length - 1 === index) ? resolve(endPoint) : bookedDevices[index + 1]));
                                                })
                                            } catch (exp) {
                                                logger.info('Booked devices each ' + exp);
                                            }

                                            /*###################========= Api to releaseAppiumsession / release all booked devices  After finishing your all test cases call this to release ####################################=====*/
                                            /*pcloudyConnectorServices.releaseAppiumsession(token,rid).then(function(releaseInstanceAccess){
                                            logger.log('installAndLaunchApp '+JSON.stringify(releaseInstanceAccess));
                                        },function(releaseInstanceAccessErr){
                                        logger.log('installAndLaunchAppErr '+JSON.stringify(releaseInstanceAccessErr));
                                    })*/


                                }, function(getAppiumEndPointErr) {
                                    loggerr.debug(JSON.stringify(getAppiumEndPointErr));
                                    reject(getAppiumEndPointErr);
                                })

                            }, function(initAppiumHubForAppErr) {
                                logger.debug('initAppiumHubForAppErr ' + JSON.stringify(initAppiumHubForAppErr));
                                reject(initAppiumHubForAppErr);
                            })
                        }catch(excp){
                            logger.debug("BookDevicesForAppium Err : "+excp);
                        }
                    }, function(bookdevErr) {
                        logger.debug('bookdevErr ' + JSON.stringify(bookdevErr));
                        reject(bookdevErr);
                    })
                }); //rl
            } catch (exp) {
                console.info("err " + exp);
            }
        }, function(getDevErr) {
            logger.debug('getDevErr : ' + JSON.stringify(getDevErr));
            reject(getDevErr);
        })
    })
    return promise;
},
timeConverter: function(UNIX_timestamp) {
    var promise = new Promise(function(resolve, reject) {
        var a = new Date(UNIX_timestamp * 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + '__' + month + '__' + year + '__' + hour + ':' + min + ':' + sec;
        resolve(time);
    })
    return promise;
}
}
}
