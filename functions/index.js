const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/FBAuth');

const { getAllSketches, postSketch } = require('./handlers/sketches');
const { signup, login, uploadImage } = require('./handlers/user');

//sketch route
app.get('/sketches', getAllSketches);
app.post('/sketch', FBAuth, postSketch);

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', uploadImage);


exports.api = functions.region('europe-west1').https.onRequest(app);