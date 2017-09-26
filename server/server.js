require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');

var Todo = require('./models/Todo');

var app = express();
var port = process.env.PORT;

var validateId = mongoose.Types.ObjectId.isValid;

var pick = (origin, ...props) => {
    var toMerge = props.map(
        prop => ({[prop]: origin[prop]})
    );

    return  Object.assign({}, ...toMerge);
}

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Jelou');
});

app.post('/todos', (req, res) => {
    var input = pick(req.body, 'text');
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

app.get('/todos', (req, res) => {

    Todo.find()
        .then(todos => {
            res.send({todos});
        })
        .catch(e => res.status(404).send(e))
    ;

});

app.get('/todos/:id', (req, res) => {

    var {id} = req.params;

    if( !validateId(id) )
        res.status(404).send();

    Todo.findById(id)
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.delete('/todos/:id', (req, res) => {

    var {id} = req.params;

    if( !validateId(id) )
        res.status(404).send();

    Todo.findByIdAndRemove(id)
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.patch('/todos/:id', (req, res) => {

    var {id} = req.params;
    var input = pick(req.body, 'text', 'completed');

    if( !validateId(id) )
        res.status(404).send();

    if( input.completed === true )
        input.completedAt = new Date().getTime();

    else{
        input.completed = false;
        input.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set: input}, {new: true})
        .then(todo => {
            if(!todo)
                res.status(404).send();

            res.send(todo);
        })
        .catch(e => res.status(400).send())
    ;

});

app.listen(port, () => {
    console.log('Running on port', port, '\n');
});

module.exports = {
    app
};