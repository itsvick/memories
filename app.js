const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const User = require('./models/user');
const Memory = require('./models/memory');
const authenticate = require('./middleware/authenticate');
const response = require('./utils/response_util');

const app = express();
const port = process.env.port || 3000;

app.use(bodyParser.json());

app.post('/users/register', (req, res) => {
    let { firstName, lastName, birthDate, address, mobile, email, username, password } = req.body;
    const newUser = new User({ firstName, lastName, birthDate, address, mobile, email, username, password });

    let error = newUser.joiValidate({ firstName, lastName, birthDate, address, mobile, email, username, password }).error;

    if (error) {
        let responseObj = {
            id: 'api.users.register',
            errMessage: error.details[0].message,
            responseCode: 400
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
    } else {
        newUser.save()
            .then(() => {
                return newUser.generateAuthToken();
            }).then((token) => {
                res.header('x-auth', token);
                let responseObj = {
                    id: 'api.users.register',
                    responseCode: 200,
                    result: {
                        message: 'User saved successfully'
                    }
                }
                res.send(response.generateSuccessResponse(responseObj));
            })
            .catch((error) => {
                let responseObj = {
                    id: 'api.users.register',
                    errMessage: 'Unable to save user',
                    responseCode: 400,
                    error: error
                };
                res.status(400).send(response.generateErrorResponse(responseObj));
                console.log('Unable to save user', error);
            });
    }
});

app.get('/users', authenticate, (req, res) => {
    User.find().then((users) => {
        let responseObj = {
            id: 'api.users.register',
            responseCode: 200,
            result: users
        }
        res.status(200).send(response.generateSuccessResponse(responseObj));
    }).catch((error) => {
        let responseObj = {
            id: 'api.users',
            errMessage: 'Unable to find users',
            responseCode: 204,
            error: error
        };
        res.status(204).send(response.generateErrorResponse(responseObj));
    });
});

app.get('/users/me', authenticate, (req, res) => {
    let responseObj = {
        id: 'api.users.me',
        responseCode: 200,
        result: req.user
    }
    res.status(200).send(response.generateSuccessResponse(responseObj));
});

app.post('/users/login', (req, res) => {
    const { email, password } = req.body;

    User.findByCredentials(email, password).then((user) => {
        user.generateAuthToken().then((token) => {
            let responseObj = {
                id: 'api.users.login',
                responseCode: 200,
                result: user
            }
            res.header('x-auth', token);
            res.status(200).send(response.generateSuccessResponse(responseObj));
        })
    }).catch((error) => {
        let responseObj = {
            id: 'api.users.login',
            errMessage: 'Unable to login',
            responseCode: 400,
            error: error
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        let responseObj = {
            id: 'api.users.me.token',
            responseCode: 200,
            result: { message: 'User logged out successfully' }
        }
        res.status(200).send(response.generateSuccessResponse(responseObj));

    }).catch(() => {
        let responseObj = {
            id: 'api.users.me.token',
            errMessage: 'Unable to logged out user.',
            responseCode: 400,
            error: error
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
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
        let responseObj = {
            id: 'api.users.me.token',
            responseCode: 200,
            result: doc
        }
        res.status(200).send(response.generateSuccessResponse(responseObj));
    }).catch((error) => {
        let responseObj = {
            id: 'api.posts',
            errMessage: 'Unable to add a post',
            responseCode: 400,
            error: error
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
    });
});

/**
 * Get all post of logged in user
 */
app.get('/posts', authenticate, (req, res) => {
    Memory.find({ _creator: req.user._id }).then((docs) => {

        let responseObj = {
            id: 'api.posts',
            responseCode: 200,
            result: docs
        }
        res.status(200).send(response.generateSuccessResponse(responseObj));
    }).catch((error) => {
        let responseObj = {
            id: 'api.posts',
            errMessage: 'Unable to find posts',
            responseCode: 400,
            error: error
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
    });
});

app.get('/posts/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {
        Memory.findById(id).then((post) => {

            let responseObj = {
                id: 'api.posts.id',
                responseCode: 200,
                result: post
            }
            res.status(200).send(response.generateSuccessResponse(responseObj));
        }).catch((error) => {
            let responseObj = {
                id: 'api.posts',
                errMessage: 'Unable to find post',
                responseCode: 400,
                error: error
            };
            res.status(400).send(response.generateErrorResponse(responseObj));
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


            let responseObj = {
                id: 'api.posts.id',
                responseCode: 200,
                result: doc
            }
            res.status(200).send(response.generateSuccessResponse(responseObj));
        }).catch((error) => {
            let responseObj = {
                id: 'api.posts',
                errMessage: 'Unable to edit post',
                responseCode: 400,
                error: error
            };
            res.status(400).send(response.generateErrorResponse(responseObj));
        });
    } else {
        let responseObj = {
            id: 'api.posts',
            errMessage: 'Unable to find post',
            responseCode: 400,
        };
        res.status(400).send(response.generateErrorResponse(responseObj));
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


            let responseObj = {
                id: 'api.posts.id',
                responseCode: 200,
                result: { message: 'Post Deleted successfully' }
            }
            res.status(200).send(response.generateSuccessResponse(responseObj));
        }).catch((error) => {
            let responseObj = {
                id: 'api.posts',
                errMessage: 'Unable to delete post',
                responseCode: 400,
                error: error
            };
            res.status(400).send(response.generateErrorResponse(responseObj));
        });
    } else {
        res.status(400).send();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});