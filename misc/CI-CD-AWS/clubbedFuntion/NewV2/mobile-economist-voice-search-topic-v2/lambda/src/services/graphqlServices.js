const {
    GraphQLClient
} = require('graphql-request');
const constants = require('../constants/constants');

const graphQlUrl = {
    'stage': 'https://stage.economist.com/graphql',
    'prod': 'https://www.economist.com/graphql',
    'rss': 'https://ktgzq5kfdvatdhht4wbx6u2fta.appsync-api.us-east-1.amazonaws.com/graphql'
}

class GraphQLService {
    constructor(graphqlEndpointUrl) {
        this.graphQLClient = new GraphQLClient(graphqlEndpointUrl, {
            "headers": {
                'Content-Type': 'application/json',
                'x-api-key': 'da2-cachxmketnf7rfsa4ntmzm5hh4',
            },
        })
    };
    async getSearchByTopics(topic) {
        if (topic) {
            const query = `{ getDataByTopics(size:${constants.serviceConfig.desiredTopicSize}, topic:"${topic.toLowerCase()}"){ id title audio } }`;
            console.log('=> query: ', query);
            const response = await this.graphQLClient.request(query);
            console.log('=> Search topic data: ', JSON.stringify(response));
            return response;
        } else {
            throw new Error('Topic to be searched is unavilable');
        }
    };
    async getHighlights() {
        const query = `{ getAllDataFromXMLRSS(size:${constants.serviceConfig.desiredHighlightSize}){ desc title id enclosure } }`;
        const response = await this.graphQLClient.request(query);
        console.log('=> Highlights data: ', JSON.stringify(response));
        return response;
    }
}

module.exports = new GraphQLService(graphQlUrl.rss);

var service = new GraphQLService(graphQlUrl.rss);
// console.log(service.getSearchByTopics('european union'));
// console.log(service.getSearchByTopics('business enterprise'));
// console.log(service.getSearchByTopics('Europe'));
// console.log(service.getSearchByTopics('london'));
// console.log(service.getSearchByTopics('donald trump'));
// console.log(service.getSearchByTopics('china'));
// console.log(service.getSearchByTopics('americas'));
// console.log(service.getSearchByTopics('united kingdom'));
// console.log(service.getSearchByTopics('germany'));
// console.log(service.getHighlights());