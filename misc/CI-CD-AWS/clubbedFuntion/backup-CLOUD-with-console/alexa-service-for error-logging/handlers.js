const fs = require('fs')
const util = require('./utility');
const constObject = require('./const');
const cloudwatchLogger = require('./cloudwatchLogger')

let returnData = {
    item: []
}

/*@Handler: Entry Point for lambda and excute with event content and callback
@events = >
          @getAllDataFromXMLRSS
          @getDataByTopics  */

exports.handler = (event, context, callback) => {
    let _utils_ = new util;
    if (event.field) {
        if (event.field == "getAllDataFromXMLRSS") {
            _utils_.getDataFromXml(event.arguments.size).then(data => { 
                _utils_.cloudWatchLogLocale('LOG', 'getAllDataFromXMLRSS', data)        
                _utils_.cloudWatchLogLocale('ServiceTimeLogLambdaExecution', 'getAllDataFromXMLRSS', 10000 - context.getRemainingTimeInMillis())               
                callback(null, data.item);
            }).catch(error => {
                _utils_.cloudWatchLogLocale('ERROR', 'getAllDataFromXMLRSS', error)                              
                callback(error);
            })
        }

        if (event.field == "getDataByTopics") {
            _utils_.getDataByTopics(event.arguments.size, event.arguments.topic).then(data => {
                _utils_.cloudWatchLogLocale('LOG', 'getDataByTopics', data)  
                _utils_.cloudWatchLogLocale('ServiceTimeLogLambdaExecution', 'getDataByTopics', 10000 - context.getRemainingTimeInMillis())
                callback(null, data.item);                
            }).catch(error => {
                _utils_.cloudWatchLogLocale('ERROR', 'getDataByTopics', error)
               callback(null, null);
            })
        }
    }
};