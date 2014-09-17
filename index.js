// ### Libraries and globals

// This bot works by inspecting the front page of Google News. So we need
// to use `request` to make HTTP requests, `cheerio` to parse the page using
// a jQuery-like API, `underscore.deferred` for [promises](http://otaqui.com/blog/1637/introducing-javascript-promises-aka-futures-in-google-chrome-canary/),
// and `twit` as our Twitter API library.
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore.deferred');
var Twit = require('twit');
var T = new Twit(require('./config.js'));

var baseUrl = 'http://google.com';

// ### Utility Functions

// This function lets us call `pick()` on any array to get a random element from it.
Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

// This function lets us call `pickRemove()` on any array to get a random element
// from it, then remove that element so we can't get it again.
Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};


function getInstructions(url) {
  var dfd = new _.Deferred();
  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(body);
      var headlines = [];
      var tempHeadline;
      var tempURL;
      var tempObject;
      var tempVerb;
      var lcVerb;
      var verbs = [" Gets ", " Issues ", " Calls ", " Sues ", " Detects ", " Overtakes ", " Says ", " Debuts ", " Halts ", " Yields ", " Opens ", " Leaves ", " Smashes ", " Returns ", " Turns ", " Ready ", " Could ", " Honoured ", " Finally ", " Outdoes ", " Withdraws ", " Flips ", " Was ", " Reveals ", " Breaks ", " Wins ", " Faces ", " Defeats ", " Announces ", " Responds ", " Urges ", " Gives ", " Holds ", " Will "];    
      $('h2 a').each( function(){
        console.log("got here!")
        tempHeadline = $(this).text();
        tempURL = $(this).attr('url');        
        var myHeadline;
        myHeadline = tempHeadline.toLowerCase();
        if(verbs.some(function(verb) {
          tempVerb = verb;
          lcVerb = verb.toLowerCase();
          return myHeadline.indexOf(lcVerb) > -1;          
        })) tempObject = {"headline": tempHeadline, "url": tempURL, "verb": tempVerb};
      });
      headlines.push(tempObject);
      console.log(headlines);
      console.log("ready to resolve");
      dfd.resolve(headlines);
  }
    else {
      dfd.reject();
    }
  });
  return dfd.promise();
}



// ### Tweeting

//      Category codes:
//      w:  world
//      n:  region
//      b:  business
//      tc: technology
//      e:  entertainment
//      s:  sports

// This is the core function that is called on a timer that initiates the @twoheadlines algorithm.
// First, we get our list of topics from the Google News sidebar. 
// Then we pick-and-remove a random topic from that list.
// Next we grab a random headline available for that topic.
// If the topic itself is in the headline itself, we replace it with a new topic. (For example,
// if `topic.name` is "Miley Cyrus" and `headline` is "Miley Cyrus Wins a Grammy", then we
// get a topic from a different category of news and fill in the blank for "______ Wins a Grammy".)
// If we're unable to find a headline where we can easily find/replace, we simply try again.
function tweet() {
  var categoryCodes = ['w', 'n', 'b', 'tc', 'e', 's'];
  var category = categoryCodes.pickRemove();
  var foundVerb;
  var foundHeadline;
  var foundURL;
  console.log(category);
  var headlineURL = baseUrl + '/news/section?ned=us&topic=' + category;
  console.log(headlineURL);    
    getHeadline(headlineURL).then(function(headlines) {
      console.log("here we are");
      foundVerb = headlines[0].verb;
      console.log(foundVerb);
      foundHeadline = headlines[0].headline;
      console.log("this is the found headline: " + foundHeadline);
      foundURL = headlines[0].url;
      console.log(foundURL);
      if (foundHeadline.indexOf(foundVerb) > -1) {
          console.log("hey got here ok?")
          var newHeadline;
          console.log("this is the new headline " + newHeadline);
          var headlineArray = [];
          headlineArray = foundHeadline.split(foundVerb);
          console.log("this is the " + headlineArray);
          var newHeadline = "John Cusack" + foundVerb + headlineArray[1];
          console.log(newHeadline);
          var statusUpdate = newHeadline + " " + foundURL;
          console.log(statusUpdate);
          T.post('statuses/update', { status: statusUpdate }, function(err, reply) {
            if (err) {
              console.log('error:', err);
            }
            else {
              console.log('reply:', reply);
            }
          });
        // });
      }
      else if (foundHeadline.indexOf(foundVerb.toLowerCase()) > -1) {
          console.log("hey got here ok?")
          var newHeadline;
          console.log("this is the new headline " + newHeadline);
          var headlineArray = [];
          headlineArray = foundHeadline.split(foundVerb.toLowerCase());
          console.log("this is the " + headlineArray);
          var newHeadline = "John Cusack" + foundVerb.toLowerCase() + headlineArray[1];
          console.log(newHeadline);
          var statusUpdate = newHeadline + " " + foundURL;
          console.log(statusUpdate);
          T.post('statuses/update', { status: statusUpdate }, function(err, reply) {
            if (err) {
              console.log('error:', err);
            }
            else {
              console.log('reply:', reply);
            }
          });
        // });
      }
      else {
        console.log('couldn\'t find a headline match, trying again...');
        tweet();
      }
    });
  // });
}

// Tweets once on initialization.
tweet();

// Tweets every 6.66 hours.
setInterval(function () {
  try {
    tweet();
  }
  catch (e) {
    console.log(e);
  }
}, 24000000);
