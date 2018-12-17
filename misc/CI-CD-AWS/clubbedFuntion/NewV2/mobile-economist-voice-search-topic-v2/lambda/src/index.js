/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
/* eslint-disable  consistent-return */

const alexa = require('ask-sdk');
const constants = require('./constants/constants');
const services = require('./services/graphqlServices');

/* INTENT HANDLERS */

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    let message;
    let reprompt;

    if (!playbackInfo.hasPreviousPlaybackSession) {
      message = constants.literals.LaunchRequestHandler.SpeakText;
      reprompt = constants.literals.LaunchRequestHandler.ListenText;
    } else {
      playbackInfo.inPlaybackSession = false;
      playbackInfo.isPlayDefaultHighlight = false;
      message = constants.literals.LaunchRequestHandler.ResumeStateSpeakText.replace('{0}', playbackInfo.playList[playbackInfo.playOrder[playbackInfo.index]].title);
      reprompt = constants.literals.LaunchRequestHandler.ResumeStateListenText;
    }

    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(reprompt)
      .getResponse();
  },
};

const SearchTopicHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'SearchTopic';
  },
  async handle(handlerInput) {
    try {
      const playbackInfo = await getPlaybackInfo(handlerInput);
      const slotValue = handlerInput.requestEnvelope.request.intent.slots.mySearchTopic.value;
      let message;
      let reprompt;

      if (slotValue) {
        const searchTopicData = await services.getSearchByTopics(slotValue);

        if (searchTopicData && searchTopicData.getDataByTopics && searchTopicData.getDataByTopics.length) {
          setPlaybackInfoAttributes(handlerInput, searchTopicData.getDataByTopics, 'topic');
          playbackInfo.isPlayDefaultHighlight = false;
          return controller.play(handlerInput);
        } else {
          playbackInfo.isPlayDefaultHighlight = true;
          message = constants.literals.SearchTopicHandler.EmptyListSpeakText;
          reprompt = constants.literals.SearchTopicHandler.EmptyListListenText;
        }
      } else {
        message = constants.literals.SearchTopicHandler.EmptySlotValueSpeakText;
        reprompt = constants.literals.SearchTopicHandler.EmptySlotValueListenText;
      }

      return handlerInput.responseBuilder
        .speak(message)
        .reprompt(reprompt)
        .getResponse();

    } catch (error) {
      console.error('Error in search topic handler:', JSON.stringify(error));

      return handlerInput.responseBuilder
        .speak(constants.literals.SearchTopicHandler.PromiseErrorSpeakText)
        .addAudioPlayerStopDirective()
        .getResponse();
    }

  },
};

const HighlightHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'Highlight';
  },
  async handle(handlerInput) {
    return bindHighlightHandler(handlerInput);
  },
};

const AudioPlayerEventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
  },
  async handle(handlerInput) {
    const {
      requestEnvelope,
      attributesManager,
      responseBuilder
    } = handlerInput;
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1];
    const {
      playbackSetting,
      playbackInfo
    } = await attributesManager.getPersistentAttributes();

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        playbackInfo.token = getToken(handlerInput);
        playbackInfo.index = await getIndex(handlerInput);
        playbackInfo.inPlaybackSession = true;
        playbackInfo.hasPreviousPlaybackSession = true;
        break;
      case 'PlaybackFinished':
        playbackInfo.inPlaybackSession = false;
        playbackInfo.hasPreviousPlaybackSession = false;
        playbackInfo.nextStreamEnqueued = false;
        break;
      case 'PlaybackStopped':
        playbackInfo.token = getToken(handlerInput);
        playbackInfo.index = await getIndex(handlerInput);
        playbackInfo.offsetInMilliseconds = getOffsetInMilliseconds(handlerInput);
        break;
      case 'PlaybackNearlyFinished':
        {
          if (playbackInfo.nextStreamEnqueued) {
            break;
          }

          const enqueueIndex = (playbackInfo.index + 1) % playbackInfo.playList.length;

          if (enqueueIndex === 0 && !playbackSetting.loop) {
            break;
          }

          playbackInfo.nextStreamEnqueued = true;

          const enqueueToken = playbackInfo.playOrder[enqueueIndex];
          const playBehavior = 'ENQUEUE';
          const podcast = playbackInfo.playList[playbackInfo.playOrder[enqueueIndex]];
          const audioUrlKey = getAudioUrlKey(playbackInfo);
          const expectedPreviousToken = playbackInfo.token;
          const offsetInMilliseconds = 0;

          responseBuilder.addAudioPlayerPlayDirective(
            playBehavior,
            podcast[audioUrlKey],
            enqueueToken,
            offsetInMilliseconds,
            expectedPreviousToken,
          );
          break;
        }
      case 'PlaybackFailed':
        playbackInfo.inPlaybackSession = false;
        console.log('Playback Failed : %j', handlerInput.requestEnvelope.request.error);
        return;
      default:
        throw new Error('Should never reach here!');
    }

    return responseBuilder.getResponse();
  },
};

