const fs = require('fs')

const xml2js = require('xml2js');
const fetch = require('node-fetch');

const constObject = require('./const');
const cloudWatchLogger = require('./cloudwatchLogger')

class utility {

    constructor() { }

    /*@ Function => which retrive from RSS data and convert into JSON format.
    @ Data Will requested per size from frontend. 
    @ Param => size: number */

    getDataFromXml(size) {
        let returnData = { item: [] }
        return fetch(constObject.xmlFromUrl)
            .then(res => res.text())
            .then(body => {
                let parser = new xml2js.Parser();
                parser.parseString(body, function (err, result) {
                    for (let i = 0; i < size; i++) {
                        returnData.item.push({
                            "id": i + 1,
                            "title": result.rss.channel[0].item[i].title[0],
                            "audio": result.rss.channel[0].item[i].enclosure[0].$.url,
                            "imageUrl": result.rss.channel[0].item[i]['itunes:image'][0].$.href,
                            "description": result.rss.channel[0].item[i].description[0].replace(/<p>|<\/p>/g, ''),
                            "published": result.rss.channel[0].item[i].pubDate[0]
                        })
                    }

                });
                this.cloudWatchLogLocale('LOG', 'getDataFromXml', returnData)
                return returnData;

            }).catch(error =>
                this.cloudWatchLogLocale('ERROR', 'getDataFromXml', error)
            );
    }

    //@ Function get data from graphQL endpoint per topic e.g: China.
    //@ Param => size:number & topic:string

    getDataByTopics(size, topic) {
        return this.getTopicQuery().then(topicObject => {
            topicObject = JSON.parse(topicObject)
            return this.getTegID(size, topicObject, topic);
        }).then(tegID => {
            return this.getDataByTegID(size, tegID).then(res => {
                return res
            })
        }).catch(error => {
            this.cloudWatchLogLocale('ERROR', 'getDataByTopics', error)
            console.log(error)
            return constObject.errroLog.notFound;
        });
    }

    //@Function() => Map tegID from topicObject per topic.
    //@Param => size:number, topicObject:Object, topic:string

    getTegID(size, topicObject, topic) {
        let returnTegID = null;
        if (topicObject && topic) {
            topicObject.data.canonical.hasPart.parts.map((item, index) => {
                if (item.headline == topic) {
                    returnTegID = item.tegID;
                }
            })
        }
        return returnTegID
    }

    //@Function => Get Data GraphQL Enpoint per TegID from '/contents/{tegID}'
    //@Param => size:number, tegID:string

    getDataByTegID(size, tegID) {
        let returnData = {
            item: []
        }
        if (tegID) {
            let dataFromGraph = this.getDataFromGraphQLEconomist(tegID).then(res => {
                this.cloudWatchLogLocale('LOG', 'getDataByTegID', res)
                res = JSON.parse(res)
                if (res) {
                    if (res.response) {
                        let count = 0;
                        res.response.data.canonical.hasPart.parts.map((item, index) => {
                            if (item.audio) {
                                if (item.audio.main) {
                                    if (item.audio.main.url.canonical) {
                                        if (count < size) {
                                            count++;
                                            returnData.item.push({
                                                "id": count,
                                                "tegID": item.tegID,
                                                "title": item.title,
                                                "flyTitle": item.flyTitle,
                                                "audio": item.audio.main.url.canonical,
                                                "published": item.published,
                                                "description": item.description
                                            })
                                        }

                                    }
                                }
                            }

                        })
                    } else {
                        let count2 = 0;
                        res.data.canonical.hasPart.parts.map((item, index) => {
                            if (item.audio) {
                                if (item.audio.main) {
                                    if (count2 < size) {
                                        count2++;
                                        returnData.item.push({
                                            "id": count2,
                                            "tegID": item.tegID,
                                            "title": item.title,
                                            "flyTitle": item.flyTitle,
                                            "audio": item.audio.main.url.canonical,
                                            "published": item.published,
                                            "description": item.description
                                        })
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

    //@Function => Get all topic from GraphQL Endpoint

    getTopicQuery() {
        let url = constObject.graphQlUrl.stage;
        const query = constObject.getTopicGraphQuery;

        let dataWithPromise = this.getDataNative(url, query)
            .then(res => {
                this.cloudWatchLogLocale('LOG', 'getTopicQuery', res)
                return res
            }).catch(error => {
                this.cloudWatchLogLocale('ERROR', 'getTopicQuery', error)
                return null;
            });

        return dataWithPromise;
    }

    //@Function => Get Data From GraphQL Endpoiint for Topic In detail, by TegID
    //@Para => tegID:string

    getDataFromGraphQLEconomist(tegID) {
        let url = constObject.graphQlUrl.stage;
        const query = constObject.getTopicDetailGraphQuery(tegID);

        let dataWithPromise = this.getDataNative(url, query)
            .then(res => {
                this.cloudWatchLogLocale('LOG', 'getDataFromGraphQLEconomist', res)
                return res;
            }).catch(error =>
                this.cloudWatchLogLocale('ERROR', 'getDataFromGraphQLEconomist', error)
            );

        return dataWithPromise;
    }

    getDataNative(url, query) {
        let fetchUrl = url + query;

        let returnData = fetch(fetchUrl, {
            method: 'GET',
            body: null
        }).then(res => res.text())
            .then(body => {
                this.cloudWatchLogLocale('LOG', 'getDataNative', body)
                return body
            }).catch(error => {
                this.cloudWatchLogLocale('ERROR', 'getDataNative', error)
                // return error;
            });

        return returnData;
    }

    cloudWatchLogLocale(logType, event, data) {
        if (constObject.cloudwatchLogger.isEnabled) {
            cloudWatchLogger.log(logType, {
                'event': event,
                'info': data
            });
        }

    }

}
module.exports = utility;