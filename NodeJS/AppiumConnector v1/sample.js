var logger = require('./helpers/logger.js'),
    pcloudyConnector = require('./api/services.js');
    appiumcore = require('./api/core.js');
var utils = require('./helpers/utils.js'),
    utilServices = new utils(),
    readline = require('readline'),
    configPath = './configs/config-android.json',
    token = '';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var webdriverio = require('webdriverio');

utilServices.fileRead(configPath).then(function(configs) {

    try {
        configs = JSON.parse(configs.data);
        var cloudName = configs.host,
            email = configs.username,
            apiKey = configs.password,
            app = configs.appname;
        pcloudyConnectorServices = new pcloudyConnector(cloudName);
        coreInstance = new appiumcore(configs);
    } catch (e) {
        logger.error(" error initializing configs " + e);
    }
    pcloudyConnectorServices.AuthenticateUser(email, apiKey).then(function(resp) {
        //logger.log(JSON.stringify(resp));

        var response = JSON.parse(resp);
        if(response.result.hasOwnProperty('error')){
            logger.error("Error in Authenticating : "+response.result.error);
        }else{
            logger.info(' token  ====== > ' + response.result.token);
            token = response.result.token; //saved in global variable
            rl.question('====================== choose any one platform  ========================= \n 1 : Android \n  ========= Enter 1 to choose ============= \n', (platform) => {
                //logger.info(`You have chosen platform : ${platform}`);
                var platformName = platform,
                    devicePlatform = '-NOT-SELECTED-';

                switch (platformName) {
                    case '1':
                        devicePlatform = 'Android';
                        break;
                }
                logger.info('Chosen platform ' + devicePlatform);
                rl.close();

                var present = false;
                pcloudyConnectorServices.GetAvailableApps(token, 0, 'all').then(function(filesinDrive) {
                    var alreadyPresentfiles = JSON.parse(filesinDrive);
                    //logger.info('op '+JSON.stringify(alreadyPresentfiles));
                    alreadyPresentfiles = alreadyPresentfiles.result.files;
                    //alreadyPresentfiles.forEach(function(k)
                    for (var k = 0, len = alreadyPresentfiles.length; k < len; k++) {
                        var cloudfile = alreadyPresentfiles[k]['file'];
                        if (cloudfile == app) {
                            present = true;
                            logger.info("App with Same name " + cloudfile + " present in pCloudy cloud drive ");
                            break;
                        }
                    }
                    if(!present){
                        //if app is not present in pcloudy cloud drive
                        var apppath = __dirname+'/'+app;//current directory
                        logger.info('=============Uploading file ============== '+apppath);
                        pcloudyConnectorServices.UploadApp(token, app, 'raw', 'all').then(function(uploadStatus) {
                            var status = JSON.parse(uploadStatus),uploadedFile = status.result.file;
                            //logger.info('upload status : ' + JSON.stringify(status));
                            if (status.result.code == 200) {
                                logger.info('upload Success for file : ' + status.result.file);

                            //core
                            coreInstance.appiumCore(token,devicePlatform,uploadedFile).then(function(appiumLaunchStatus){
                                logger.info("Status of pcloudy Appium Service Launch == > "+JSON.stringify(appiumLaunchStatus));
                                pcloudyConnectorServices.releaseAppiumsession(token,appiumLaunchStatus.rid,0).then(function(releaseInstanceAccess){
                                    var releaseStat = JSON.parse(releaseInstanceAccess);
                                    logger.info('Status of Appium session release : '+releaseStat.result.msg);
                                    },function(releaseInstanceAccessErr){
                                    logger.log('releaseAppiumsession '+JSON.stringify(releaseInstanceAccessErr));
                                })
                            },function(appiumLaunchErr){
                                //logger.error("Service Launch error : "+JSON.stringify(appiumLaunchErr));
                                var releaseStat = JSON.parse(appiumLaunchErr);
                                logger.info('Error Status of Appium session release : '+releaseStat.result.msg);
                            })
                            //core
                        }else{
                            logger.info('could not upload  file : ' + status.result.file + " error : "+status.result.error);
                            process.exit(0);
                        }
                        }, function(uploadErr) {
                            logger.info(' uploadErr Error ' + JSON.stringify(uploadErr));
                        })
                    } else {
                        //without upload when app is already present in pcloudy cloud drive
                        //core
                        coreInstance.appiumCore(token,devicePlatform,app).then(function(appiumLaunchStatus){
                            logger.info("Status of pcloudy Appium Service Launch == > "+JSON.stringify(appiumLaunchStatus));

                            pcloudyConnectorServices.releaseAppiumsession(token,appiumLaunchStatus.rid,0).then(function(releaseInstanceAccess){
                                //logger.log('releaseAppiumsession '+JSON.stringify(releaseInstanceAccess));
                                var releaseStat = JSON.parse(releaseInstanceAccess);
                                logger.info('Status of Appium session release : '+releaseStat.result.msg);
                                },function(releaseInstanceAccessErr){
                                //logger.log('releaseAppiumsession '+JSON.stringify(releaseInstanceAccessErr));
                                var releaseStat = JSON.parse(releaseInstanceAccessErr);
                                logger.info('Error Status of Appium session release : '+releaseStat.result.msg);
                            })
                        },function(appiumLaunchErr){
                            logger.error("Service Launch error : "+JSON.stringify(appiumLaunchErr));
                        })
                        //core
                    }
                }, function(getAppsErr) {
                    logger.debug("getAvailable apps Error : " + JSON.stringify(getAppsErr));
                })
            }) //read line
        }

    }, function(err) {
        logger.debug("Error in Authenticating "+JSON.stringify(err));
    })

}, function(errRead) {
    logger.warn('error reading config ' + errRead);
})

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    process.exit(0);
});
