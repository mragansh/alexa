/* CONSTANTS */

const skillConfig = {
  appId: '',
  dynamoDBTableName: 'Audio-Player-Multi-Stream',
  debug: false
};

exports.skill = skillConfig;

exports.serviceConfig = {
  desiredTopicSize: 5,
  desiredHighlightSize: 2,
}

exports.literals = Object.freeze({
  'LaunchRequestHandler': {
    'SpeakText': `${debugSkill('Launch request intent.')} Welcome to the Economist. To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ListenText': `${debugSkill('Launch request intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ResumeStateSpeakText': `${debugSkill('Launch request intent.')} You were listening to {0}, Would you like to resume?`,
    'ResumeStateListenText': `${debugSkill('Launch request intent.')} Would you like to resume? Say no to start a new session.`
  },
  'SearchTopicHandler': {
    'EmptySlotValueSpeakText': `${debugSkill('Search topic intent. Empty Slot value.')} Sorry, I don't understand. Please say help to hear what you can ask for.`,
    'EmptySlotValueListenText': `${debugSkill('Search topic intent. Empty Slot value.')} Sorry, I don't understand. Please say help to hear what you can ask for.`,
    'PromiseErrorSpeakText': `${debugSkill('Search topic intent. Promise error.')} Sorry, something went wrong. Please try again after some time.`,
    'EmptyListSpeakText': `${debugSkill('Search topic intent. Empty data list.')} Sorry, that topic is unavailable. Would you like to listen to the highlights? If you'd like to search for another topic, say Alexa, ask The Economist for the latest and name the topic.`,
    'EmptyListListenText': `${debugSkill('Search topic intent. Empty data list.')} Would you like to listen to the highlights? If you'd like to search for another topic, say Alexa, ask The Economist for the latest and name the topic.`
  },
  'HighlightsHandler': {
    'PromiseErrorSpeakText': `${debugSkill('Highlights intent. Promise error.')} Sorry, something went wrong. Please try again after some time.`,
    'EmptyListSpeakText': `${debugSkill('Highlights intent. Empty data list.')} Sorry, there is no highlight available. If you would like to search the topic? You can say, Alexa, ask the economist to get me the latest and name the topic.`,
    'EmptyListListenText': `${debugSkill('Highlights intent. Empty data list.')} If you would like to search the topic? You can say, Alexa, ask the economist to get me the latest and name the topic.`
  },
  'HelpHandler': {
    'SpeakText': `${debugSkill('Help intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ListenText': `${debugSkill('Help intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ResumeStateSpeakText': `${debugSkill('Help intent.')} You were listening to {0}, Would you like to resume?`,
    'ResumeStateListenText': `${debugSkill('Help intent.')} Would you like to resume? Say no to start a new session.`,
    'HelpSpeakText': `${debugSkill('Help intent.')} You can say, Next or Previous to navigate through the playlist. At any time, you can say Pause to pause the audio and Resume to resume.`,
    'HelpListenText': `${debugSkill('Help intent.')} You can say, Next or Previous to navigate through the playlist. At any time, you can say Pause to pause the audio and Resume to resume.`,
  },
  'NoHandler': {
    'SpeakText': `${debugSkill('No intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ListenText': `${debugSkill('No intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`
  },
  'ExitHandler': {
    'SpeakText': `${debugSkill('Stop audio intent.')} Good bye.`
  },
  'ErrorHandler': {
    'SpeakText': `${debugSkill('Error intent.')} Sorry, something went wrong. To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'ListenText': `${debugSkill('Error intent.')} To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
  },
  'Playback': {
    'PlayNext': `${debugSkill('Playback.')} You have reached at the end of the playlist. To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`,
    'PlayPrevious': `${debugSkill('Playback.')} You have reached at the start of the playlist. To get the latest on any topic, say Alexa, ask the Economist to get me the latest and name the topic. To hear this week's highlights, say Alexa, ask the economist to start the Highlights.`
  }
});

function debugSkill(intentName) {
  if (skillConfig.debug) {
    return `${intentName}.`;
  }
  return '';
}