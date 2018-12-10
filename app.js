const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const User = require('./models/user');
const Memory = require('./models/memory');
const authenticate = require('./middleware/authenticate');

const app = express();
const port = process.env.port || 3000;

app.use(bodyParser.json());

app.post('/users/register', (req, res) => {
    console.log("request", req.body);
    let { firstName, lastName, birthDate, address, mobile, email, username, password } = req.body;
    console.log("TypeOFMobile", typeof mobile);
    const newUser = new User({ firstName, lastName, birthDate, address, mobile, email, username, password });

    newUser.save()
        .then(() => {
            return newUser.generateAuthToken();
        }).then((token) => {
            res.header('x-auth', token);
            res.send({ message: 'User saved successfully' });
        })
        .catch((error) => {
            res.status(400).send(error);
            console.log('Unable to save user', error);
        });
});

app.get('/users', authenticate, (req, res) => {
    User.find().then((users) => {
        res.status(200).send(users);
    }).catch((error) => {
        res.status(403).send({ message: 'Unable to find users' })
    });
});

app.get('/users/me', authenticate, (req, res) => {
    res.status(200).send(req.user);
});

app.post('/users/login', (req, res) => {
    const { email, password } = req.body;

    User.findByCredentials(email, password).then((user) => {
        user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        })
    }).catch((error) => {
        res.status(400).send({ message: error });
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send({ message: 'User logged out successfully' });
    }).catch(() => {
        res.status(400).send({ message: 'Unable to logged out user.' });
    });
});

/**
 * Add new post
 */
app.post('/posts', authenticate, (req, res) => {
    const { title, description } = req.body;
    let images = [];
    if (req.body.hasOwnProperty('images')) {
        images = req.body.images;
    }

    let newPost = new Memory({ title, description, images, _creator: req.user._id });

    newPost.save().then((doc) => {
        res.status(200);
        res.send(doc);
    }).catch((error) => {
        res.status(400, `Unable to add a post ${error}`);
    });
});

/**
 * Get all post of logged in user
 */
app.get('/posts', authenticate, (req, res) => {
    Memory.find({ _creator: req.user._id }).then((docs) => {
        res.send(200, docs);
    }).catch((error) => {
        res.send(400, 'Unable to find posts');
    });
});

app.get('/posts/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {
        Memory.findById(id).then((post) => {
            res.send(200, post);
        }).catch((error) => {
            res.send(400, 'Unable to find post.');
        });
    } else {
        res.send(404);
    }
});

app.patch('/posts/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {

        const { title, description } = req.body;
        let images = [];
        if (req.body.hasOwnProperty('images')) {
            images = req.body.images;
        }
        Memory.findByIdAndUpdate(id, { title, description, images }, { new: true }).then((doc) => {
            res.status(200).send(doc);
        }).catch((error) => {
            res.status(400).send('Unable to edit', error);
        });
    } else {
        res.status(400).send();
    }
});

app.delete('/posts/:id', authenticate, (req, res) => {
    const id = req.params.id;
    if (mongoose.Types.ObjectId.isValid(id)) {
        Memory.findByIdAndRemove(id).then((doc) => {
            console.log("doc=> ", doc);
            if (!doc) {
                res.status(403).send({ message: 'Unable to find post with given Id' });
            }
            res.status(200).send({ message: 'Post Deleted successfully' });
        }).catch((error) => {
            res.status(400).send();
        });
    } else {
        res.status(400).send();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});