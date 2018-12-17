const fs = require('fs')

const xml2js = require('xml2js');
const fetch = require('node-fetch');
const { request } = require('graphql-request');

const constObject = require('./const');

class utility {

    constructor() {}

    getDataFromXml(size) {       
        let returnData = { item: [] }
        return fetch(constObject.xmlFromUrl)
            .then(res => res.text())
            .then(body => {                
                let parser = new xml2js.Parser();
                parser.parseString(body, function (err, result) {
                    result.rss.channel[0].item.map((item, index) => {
                        if (index < size) {
                            console.log(JSON.stringify(item))                          
                            returnData.item.push({ "id": index, "title": item.title[0], "audio": item.enclosure[0].$.url, "desc": item.description[0].replace(/<p>|<\/p>/g, '') })
                        }
                    })
                });               
                return returnData;
            })
    }

    getDataByTopics(size, topic) {
        return this.getTopicQuery().then(topicObject => {
            let tegID = this.getTegID(size, topicObject, topic);            
            return tegID;
        }).then(tegID => {
            let dataObj = this.getDataByTegID(size, tegID).then(res => {
                return res
            })
            return dataObj;
        })
    }

    getTegID(size, topicObject, topic) {
        let returnTegID
        if (topicObject && topic) {            
            topicObject.canonical.hasPart.parts.map((item, index) => {               
                if (item.headline == topic) {                    
                    returnTegID = item.tegID
                }
            })
            console.log("Data Return TegId=>", returnTegID)
        }
        return returnTegID
    }

    getDataByTegID(size, tegID) {
        let returnData = {
            item: []
        }
        if (tegID) {
            let dataFromGraph = this.getDataFromGraphQLEconomist(tegID).then(res => {
                if (res) {
                    if (res.response) {
                        let count = 0;
                        res.response.data.canonical.hasPart.parts.map((item, index) => {
                            if (item.audio) {
                                if (item.audio.main) {
                                    if (item.audio.main.url.canonical) {
                                        if (count < size) {
                                            count++;
                                            returnData.item.push({ "id": count, "tegID": item.tegID, "title": item.title, "audio": item.audio.main.url.canonical })
                                            console.log(JSON.stringify(returnData))

                                        }

                                    }
                                }
                            }

                        })
                    } else {
                        let count2 = 0;
                        res.canonical.hasPart.parts.map((item, index) => {
                            if (item.audio) {
                                if (item.audio.main) {
                                    if (count2 < size) {
                                        count2++;
                                        returnData.item.push({ "id": index, "tegID": item.tegID, "title": item.title, "audio": item.audio.main.url.canonical })
                                    }
                                }
                            }
                        })
                    }

                }
                return returnData;
            })
            return dataFromGraph;
        }

    }


    getTopicQuery() {
        let url = constObject.graphQlUrl.stage;
        let size = 50;
        const query = constObject.getTopicGraphQuery;

        var dataWithPromise = request(url, query).then(response => {
            console.log("=>Graph Data Sucess==>", JSON.stringify(response), "--query--", query);
            return response;
        }).catch(error => {
            console.log("=>Graph Data Error==>", JSON.stringify(error.response), "--query--", query);
            return error;
        });
        return dataWithPromise

    }

    getDataFromGraphQLEconomist(tegID) {
        // TODO: Change URL per enviorment and size too.
        let url = constObject.graphQlUrl.stage;
        let size = 50;
        const query = constObject.getTopicDetailGraphQuery(tegID);

        var dataWithPromise = request(url, query).then(response => {
            console.log("=>Graph Data Sucess=>", JSON.stringify(response), "--query--", query);
            return response;
        }).catch(error => {
            console.log("=>Graph Data Error==>", JSON.stringify(error.response), "--query--", query);
            return error;
        });
        return dataWithPromise
    }

}
module.exports = utility;