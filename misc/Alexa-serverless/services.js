'use strict';
const { request } = require('graphql-request');
const graphQlUrl = {
  'stage': 'https://stage.economist.com/graphql',
  'prod': 'https://www.economist.com/graphql'
}

class FetchGrapQLData {
  constructor(dateToFecth) {
    this.dateToFecth = dateToFecth;
  }
  getDataByDate() {
    console.log(this.dateToFecth + "--Inner DATE TO FECTH")
    const query = `{canonical(ref: "/xref/www.economist.com/printedition/${this.dateToFecth}") { hasPart { parts { tegID audio { main {id url { canonical } } } title: headline published: datePublished lastModified: dateModified print {section { id tegID sectionName: headline }}}}}}`;

    var dataWithPromise = request(graphQlUrl.prod, query).then(response => {
      return response;
    }).catch(error => {
      return error;
    });
    return dataWithPromise
  }

  getDataByDateAndText(textToMatch) {
    const query = `{canonical(ref: "/xref/www.economist.com/printedition/${this.dateToFecth}") { hasPart { parts { tegID audio { main {id url { canonical } } } title: headline published: datePublished lastModified: dateModified print {section { id tegID sectionName: headline }}}}}}`;

    var dataWithPromise = request(graphQlUrl.prod, query).then(response => {
      response = this._retriveDataByText(response, textToMatch);
      return response;
    }).catch(error => {
      error = this.retriveDataByText(error, textToMatch);
      return error;
    });
    return dataWithPromise
  }

  getDataByTopic(size, topic) {
    const query = `{
      canonical(ref: "/xref/www.economist.com/sections/${topic}") {
        hasPart (size:${size}){
          parts {
            tegID audio {
              main {
                url {
                  canonical
                }
              }
            }
            
          }
        }
      }
    }`;

    var dataWithPromise = request(graphQlUrl.prod, query).then(response => {
      return response;
    }).catch(error => {
      return error;
    });
    return dataWithPromise
  }

  _retriveDataByText(res, textToMatch) {
    let returnValue = [];
    console.log(textToMatch)
    if (res.canonical.hasPart.parts) {
      let canonicalPartsArray = res.canonical.hasPart.parts
      canonicalPartsArray.map((item, index) => {
        console.log(item.title.indexOf(textToMatch) + "--" + item.title + "--" + textToMatch)
        if (item.title.indexOf(textToMatch) > -1) {
          console.log("----INSIDE-----" + item.title.indexOf(textToMatch) + "--" + item.title + "--" + textToMatch)
          returnValue.push(item);

        }
      })
    }
    if (returnValue.length > 0) {
      console.log(JSON.stringify(returnValue))
      return returnValue;
    } else {
      return "Data Not Found"
    }
  }
}
module.exports = FetchGrapQLData;