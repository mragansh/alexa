const fs = require('fs')
const xml2js = require('xml2js');
const util = require('./utility');
let returnData = {
  item: []
}

exports.handler = (event, context, callback) => {
  let _util = new util;
  switch (event.field) {
    case "getAllDataFromXMLRSS":
      _util.getDataFromXml(event.arguments.size).then(data => {
        console.log('=> Promise data: ', JSON.stringify(data));
        callback(null, data.item);
      }).catch(error => {
        console.log('=> Error in Promise :', error);
      })

    case "getDataByTopics":
      _util.getDataByTopics(event.arguments.size, event.arguments.topic).then(data => {
        console.log('=> Promise data: ', JSON.stringify(data));
        callback(null, data.item);
      }).catch(error => {
        console.log('=> Error in Promise :', error);
      })

    case "getMainTopic":
      _util.getDataFromUrl(event.arguments.url, function (data) {
        callback(null, data);
      });
  }
};

