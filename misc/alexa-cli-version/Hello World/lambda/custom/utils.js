const moment = require('moment-timezone');
const https = require('https');
let responseString = '';

class utility {
  constructor() { }
  isBST(date) {
    let d = new Date(date) || new Date();
    let starts = this.lastSunday(2, d.getFullYear());
    starts.setHours(1);
    let ends = this.lastSunday(9, d.getFullYear());
    starts.setHours(1);
    return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
  }

  lastSunday(month, year) {
    let d = new Date();
    let lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
    let day = lastDayOfMonth.getDay();
    return new Date(Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day));
  }

  getLaunchSpeechText() {
    let speechText = '';
    try {
      let timeZone = moment().format('YYYY-MM-DD HH:mm');
      timeZone = moment.tz(timeZone, "Europe/London");

      let year = timeZone.format('YYYY')
      let dayToSpeak = timeZone.format('Do')
      let monthToSpeak = timeZone.format('MMMM');
      let timeToSpeak = ''
      let isBst = this.isBST(timeZone);
      if (isBst) {
        timeToSpeak = timeZone.add(1, 'hours').format('LT')
      } else {
        timeToSpeak = timeZone.format('LT')
      }
      // Friday, May 11, 2018 12:55 PM
      speechText = `It's <say-as interpret-as="cardinal"> ` + timeToSpeak + ` here in London on ` + monthToSpeak + ` the ` + dayToSpeak + ' ' + year + `  </say-as> and this is The Economist.`
    }
    catch (e) {
      return e;
    }
    return speechText;
  }

  getDataFromApi(acessToken, deviceID) {
    let returnData;
    var options = {
      host: 'api.amazonalexa.com',
      path: `/v1/devices/${deviceID}/settings/address/countryAndPostalCode`,
      headers: {
        // "User-Agent": "Request-Promise",
        "Authorization": acessToken,
        "Content-Type": "application/json"
      },
    };
    console.log(JSON.stringify(options) + "----path")
    var req = https.request(options, res => {
      console.log((res))
      //res.setEncoding('utf8');
      responseString = "Error not available";

      //accept incoming data asynchronously
      res.on('data', chunk => {
        console.log(JSON.stringify(chunk) + "---chunk")
        responseString = responseString + "---!!---" + chunk;
      });

      //return the data when streaming is complete
      res.on('end', () => {
        console.log(responseString + "-----responseString");
        returnData = responseString
      });

    });
    req.end();
    return responseString;
  }

}

module.exports = utility;
