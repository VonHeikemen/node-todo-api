require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const _ = require('lodash');

var Todo = require('./models/Todo');
var User = require('./models/User');
var {authenticate} = require('./middlewares/authenticate');

var app = express();
var port = process.env.PORT;

var validateId = mongoose.Types.ObjectId.isValid;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Jelou');
});

app.post('/todos', authenticate, (req, res) => {
    var input = _.pick(req.body, ['text']);
    input._author = req.user._id;

    var todo = new Todo(input);

    todo.save()
        .then(result => {
            res.status(200).send(result);
        })
        .catch(e => {
            res.status(400).send(e);
        })
    ;

});

app.get('/todos', authenticate, (req, res) => {

    Todo.find({_author: req.user._id})
        .then(todos => {
            res.send({todos});
        })
        .catch(e => res.status(404).send(e))
    ;

});

app.get('/todos/:id', authenticate, (req, res) => {

    var filter = {
        _id: req.params.id,
        _author: req.user._id
    };

    if( !validateId(filter._id) )
        res.status(404).send();

    Todo.findOne(filter)
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.delete('/todos/:id', authenticate, (req, res) => {

    var filter = {
        _id: req.params.id,
        _author: req.user._id
    };

    if( !validateId(filter._id) )
        res.status(404).send();

    Todo.findOneAndRemove(filter)
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.patch('/todos/:id', authenticate, (req, res) => {

    var filter = {
        _id: req.params.id,
        _author: req.user._id
    };

    var input = _.pick(req.body, ['text', 'completed']);

    if( !validateId(filter._id) )
        res.status(404).send();

    if( input.completed === true )
        input.completedAt = new Date().getTime();

    else{
        input.completed = false;
        input.completedAt = null;
    }

    Todo.findOneAndUpdate(filter, {$set: input}, {new: true})
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.post('/users', (req, res) => {
    var input = _.pick(req.body, ['email', 'password']);
    var user = new User(input);

    user.save()
        .then(res => user.newAuthToken())
        .then(token => {
            res.header('x-auth', token).send(user);
        })
        .catch(e => {
            res.status(400).send();
        })
    ;
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    var input = _.pick(req.body, ['email', 'password']);
    var user;

    User.authenticate(input)
        .then(authUser => {
            user = authUser;
            return authUser.newAuthToken()
        })
        .then(token => {
            res.header('x-auth', token).send(user);
        })
        .catch(e => (
                res.status(400).send()
            )
        )
    ;
});

app.delete('/users/me/logout', authenticate, (req, res) => {
    req.user.removeToken(req.token)
        .then(() => res.send())
        .catch(() => res.status(400).send())
    ;
});

app.listen(port, () => {
    console.log('Running on port', port, '\n');
});

module.exports = {
    app
};