const CheckAudioInterfaceHandler = {
  async canHandle(handlerInput) {
    const audioPlayerInterface = ((((handlerInput.requestEnvelope.context || {}).System || {}).device || {}).supportedInterfaces || {}).AudioPlayer;
    return audioPlayerInterface === undefined
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry, this skill is not supported on this device')
      .withShouldEndSession(true)
      .getResponse();
  },
};

const StartPlaybackHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    if (!playbackInfo.inPlaybackSession) {
      return request.type === 'IntentRequest' && request.intent.name === 'PlayAudio';
    }
    if (request.type === 'PlaybackController.PlayCommandIssued') {
      return true;
    }

    if (request.type === 'IntentRequest') {
      return request.intent.name === 'PlayAudio' ||
        request.intent.name === 'AMAZON.ResumeIntent';
    }
  },
  handle(handlerInput) {
    return controller.play(handlerInput);
  },
};

const NextPlaybackHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      (request.type === 'PlaybackController.NextCommandIssued' ||
        (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NextIntent'));
  },
  handle(handlerInput) {
    return controller.playNext(handlerInput);
  },
};

const PreviousPlaybackHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      (request.type === 'PlaybackController.PreviousCommandIssued' ||
        (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PreviousIntent'));
  },
  handle(handlerInput) {
    return controller.playPrevious(handlerInput);
  },
};

const PausePlaybackHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.PauseIntent');
  },
  handle(handlerInput) {
    return controller.stop(handlerInput);
  },
};

const LoopOnHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.LoopOnIntent';
  },
  async handle(handlerInput) {
    const playbackSetting = await handlerInput.attributesManager.getPersistentAttributes().playbackSettings;

    playbackSetting.loop = true;

    return handlerInput.responseBuilder
      .speak('Loop turned on.')
      .getResponse();
  },
};

const LoopOffHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.LoopOffIntent';
  },
  async handle(handlerInput) {
    const playbackSetting = await handlerInput.attributesManager.getPersistentAttributes().playbackSetting;

    playbackSetting.loop = false;

    return handlerInput.responseBuilder
      .speak('Loop turned off.')
      .getResponse();
  },
};

const ShuffleOnHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.ShuffleOnIntent';
  },
  async handle(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    playbackSetting.shuffle = true;
    playbackInfo.playOrder = await shuffleOrder();
    playbackInfo.index = 0;
    playbackInfo.offsetInMilliseconds = 0;
    playbackInfo.playbackIndexChanged = true;
    return controller.play(handlerInput);
  },
};

const ShuffleOffHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.ShuffleOffIntent';
  },
  async handle(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    if (playbackSetting.shuffle) {
      playbackSetting.shuffle = false;
      playbackInfo.index = playbackInfo.playOrder[playbackInfo.index];
      playbackInfo.playOrder = [...Array(playbackInfo.playList.length).keys()];
    }

    return controller.play(handlerInput);
  },
};

const StartOverHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.StartOverIntent';
  },
  async handle(handlerInput) {
    const playbackInfo = await handlerInput.attributesManager.getPersistentAttributes().playbackInfo;

    playbackInfo.offsetInMilliseconds = 0;

    return controller.play(handlerInput);
  },
};

const YesHandler = {
  async canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
  },
  async handle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);

    if (!playbackInfo.isPlayDefaultHighlight) {
      return controller.play(handlerInput);
    } else {
      return bindHighlightHandler(handlerInput);
    }
  },
};

