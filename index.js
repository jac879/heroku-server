var express = require('express');
var app = express();


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});


app.get('/inbound', (req, res) => {
    if (!req.query.to || !req.query.msisdn) {
        console.log('This is not a valid inbound SMS message!');
    } else {
        if (req.query.concat) {
            console.log('Fail: the message is too long.');
            console.log(req.query);
            /*
            {concat: 'true', 'concat-ref': '93', 'concat-total': '5', 'concat-part': '1'...}
            the message is longer than maximum number of characters allowed, and sent in multiple parts.
            Use the concat-ref, concat-total and concat-part parameters to reassemble the parts into the message.
            But I am too lazy so I am ignoring it.
            */
        } else {

            console.log('Success');
            var incomingData = {
                messageId: req.query.messageId,
                from: req.query.msisdn,
                message: req.query.text,
                timestamp: req.query['message-timestamp']
            };

            var searchstring = req.query.msisdn;
            searchstring = searchstring.substring(1);

           /* var ref = admin.database().ref("massTextList/" + searchstring);

            // Attach an asynchronous callback to read the data at our posts reference
            ref.once("value", function(snapshot) {
                console.log(snapshot.val());
                if (snapshot.val() == null) {
                    console.log("user not found, ignore and disregard");
                } else {
                    console.log("user found..");

                    incomingData['name'] = snapshot.val()['name'];
                    var reffer = admin.database().ref("massTextQueue").push(incomingData);

                }

            }, function(errorObject) {
                console.log("The read failed: " + errorObject.code);
            });*/

            console.log(incomingData);
        }
    }
    res.status(200).end();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


