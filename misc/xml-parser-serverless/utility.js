const fs = require('fs')
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const { request } = require('graphql-request');
const graphQlUrl = {
  'stage': 'https://stage.economist.com/graphql',
  'prod': 'https://www.economist.com/graphql'
}
const cheerio = require("cheerio"), tinreq = require("tinyreq");


class utility {
  constructor() {
  }

  getDataFromXml(size) {
    let returnData = { item: [] }

    return fetch('https://acast.azure-api.net/rssEconomist/theeconomisttastingmenu?subscription-key=d67d08ad7d2f4843835cf50c3f280890')
      .then(res => res.text())
      .then(body => {
        console.log(body)
        let parser = new xml2js.Parser();
        parser.parseString(body, function (err, result) {
          result.rss.channel[0].item.map((item, index) => {
            if (index < size) {
              console.log(JSON.stringify(item.description))
              console.log(index + "--" + size)
              returnData.item.push({ id: index, title: item.title[0], enclosure: item.enclosure[0].$.url, desc: item.description[0].replace(/<p>|<\/p>/g, '') })
            }
          })
        });
        return returnData;
      })
  }
  getDataByTopics(size, topic) {
    let returnData = {
      item: []
    }
    return this.getDataFromGraphQLEconomist(size, topic).then(res => {
      if (res) {
        //console.log("RES-----" + res + "-----" + topic + "-----" + "------" + size)
        console.log("RES-----" + res.status + "----");
        if (res.response) {
          res.response.data.canonical.hasPart.parts.map((item, index) => {
            if (item.audio.main != null) {
              returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main.url.canonical, title: item.title })
            } else {
              returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main, title: item.title })
            }

          })
        } else {
          res.canonical.hasPart.parts.map((item, index) => {
            if (item.audio.main != null) {
              returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main.url.canonical, title: item.title })
            } else {
              returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main, title: item.title })
            }
          })
        }

      }
      return returnData;
    })
  }

  getDataFromGraphQLEconomist(size, topic) {
    const query = `{
      canonical(ref: "/xref/www.economist.com/sections/${topic}") {
        hasPart (size:${size}){
      parts {
        tegID
        audio {
          main {
            id
            url {
              canonical
            }
          }
        }
        title: headline
        published: datePublished
        lastModified: dateModified
        print {
          section {
            id
            tegID
            sectionName: headline
          }
        }
      }
    }
      }
    }`;

    var dataWithPromise = request(graphQlUrl.prod, query).then(response => {
      console.log("--------graphQlUrlgraphQlUrlgraphQlUrl----", JSON.stringify(response), "--query--", query);
      return response;
    }).catch(error => {
      console.log("--------errorerrorerrorerrorerrorerrorerror----", error.response, "--query--", query);
      return error;
    });
    return dataWithPromise
  }

  getDataFromUrl(url, callback) {
    return this.scrapeData("https://www.economist.com/", {
      title: ".sections-card__list"
    }, (err, data) => {
      callback(this.getlinkHref(data))
      
    })
  }
  scrapeData(url, data, cb) {
    tinreq(url, (err, body) => {
      if (err) { return cb(err); }
      let $ = cheerio.load(body), pageData = {};
      Object.keys(data).forEach(k => {
        pageData[k] = $(data[k]).html();
      });
      cb(null, pageData);
    });
  }

  getlinkHref(data) {
    let returndata = [];
    if (data) {
      data.title.split("</li>").map((item, index) => {
        if (item.match(/href="([^"]*")/)) {
          let href = item.match(/href="([^"]*")/)[1].replace('/sections', '').replace('/', '');
          let topicName = item.match(/\>(.*?)\</g)[1].replace('>', '').replace('<', '');
          returndata.push({ key: topicName, value: href })
        }
      })
    }
    return returndata;
  }

}
module.exports = utility;