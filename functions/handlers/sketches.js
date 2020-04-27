const { db } = require('../util/admin')


//fetch all sketches
exports.getAllSketches = (req, res) => {
    db.collection('sketches')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let sketches = [];
            data.forEach((doc) => {
                sketches.push({
                    sketchId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(sketches);
        })
        .catch(err => console.error(err));
}


//post one sketch
exports.postSketch = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'body must not be empty' });
    }

    const newSketch = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db.collection('sketches')
        .add(newSketch)
        .then(doc => {
            const resSketch = newSketch;
            resSketch.sketchId = doc.id
            res.json(resSketch);
        })
        .catch(err => {
            res.status(500).json({ error: 'somthing went wrong' });
            console.error(err);
        })
}

//fetch one sketch
exports.getSketch = (req, res) => {
    let sketchData = {};

    db.doc(`/sketches/${req.params.sketchId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Sketch not found' })
            }
            sketchData = doc.data();
            sketchData.sketchId = doc.id;
            return db.collection('comments').orderBy('createdAt', 'desc').where('sketchId', '==', req.params.sketchId).get();
        })
        .then(data => {
            sketchData.comments = [];
            data.forEach(doc => {
                sketchData.comments.push(doc.data())
            });
            return res.json(sketchData)
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code })
        })
};

// Comment on a sketch
exports.commentOnSketch = (req, res) => {
    if (req.body.body.trim() === '')
        return res.status(400).json({ comment: 'Must not be empty' });

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        sketchId: req.params.sketchId,
        userHandle: req.user.handle,
        imageUrl: req.user.imageUrl
    };
    console.log(newComment);

    db.doc(`/sketches/${req.params.sketchId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'sketch not found' });
            }
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            res.json(newComment);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
};

//like sketch
exports.likeSketch = (req, res) => {
    const likeDoc = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('sketchId', '==', req.params.sketchId).limit(1);

    const sketchDoc = db.doc(`sketches/${req.params.sketchId}`);

    let sketchData;

    sketchDoc.get()
        .then((doc) => {
            if (doc.exists) {
                sketchData = doc.data();
                sketchData.sketchId = doc.id;
                return likeDoc.get();
            } else {
                return res.status(404).json({ error: "sketch not found" });
            }
        })
        .then((data) => {
            if (data.empty) {
                return db.collection('likes').add({
                    sketchId: req.params.sketchId,
                    userHandle: req.user.handle
                })
                    .then(() => {
                        sketchData.likeCount++;
                        return sketchDoc.update({ likeCount: sketchData.likeCount });
                    })
                    .then(() => {
                        return res.json(sketchData);
                    });
            } else {
                return res.status(400).json({ error: 'Sketch already liked' });
            }
        })
        .catch((err) => {
            console.error(err)
            res.status(500).json({ error: err.code });
        });
};

//unlike sketch
exports.unlikeSketch = (req, res) => {
    const likeDoc = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('sketchId', '==', req.params.sketchId).limit(1);

    const sketchDoc = db.doc(`sketches/${req.params.sketchId}`);

    let sketchData;

    sketchDoc.get()
        .then((doc) => {
            if (doc.exists) {
                sketchData = doc.data();
                sketchData.sketchId = doc.id;
                return likeDoc.get();
            } else {
                return res.status(404).json({ error: "sketch not found" });
            }
        }).then((data) => {
            if (data.empty) {
                return res.status(400).json({ error: 'Sketch not liked' });
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        sketchData.likeCount--;
                        return sketchDoc.update({ likeCount: sketchData.likeCount })
                    })
                    .then(() => {
                        res.json(sketchData);
                    })
            }
        })
        .catch((err) => {
            console.error(err)
            res.status(500).json({ error: err.code });
        })
};

//delete sketch
exports.deleteSketch = (req, res) => {
    const document = db.doc(`/sketches/${req.params.sketchId}`);
    document.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Sketch not found' });
            }
            if (doc.data().userHandle !== req.user.handle) {
                res.status(403).json({ error: 'Unauthorized' })
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'sketch deleted successfully' })
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: error.code })
        })
}