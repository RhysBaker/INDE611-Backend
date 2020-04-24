const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/FBAuth');

const { getAllSketches, postSketch, getSketch, commentOnSketch } = require('./handlers/sketches');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/user');

//sketch route
app.get('/sketches', getAllSketches);
app.post('/sketch', FBAuth, postSketch);
app.get('/sketch/:sketchId', getSketch);
//TODO: Delete sketch
// TODO: Like a sketch
// TODO: unlike sketch
app.post('/sketch/:sketchId/comment', FBAuth, commentOnSketch)

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.region('europe-west1').https.onRequest(app);