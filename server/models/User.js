const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var secret = '123'; //Doesn't belong in here

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        unique: true,
        validate: {
            validator: val => validator.isEmail(val),
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type:String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});


UserSchema.methods.toJSON = function () {
    var user = this;

    return _.pick(user.toObject(), ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function() {
    var user = this; //An instance of the model
    var access = 'auth';

    var token = jwt.sign({
        _id: user._id.toHexString(),
        access
    }, secret).toString();

    user.tokens.push({access, token});

    return user.save().then(res => token);
};

UserSchema.statics.findByToken = function (token) {
    try {
        var User = this; //the model class
        var decoded = jwt.verify(token, secret);
    } catch (error) {
        return Promise.reject();
    }
    
    return User.findOne({
        '_id': decoded._id,
        'tokens.access': 'auth',
        'tokens.token': token
    });
    
};

UserSchema.pre('save', function(next){
    var user = this;

    if( !user.isModified('password') )
        next();

    bcrypt.hash(user.password, 10)
        .then(hashPass => {
            user.password = hashPass
            next();
        })
    ;
});

var User = mongoose.model('User', UserSchema);
module.exports = User;