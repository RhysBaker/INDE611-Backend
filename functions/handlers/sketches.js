const { db } = require('../util/admin')

exports.getAllSketches = (req, res) => {
    db.collection('sketches')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let sketches = [];
            data.forEach((doc) => {
                sketches.push({
                    sketchID: doc.id,
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