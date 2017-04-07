var express = require('express');

var cors = require('cors')
var bodyParser = require("body-parser");
var app = express();

app.use(cors());
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var admin = require("firebase-admin");

var serviceAccount = "weathersight-76387-firebase-adminsdk-dd02w-39c9ef1879.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://weathersight-76387.firebaseio.com"
});

const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: "9d849c12",
    apiSecret: "71f0997cd3751d3e"
});

var msgRef = admin.database().ref("messageQueue");

msgRef.on('child_added', (data) => {
    console.log(data.val());
});
msgRef.on('child_changed', (data) => {
    console.log(data.val());
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/testmsg', (req, res) => {

    nexmo.message.sendSms(
        '12075600359', '12286710743', 'yo this is a test message',
        (err, responseData) => {
            if (err) {
                console.log(err);
            } else {
                console.dir(responseData);
            }
        }
    );

    res.status(200).end();
})

app.post('/sendsms', function(request, res) {

    console.log(request.body);

    var id = request.body.lightId;
    var idToken = request.body.token;
    var lightSms = request.body.lightSms;
    var command = request.body.command;

    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            var uid = decodedToken.uid;

            var message = id + command;

            nexmo.message.sendSms(
                '12075600359', lightSms, message,
                (err, responseData) => {
                    if (err) {
                        console.log(err);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ a: true }));
                    } else {
                        console.log(responseData);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ a: false }));
                    }
                }
            );
            // ...
        }).catch((error) => {

            console.log(err);

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ a: true }));

        });

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

            var finalreff = admin.database().ref("messageQueue/" + incomingData.messageId).set(incomingData);

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
