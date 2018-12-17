const Alexa = require('ask-sdk-core');
const _utils = require('./utils')
const utility = new _utils()


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    //console.log(utility.getLaunchSpeechText())
    //const speechText = utility.getLaunchSpeechText() + `! You can ask for this weeks edition, last week's edition, or the edition published today.`;
    const accestoken = handlerInput.requestEnvelope.context.System.apiAccessToken
    const deviceid = handlerInput.requestEnvelope.context.System.device.deviceId;
    const speechText = "Hello! your location is Noida Pin 201301" + JSON.stringify(utility.getDataFromApi(accestoken, deviceid))
    //const speechText = "Hello!" + JSON.stringify(handlerInput.requestEnvelope.context.System.device.deviceId)
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("Repromt Speech Text")
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can order by saying go ahead, And i will tell you dishes you can order';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const customeIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'getIdIntent';
  },
  handle(handlerInput) {
    var slotValue = handlerInput.requestEnvelope.request.intent.slots.idNumber.value;
    const speechText = 'You Have Mention, Please Verify. ' + slotValue + ". Should I go ahead"

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Custom intent ! Initiated', speechText)
      .getResponse();
  },
};

const goAheadIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'goAheadIntent';

  },
  handle(handlerInput) {
    let speechText = 'Now You Can order Food From the following';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Go Ahead Intent', speechText)
      .getResponse();
  },

}

const orderFoodByMenu = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'orderFoodByMenu';

  },
  handle(handlerInput) {
    var slotValue = handlerInput.requestEnvelope.request.intent.slots.dish.value;
    let speechText = 'You have sucessfully order ' + slotValue + "!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Order Intent', speechText)
      .getResponse();
  },

}

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const speechText = error.message;
    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.' + speechText)
      .reprompt('Sorry, I can\'t understand the command. Please say again.' + speechText)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    customeIntent,
    goAheadIntent,
    orderFoodByMenu,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
