var ua = require('universal-analytics');
// var DEBUG=universal-analytics

var visitor = ua('G-CWF7XKE5XB').debug(true);
// var visitor = ua('G-CWF7XKE5XB');
// visitor.pageview("/hello", function (err) {
//     if(err){ 
//         console.log("error while logging pageview " + err);
//     } else {
//         console.log("pageview request fired");
//     }
// });

var params = {
    ec: "Event Category",
    ea: "Event Action",
    el: "…and a label",
    ev: 42,
  };
  
visitor.event(params, function (err){ 
    console.log("Error: " + err);
});

// The following environment variable is set by app.yaml when running on App
// Engine, but will need to be set manually when running locally. See README.md.
const got = require('got');

// const {GA_TRACKING_ID} = process.env;
const GA_TRACKING_ID = "G-CWF7XKE5XB";

const trackEvent = (category, action, label, value) => {
  const data = {
    // API Version.
    v: '1',
    // Tracking ID / Property ID.
    tid: GA_TRACKING_ID,
    // Anonymous Client Identifier. Ideally, this should be a UUID that
    // is associated with particular user, device, or browser instance.
    cid: '555',
    // Event hit type.
    t: 'event',
    // Event category.
    ec: category,
    // Event action.
    ea: action,
    // Event label.
    el: label,
    // Event value.
    ev: value,
    _dbg: 1,
  };

  got.post('http://www.google-analytics.com/collect', data);
};

trackEvent(
    'Example category',
    'Example action',
    'Example label',
    '100'
);