const { db } = require('../util/admin')

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

exports.postSketch = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'body must not be empty' });
    }

    const newSketch = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };

    db.collection('sketches')
        .add(newSketch)
        .then(doc => {
            res.json({ message: `document ${doc.id} created succesfully` });
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