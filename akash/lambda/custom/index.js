/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const QuesJson = require('./question.json')
let questionAnswerIS = '';
let questionID = '';
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    let speechText;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.questionNumber = 0;
    attributes.playQuiz = false;
    speechText = `Welcome to the Digital ClassRoom. Your Digital Learning Guide. 
    You can ask me Any Topic, Just  Say "Tell me About Followed by Topic Name". Also You Can Play Quiz, Just Say "Play Quiz".`;
    speechText = speechText;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const StartOvertHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent';
  },
  handle(handlerInput) {
    const speechText = `What would you like to do play quiz say play quiz or ask any topic ? 
    Just Ask your topic by saying, Tell me about followed by topic name.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
}

const PlayquizHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayquizIntent';
  },
  handle(handlerInput) {
    let speechText = ''
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.playQuiz = true;
    if (attributes.questionNumber == 0) {
      speechText = `Lets Play Quiz. You have got ${QuesJson.quizQuestion.length} question and for 
    every correct answer you will get plus one point. And you can anytime say Alexa Stop to Stop. Your First Question Is.`;
      let questionToAsk = QuesJson.quizQuestion[attributes.questionNumber].question;
      speechText = speechText + questionToAsk;
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const QuizAnswerCheckHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'QuizAnswerCheckIntent';
  },
  handle(handlerInput) {
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText;
    if (attributes.playQuiz) {
      const slotValue = handlerInput.requestEnvelope.request.intent.slots.answerTodayQuestion.value;
      console.log("slotValue--------", slotValue, '------type of slotvalue------', typeof (slotValue), '---answer----', QuesJson.quizQuestion[attributes.questionNumber].answer, '---typeof question----', typeof (QuesJson.quizQuestion[attributes.questionNumber].answer))
      if (QuesJson.quizQuestion.length >= attributes.questionNumber) {
        if (QuesJson.quizQuestion[attributes.questionNumber].answer.toLowerCase() == slotValue.toLowerCase()) {
          attributes.questionNumber++;
          speechText = "Your Answer Is " + slotValue + ". And you are Correct! Next Question is ." + QuesJson.quizQuestion[attributes.questionNumber].question;
        } else {
        attributes.questionNumber++;
        speechText = "Your Answer Is " + slotValue + ". And its incorrect! Next Question is! " + QuesJson.quizQuestion[attributes.questionNumber].question;          
        }
      } else {
        speechText = "Your Answer Is " + slotValue + ". And you are Correct. You have reacheed End of Quiz. To Continue ask me Serach Topic Of Your Choice. Just Say tell me about followed by topic name";
      }
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};


const TopicIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SearchTopicIntent';
  },
  handle(handlerInput) {
    const slotValue = handlerInput.requestEnvelope.request.intent.slots.Query.value.toLowerCase();
    //console.log(slotValue, '---------TopicHandler', QuesJson.topic[slotValue].text, "----------------")
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText = `You have Asked about ${slotValue}. `;
    console.log(slotValue, "Exat Slot Vaalue")
    console.log(QuesJson.topic.hasOwnProperty(slotValue), "--------SLOTVALUE QUERYYY PARAM");
    if (QuesJson.topic.hasOwnProperty(slotValue)) {
      speechText = speechText + QuesJson.topic[slotValue].text;
    } else {
      speechText = speechText + " And Topic Is Not Found. You Can Ask Main Topic Like Biology, Physics etc.";
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};


const NextIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent';
  },
  handle(handlerInput) {
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText = `Your Next Question Is.`;
    let questionToAsk = QuesJson.quizQuestion[attributes.questionNumber].question;
    speechText = speechText + questionToAsk;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = `You Say Play Quiz to Play Quiz or ask any topic, just sat Tell me and followied by topic name . Lastly, You can Anytime, reach to our website or log any 
    grivance for the same. Just Say I Dont like, followed by your message`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

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
    let speakError = error.message;

    return handlerInput.responseBuilder
      .speak(speakError + `Sorry, I can\'t understand the command. Please say again.`)
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};



const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayquizHandler,
    QuizAnswerCheckHandler,
    StartOvertHandler,
    NextIntentHandler,
    TopicIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
