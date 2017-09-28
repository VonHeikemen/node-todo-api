const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const secret = '123';

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

function generateAuthToken(hexId) {
    var access = 'auth';
    var token = jwt.sign({
        _id: hexId,
        access
    }, secret).toString();

    return { 
        access, 
        token 
    };
}

UserSchema.methods.toJSON = function () {
    var user = this;

    return _.pick(user.toObject(), ['_id', 'email']);
};

UserSchema.statics.generateAuthToken = generateAuthToken;

UserSchema.methods.newAuthToken = function() {
    var user = this;
    var id = user._id.toHexString();
    var tokenAccess = generateAuthToken(id);

    user.tokens.push(tokenAccess);

    return user.save().then(res => tokenAccess.token);
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

UserSchema.statics.authenticate = function ({email, password}) {
    var User = this;
    var authenticated;

    return User.findOne({email})
        .then(user => {
            if(!user)
                return Promise.reject();

            authenticated = user;
            return bcrypt.compare(password, user.password);
        })
        .then(match => {
                return (match) 
                    ? authenticated 
                    : Promise.reject()
            }
        )
    ;
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