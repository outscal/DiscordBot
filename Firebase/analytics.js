var ua = require('universal-analytics');

var visitor = ua('G-CWF7XKE5XB');
visitor.pageview("/hello", function (err) {
    if(err){ 
        console.log("error while logging pageview");
    } else {
        console.log("pageview request fired");
    }
});

var params = {
    ec: "Event Category",
    ea: "Event Action",
    el: "…and a label",
    ev: 42,
    dp: "/contact"
  }
  
  visitor.event(params).send();
