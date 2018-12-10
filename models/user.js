const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const joi = require('joi');

const schema = mongoose.Schema;

const userSchema = new schema({
    firstName: {
        type: String,
        required: [true, 'Required firstName'],
        minlength: [5, 'First name should be at least 5 character long'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Required lastName'],
        minlength: [5, 'First name should be at least 5 character long'],
        trim: true
    },
    avatar: {
        type: String,
    },
    birthDate: {
        type: Date,
        required: [true, 'Provide valid date'],
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: Number,
        required: true,
        unique: [true, 'Mobile number is already in use, please try another'],
        minlength: [10, 'Mobile Number should have 10 digit number'],
        trim: true
        // TODO: Add validation for the mobile number and add logic for the mobile number verification by OTP.
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'Email is already in use'],
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: `{VALUE} is not valid email`
        }
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });


userSchema.methods.joiValidate()  = function {
  let schema = {
      firstName: joi.types.String().required
  }
}

userSchema.methods.generateAuthToken = function () {
    let user = this;
    let access = 'auth';

    const token = jwt.sign({ _id: user._id.toHexString(), access }, 'secretKey').toString();

    user.tokens = user.tokens.concat([{ access, token }]);
    return user.save().then(() => {
        return token;
    }).catch((error) => {
        console.log(error);
    });
}

userSchema.statics.findByToken = function (token) {
    let user = this;
    let decoded

    try {
        decoded = jwt.verify(token, 'secretKey');
    } catch (error) {
        return Promise.reject();
    };

    return user.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}

/**
 * Override Return object
 */
userSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();

    const { _id, email, firstName, lastName, address, mobile, birthDate } = userObject;
    return ({ _id, email, firstName, lastName, address, mobile, birthDate });
}

/**
 * Use Mongoose Events - Before save
 */
userSchema.pre('save', function (next) {
    let user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        })
    } else {
        next();
    }
});

userSchema.statics.findByCredentials = function (email, password) {
    let user = this;
    return User.findOne({ email }).then((user) => {
        if (!user) {
            return Promise.reject('Invalid Username');
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject('Invalid password');
                }
            });
        });
    }).catch((error) => {
        return Promise.reject(error);
    });
}

userSchema.methods.removeToken = function (token) {
    let user = this;
    return user.update({
        $pull: {
            tokens: {
                token
            }
        }
    })
}

const User = mongoose.model('User', userSchema);
module.exports = User;