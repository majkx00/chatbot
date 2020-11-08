const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch')

var port = process.env.PORT || config.get('PORT');

const WEATHER_API = "http://api.weatherapi.com/v1/current.json?key=e5237c33ff3444578a4135725200811"
const FORECAST_API = "http://api.weatherapi.com/v1/forecast.json?key=e5237c33ff3444578a4135725200811"

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.hear(['hello', 'hi', 'ahoj', 'hiho'], (payload, chat) => {
  chat.say("Hello ! I'm WeatBot, a weather forecast BOT ! Please, enter city name in 'city *name*' format : ", { typing: true });
});

bot.hear(/city (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const city = data.match[1];
    fetch(WEATHER_API + '&q=' + city).then(res => res.json())
      .then(json => {
        if (json.error) {
          conversation.say(json.error.message, { typing: true });
          conversation.end();
        } else {
          let city = json.location.name;
          let message = "City name : " + city + "\nCountry : " + json.location.country + "\nLocal time : " + json.location.localtime + "\n";
          conversation.say(message, { typing: true });
          setTimeout(() => {
            handleWeatherOption(city, conversation, json);
          }, 3500)
        }
      })

  })
})

function handleWeatherOption(city, conversation, json) {
  conversation.ask({
    text: "If your city is set correct, you can choose one of next options for forecast : ",
    quickReplies: ["2 Days", "3 Days", "7 Days"],
    options: { typing: true }
  }, (payload, conversation) => {

    switch (payload.message.text) {
      case "2 Days":
        fetch(FORECAST_API + '&q=' + city + '&days=2').then(response => response.json()).then(json => {
          handleResult(conversation, json);
        })
        break;
      case "3 Days":
        fetch(FORECAST_API + '&q=' + city + '&days=3').then(response => response.json()).then(json => {
          handleResult(conversation, json);
        })
        break;
      case "7 Days":
        fetch(FORECAST_API + '&q=' + city + '&days=7').then(response => response.json()).then(json => {
          handleResult(conversation, json);
        })
        break;
      default : 
      fetch(FORECAST_API + '&q=' + city + '&days=7').then(response => response.json()).then(json => {
        handleResult(conversation, json);
      })
      break;
    }
  });
}

function handleResult(conversation, result) {
  let forecast = result.forecast.forecastday;

  let message = "";
  for(let day of forecast){
    console.log("Day : ", day);
    let info = day.day;
    message += "============\n\nDate : *" + day.date + "*";
    message += "\n\nMax temp : " + info.maxtemp_c + "°C";
    message += "\nMin temp : " + info.mintemp_c + "°C";
    message += "\nAvg temp : " + info.avgtemp_c + "°C";
    message += "\n\n";
    message += "Chance of rain : " + info.daily_chance_of_rain + "%";
    message += "\nChance of snow : " + info.daily_chance_of_snow + "%";
    message += "\nWind speed : " + info.maxwind_kph + "km/h\n\n"

  }
  conversation.say(message)
}

bot.start(port);