const NoHandler = {
  async canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    return controller.dontResume(handlerInput);
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  async handle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    let message;
    let reprompt;

    if (!playbackInfo.hasPreviousPlaybackSession) {
      message = constants.literals.HelpHandler.SpeakText;
      reprompt = constants.literals.HelpHandler.ListenText;
    } else if (!playbackInfo.inPlaybackSession) {
      message = constants.literals.HelpHandler.ResumeStateSpeakText.replace('{0}', playbackInfo.playList[playbackInfo.index].title);
      reprompt = constants.literals.HelpHandler.ResumeStateListenText;
    } else {
      message = constants.literals.HelpHandler.HelpSpeakText;
      reprompt = constants.literals.HelpHandler.HelpListenText;
    }

    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(reprompt)
      .getResponse();
  },
};

const ExitHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;

    return !playbackInfo.inPlaybackSession &&
      request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(constants.literals.ExitHandler.SpeakText)
      .getResponse();
  },
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`);
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

    return handlerInput.responseBuilder
      .speak(constants.literals.ErrorHandler.SpeakText)
      .reprompt(constants.literals.ErrorHandler.ListenText)
      .getResponse();
  },
};

/* INTERCEPTORS */

const LoadPersistentAttributesRequestInterceptor = {
  async process(handlerInput) {
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

    // Check if user is invoking the skill the first time and initialize preset values
    if (Object.keys(persistentAttributes).length === 0) {
      handlerInput.attributesManager.setPersistentAttributes({
        playbackSetting: {
          loop: false,
          shuffle: false,
        },
        playbackInfo: {
          index: 0,
          offsetInMilliseconds: 0,
          playbackIndexChanged: true,
          token: '',
          nextStreamEnqueued: false,
          inPlaybackSession: false,
          hasPreviousPlaybackSession: false
        },
      });
    }
  },
};

const SavePersistentAttributesResponseInterceptor = {
  async process(handlerInput) {
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

/* HELPER FUNCTIONS */

async function getPlaybackInfo(handlerInput) {
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();
  return attributes.playbackInfo;
}

async function canThrowCard(handlerInput) {
  const {
    requestEnvelope,
    attributesManager
  } = handlerInput;
  const playbackInfo = await getPlaybackInfo(handlerInput);

  if (requestEnvelope.request.type === 'IntentRequest' && playbackInfo.playbackIndexChanged) {
    playbackInfo.playbackIndexChanged = false;
    return true;
  }
  return false;
}

const controller = {
  async play(handlerInput) {
    const {
      attributesManager,
      responseBuilder
    } = handlerInput;

    const playbackInfo = await getPlaybackInfo(handlerInput);
    const {
      playList,
      playOrder,
      offsetInMilliseconds,
      index
    } = playbackInfo;

    const playBehavior = 'REPLACE_ALL';
    const podcast = playList[playOrder[index]];
    const audioUrlKey = getAudioUrlKey(playbackInfo);
    const token = playOrder[index];

    responseBuilder
      .speak(podcast.title)
      .withShouldEndSession(true)
      .addAudioPlayerPlayDirective(playBehavior, podcast[audioUrlKey], token, offsetInMilliseconds, null);

    if (await canThrowCard(handlerInput)) {
      const cardTitle = `Playing ${podcast.title}`;
      const cardContent = `Playing ${podcast.title}`;
      responseBuilder.withSimpleCard(cardTitle, cardContent);
    }

    return responseBuilder.getResponse();
  },
  stop(handlerInput) {
    return handlerInput.responseBuilder
      .speak(constants.literals.ExitHandler.SpeakText)
      .addAudioPlayerStopDirective()
      .getResponse();
  },
  async playNext(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    const nextIndex = (playbackInfo.index + 1) % playbackInfo.playList.length;

    if (nextIndex === 0 && !playbackSetting.loop) {
      return handlerInput.responseBuilder
        .speak(constants.literals.Playback.PlayNext)
        .addAudioPlayerStopDirective()
        .getResponse();
    }

    playbackInfo.index = nextIndex;
    playbackInfo.offsetInMilliseconds = 0;
    playbackInfo.playbackIndexChanged = true;

    return this.play(handlerInput);
  },
  async playPrevious(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    let previousIndex = playbackInfo.index - 1;

    if (previousIndex === -1) {
      if (playbackSetting.loop) {
        previousIndex += playbackInfo.playList.length;
      } else {
        return handlerInput.responseBuilder
          .speak(constants.literals.Playback.PlayPrevious)
          .addAudioPlayerStopDirective()
          .getResponse();
      }
    }

    playbackInfo.index = previousIndex;
    playbackInfo.offsetInMilliseconds = 0;
    playbackInfo.playbackIndexChanged = true;

    return this.play(handlerInput);
  },
  dontResume(handlerInput) {

    return handlerInput.responseBuilder
      .speak(constants.literals.NoHandler.SpeakText)
      .reprompt(constants.literals.NoHandler.ListenText)
      .getResponse();
  }
};

function getToken(handlerInput) {
  // Extracting token received in the request.
  return handlerInput.requestEnvelope.request.token;
}

async function getIndex(handlerInput) {
  // Extracting index from the token received in the request.
  const tokenValue = parseInt(handlerInput.requestEnvelope.request.token, 10);
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();

  return attributes.playbackInfo.playOrder.indexOf(tokenValue);
}

function getOffsetInMilliseconds(handlerInput) {
  // Extracting offsetInMilliseconds received in the request.
  return handlerInput.requestEnvelope.request.offsetInMilliseconds;
}

async function shuffleOrder() {
  const playbackInfo = await getPlaybackInfo(handlerInput);
  const array = [...Array(playbackInfo.playList.length).keys()];
  let currentIndex = array.length;
  let temp;
  let randomIndex;
  // Algorithm : Fisher-Yates shuffle
  return new Promise((resolve) => {
    while (currentIndex >= 1) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }
    resolve(array);
  });
}

function getAudioUrlKey(playbackInfo) {
  switch (playbackInfo.type.toLowerCase()) {
    case 'topic':
      return 'audio';
    case 'highlight':
      return 'enclosure';
    default:
      throw new Error('Playback type is not listed in the switch statement to get the audio url key.');
  }
}

async function setPlaybackInfoAttributes(handlerInput, playListData, type) {
  const playbackInfo = await getPlaybackInfo(handlerInput);
  playbackInfo.type = type;
  playbackInfo.playList = playListData;
  playbackInfo.playOrder = [...Array(playbackInfo.playList.length).keys()];
  playbackInfo.index = 0;
  playbackInfo.offsetInMilliseconds = 0;
  playbackInfo.playbackIndexChanged = true;
  playbackInfo.hasPreviousPlaybackSession = false;
}

async function bindHighlightHandler(handlerInput) {
  try {
    const highlightData = await services.getHighlights();
    let message;
    let reprompt;

    if (highlightData && highlightData.getAllDataFromXMLRSS && highlightData.getAllDataFromXMLRSS.length) {
      setPlaybackInfoAttributes(handlerInput, highlightData.getAllDataFromXMLRSS, 'highlight');
      return controller.play(handlerInput);
    } else {
      message = constants.literals.HighlightsHandler.EmptyListSpeakText;
      reprompt = constants.literals.HighlightsHandler.EmptyListListenText;
    }

    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(reprompt)
      .getResponse();
  } catch (error) {
    console.error('Error in highlight handler:', JSON.stringify(error));

    return handlerInput.responseBuilder
      .speak(constants.literals.HighlightsHandler.PromiseErrorSpeakText)
      .addAudioPlayerStopDirective()
      .getResponse();
  }
}

const skillBuilder = alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    CheckAudioInterfaceHandler,
    LaunchRequestHandler,
    HelpHandler,
    SystemExceptionHandler,
    SessionEndedRequestHandler,
    YesHandler,
    NoHandler,
    StartPlaybackHandler,
    NextPlaybackHandler,
    PreviousPlaybackHandler,
    PausePlaybackHandler,
    LoopOnHandler,
    LoopOffHandler,
    ShuffleOnHandler,
    ShuffleOffHandler,
    StartOverHandler,
    ExitHandler,
    AudioPlayerEventHandler,
    SearchTopicHandler,
    HighlightHandler
  )
  .addRequestInterceptors(LoadPersistentAttributesRequestInterceptor)
  .addResponseInterceptors(SavePersistentAttributesResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withAutoCreateTable(true)
  .withTableName(constants.skill.dynamoDBTableName)
  .lambda();