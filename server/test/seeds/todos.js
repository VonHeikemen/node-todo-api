const {ObjectID} = require('mongodb');
const Todo = require('./../../models/Todo');

const seeds = [
    {
        _id: new ObjectID(),
        text: 'First thing to do'
    },
    {
        _id: new ObjectID(),
        text: 'Second thing to do',
        completed: true,
        completedAt: 123
    }
];

var populate = done => {
    Todo.remove({})
    .then( () =>  {
        Todo.insertMany(seeds)
            .then(() => done())
            .catch(done);
    })
    .catch(done);
};

var removeAll = done => {
    Todo.remove({})
        .then(() => done())
        .catch(done);
}

module.exports = {
    seeds,
    populate,
    removeAll
};