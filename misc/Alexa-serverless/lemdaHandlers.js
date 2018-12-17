// API's : 
// endpoints:
//   GET - https://j7pfgvt0a5.execute-api.us-east-1.amazonaws.com/dev/getDataByDate/{date}
//   GET - https://j7pfgvt0a5.execute-api.us-east-1.amazonaws.com/dev/getDataByDateAndText/2018-04-21Text=Sorrell
//   GET - https://j7pfgvt0a5.execute-api.us-east-1.amazonaws.com/dev/getDataByTopic/5Topic=americas
'use strict'
const services = require('./services');

const responses = {
  success: (data = {}, code = 200) => {
    return {
      'statusCode': code,
      'body': JSON.stringify(data)
    }
  },
  error: (error) => {
    return {
      'statusCode': error.code || 500,
      'body': JSON.stringify(error)
    }
  }
}

module.exports = {
  getDataByDate: (event, context, callback) => {
    //dummy date = 2018-05-05
    const date = event.pathParameters.date;
    if (date) {
      const service = createServiceInstance(date)
      service.getDataByDate().then(data => {
        callback(null, responses.success(data))
      }).catch(error => {
        callback(null, responses.error(error))
      })
    }
  },
  getDataByDateAndText: (event, context, callback) => {
    //const objectParam2 = objectParam = {date:'2018-05-05',text:'infrastructure'}
    const objectParam = event.pathParameters.query;
    if (objectParam) {
      //console.log(JSON.stringify(objectParam) + "--OBJECT PARAM")
      const date = objectParam.split('Text=')[0];
      const text = objectParam.split('Text=')[1];
      const service = createServiceInstance(date)
      service.getDataByDateAndText(text).then(data => {
        callback(null, responses.success(data))
      }).catch(error => {
        callback(null, responses.error(error))
      })
    }
  },
  getDataByTopic: (event, context, callback) => {
    const objectParam = event.pathParameters.query;
    const size = objectParam.split('Topic=')[0];
    const topic = objectParam.split('Topic=')[1];
    const service = createServiceInstance()
    service.getDataByTopic(size,topic).then(data => {
      callback(null, responses.success(data))
    }).catch(error => {
      callback(null, responses.error(error))
    })
  }
}

function createServiceInstance(date) {
  const graphServices = new services(date)
  return graphServices;
}