const {ObjectID} = require('mongodb');
const User = require('./../../models/User');

var seeds= [
    {
        _id: new ObjectID(),
        email: 'userOne@example.com',
        password: '123abc!'
    },
    {
        _id: new ObjectID(),
        email: 'userTwo@example.com',
        password: '123abc!'
    }
];

seeds[0].tokens = [User.generateAuthToken(seeds[0]._id.toHexString())];
seeds[1].tokens = [User.generateAuthToken(seeds[1]._id.toHexString())];

const populate = done => {
    User.remove({})
        .then(() => {

            var users = [];
            for(user of seeds){
                users.push(
                    new User(user).save()
                );
            }

            Promise.all(users)
                .then(() => done())
                .catch(done)
            ;
        })
        .catch(done)
    ;
};

const removeAll = done => {
    User.remove({})
        .then(() => done())
        .catch(done)
    ;
};

module.exports = {
    seeds,
    populate,
    removeAll
};