const fs = require('fs')
const cheerio = require("cheerio"), tinreq = require("tinyreq");


class utility {
    constructor() {
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