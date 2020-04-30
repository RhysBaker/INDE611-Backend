const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');
const FBAuth = require('./util/FBAuth');

const { getAllSketches, postSketch, getSketch, commentOnSketch, likeSketch, unlikeSketch, deleteSketch } = require('./handlers/sketches');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/user');

//sketch route
app.get('/sketches', getAllSketches);
app.post('/sketch', FBAuth, postSketch);
app.get('/sketch/:sketchId', getSketch);
app.delete('/sketch/:sketchId', FBAuth, deleteSketch)
app.get('/sketch/:sketchId/like', FBAuth, likeSketch);
app.get('/sketch/:sketchId/unlike', FBAuth, unlikeSketch);
app.post('/sketch/:sketchId/comment', FBAuth, commentOnSketch);

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser)
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


exports.api = functions.region('europe-west1').https.onRequest(app);


exports.createNotificationOnLike = functions
    .region('europe-west1')
    .firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/sketches/${snapshot.data().sketchId}`)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        sketchId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            });
    });

exports.deleteNotificationOnUnLike = functions
    .region('europe-west1')
    .firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            });
    });


exports.createNotificationOnComment = functions
    .region('europe-west1')
    .firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        db.doc(`/sketches/${snapshot.data().sketchId}`)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        sketchId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            });
    });