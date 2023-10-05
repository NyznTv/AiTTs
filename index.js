const TTsText = document.querySelector("#TTS-Text");
const TTsDonator = document.querySelector("#TTS-Donator");

queqe = []

const searchStrings = [["hugo","letshugo","letshugotv","ügo"],["basti","bastighg","bastian"]]
const searchIcons = [" :",":"," =","="," >",">"]

const voiceIds = {"bot":"21m00Tcm4TlvDq8ikWAM","hugo":"CYw3kZ02Hs0563khs1Fj","basti":"D38z5RcWu1voky8WS1ja"}

let dono;
window.addEventListener('onWidgetLoad', async function (obj) {
    apiKey = obj.detail.fieldData.apiKey;
    dono = obj.detail.fieldData.dono;
    rDelay = obj.detail.fieldData.delay;
    alrRunning = false
});

window.addEventListener('onEventReceived', async function (obj) {
    if(!obj.detail.event) {
      return;
    }
    if(typeof obj.detail.event.itemId !== "undefined") {
        obj.detail.listener = "redemption-latest"
    }
    const listener = obj.detail.listener.split("-")[0];
    const event = obj.detail.event;

    if(listener === 'tip') {
        if(event.amount >= 3) {
          if(event.message !== undefined) {
            queqe.push(JSON.parse('{"amount":'+event.amount+',"message":"'+event.message+'","name":"'+event.name+'"}'))
            while(queqe.length > 0 && alrRunning === false) {
              alrRunning = true
              TTsDonator.textContent = queqe[0].name +" "+ dono +" "+ event.amount +"€"
              TTsText.textContent = queqe[0].message
              await playAudio(queqe[0].message)
              queqe.splice(0,1)
            }
            alrRunning = false
          }
        }
    }
});

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function searchForAiTTs(donoText,beforeResult) {
  index = {"lowestIndex":5000,"text":""};
  if(!beforeResult) {
    donoText = donoText.toLowerCase();
    result = [];
  } else {
    donoText = beforeResult[beforeResult.length-1];
    result = beforeResult;
  }
  
  for (searchStringGroup of searchStrings) {
    for (searchString of searchStringGroup) {
      for (searchIcon of searchIcons) {
        if(donoText.indexOf(";") < index.lowestIndex && donoText.indexOf(";") !== -1) {
          index.lowestIndex = donoText.indexOf(";")
          index.text = ";"
          index.id = "bot"
        }
        if(donoText.indexOf(searchString+searchIcon) < index.lowestIndex && donoText.indexOf(searchString+searchIcon) !== -1){
          index.lowestIndex = donoText.indexOf(searchString+searchIcon)
          index.text = searchString+searchIcon
          index.id = searchStringGroup[0]
        }
      }
    }
  }
  if(index.lowestIndex !== 0 && result.length === 0) {
    result.push("bot")
    result.push(donoText.slice(0,donoText.length))
  } else {
    if(index.lowestIndex !== 0) result[result.length-1] = result[result.length-1].slice(0,index.lowestIndex);
    result.push(index.id);
    result.push(donoText.slice(index.lowestIndex+index.text.length,donoText.length));
  }
  if(result.includes(undefined)) {result.length = result.length-2;return result}
  return searchForAiTTs("",result)
}

function getAudio(voiceId,text) {
  const apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech/'+voiceId+'/stream?optimize_streaming_latency=0&output_format=mp3_44100_128';

  const requestData = {
    text: text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0,
      similarity_boost: 0,
      style: 0,
      use_speaker_boost: true
    }
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'audio/mpeg',
    'xi-api-key': apiKey
  });

  return fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob();
    })
    .catch((error) => {
      console.error('Fetch error:', error);
    });
}

async function playAudio(message) {
  array = searchForAiTTs(message)
  while(array.length > 0) {
    voiceId = voiceIds[array[0]]
    text = array[1]
    const audio = new Audio(URL.createObjectURL(await getAudio(voiceId,text)))
    audio.play()
    await new Promise((resolve) => {
      audio.addEventListener("ended", () => {
        array.splice(0,2)
        resolve();
      });
    });
  }
  await delay(rDelay)
  TTsDonator.textContent = ""
  TTsText.textContent = ""
  return;
}
