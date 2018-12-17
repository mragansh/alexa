const fs = require('fs')
const util = require('./utility');
let returnData = {
  item: []
}

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

exports.handler = (event, context, callback) => {
  let _util = new util;
  _util.getDataFromUrl("event.arguments.url", function (data) {
    callback(null, responses.success(data))
  });
};