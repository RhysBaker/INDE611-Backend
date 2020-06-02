const functions = require("firebase-functions");
const app = require("express")();
const { db } = require("./util/admin");
const FBAuth = require("./util/FBAuth");
const cors = require("cors");
app.use(cors());

const {
  getAllSketches,
  postSketch,
  getSketch,
  commentOnSketch,
  likeSketch,
  unlikeSketch,
  deleteSketch,
  uploadSketchImage,
} = require("./handlers/sketches");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/user");

//sketch route
app.get("/sketches", getAllSketches);
app.post("/sketch", FBAuth, postSketch);
app.get("/sketch/:sketchId", getSketch);
app.delete("/sketch/:sketchId", FBAuth, deleteSketch);
app.get("/sketch/:sketchId/like", FBAuth, likeSketch);
app.get("/sketch/:sketchId/unlike", FBAuth, unlikeSketch);
app.post("/sketch/:sketchId/comment", FBAuth, commentOnSketch);
app.post("/sketch/:sketchId/image", FBAuth, uploadSketchImage);

//user routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/sketches/${snapshot.data().sketchId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            notificationId: snapshot.id,
            type: "like",
            read: false,
            sketchId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/sketches/${snapshot.data().sketchId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            notificationId: snapshot.id,
            type: "comment",
            read: false,
            sketchId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db
        .collection("sketches")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const sketch = db.doc(`/sketches/${doc.id}`);
            batch.update(sketch, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
  });

exports.onSketchDeleted = functions
  .region("europe-west1")
  .firestore.document("/sketches/{sketchId}")
  .onDelete((snapshot, context) => {
    const sketchId = context.params.sketchId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("sketchId", "==", sketchId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("sketchId", "==", sketchId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("sketchId", "==", sketchId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
