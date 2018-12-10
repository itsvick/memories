const User = require('./../models/user');

const authenticate = function (req, res, next) {
    const token = req.header('x-auth');

    User.findByToken(token)
        .then((user) => {
            if (!user) {
                return Promise.reject();
            }

            req.user = user;
            req.token = token;
            next();
        }).catch((error) => {

            let responseObj = {
                id: 'api.users.login',
                errMessage: 'Unauthorized user',
                responseCode: 401,
                error: error
            };
            res.status(401).send(response.generateErrorResponse(responseObj));
        });
}

module.exports = authenticate;