const chai = require('chai');
const request = require('supertest');
const {ObjectID} = require('mongodb');

var {app} = require('./../server');
var Todo = require('./../models/Todo');

var expect = chai.expect;
var errorHandler = e => done(e);
var seedCollection = done => {
    Todo.remove({})
    .then( () =>  {
        Todo.insertMany(todos)
            .then(() => done())
            .catch(errorHandler);
    })
    .catch(errorHandler);
};

const todos = [
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



describe('POST /todos', () => {

    beforeEach(done => {
        Todo.remove({})
            .then( () => done() )
            .catch(errorHandler);
    });

    it('should create new todo', done => {
        var text = 'Something to do';

        request(app)
            .post('/todos')
            .send({
                text
            })
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.be.an('object')
                    .with.own.property('text')
                    .to.be.equal(text)
                ;
            })
            .end((err, res) => {
                if(err)
                    return done(err);

                Todo.findById(res.body._id)
                    .then(doc => {
                        expect(doc.text).to.equal(text);
                        expect(doc.completed).to.be.false;
                        done();
                    })
                    .catch(errorHandler)
                ;
            })
        ;
    });

    it('should not create todo with empty text data', done => {

        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .expect(res => {
                expect(res.body)
                    .to.be.an('object')
                    .with.nested.property('errors.text.message')
                    .to.be.equal('Path `text` is required.')
                ;
            })
            .end((err, res) => {
                if(err)
                    return done(err);

                Todo.find()
                    .then(todos => {
                        expect(todos)
                            .to.have.lengthOf(0);
                        
                        done();
                    })
                    .catch(errorHandler)
                ;
            })
        ;
    });
});

describe('GET /todos', () => {

    before(seedCollection);

    it('should list all todos', done => {

        request(app)
            .get('/todos')
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.have.property('todos')
                    .which.is.an('array')
                    .with.lengthOf(2);
            })
            .end(done)
        ;
    });
});

describe('GET /todos/:id', () => {

    before(seedCollection);

    it('should return a todo', done => {
        var doc = todos[0];
        var docId = doc._id.toHexString();

        request(app)
            .get(`/todos/${docId}`)
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.be.an('object')
                    .that.has.property('text')
                    .that.equal(doc.text)
            })
            .end(done)
        ;
    });

    it('should return 404 "Not Found" if id is invalid', done => {
        request(app)
            .get('/todos/123')
            .expect(404)
            .end(done)
        ;
    });

    it('should return 404 "Not Found" if id is not found', done => {
        var docId = new ObjectID().toHexString();

        request(app)
            .get(`/todos/${docId}`)
            .expect(404)
            .end(done)
        ;
    });
});

describe('DELETE /todos/:id', () => {

    before(seedCollection);

    it('should remove a todo', done => {
        var doc = todos[0];
        var docId = doc._id.toHexString();

        request(app)
            .delete(`/todos/${docId}`)
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.be.an('object')
                    .that.has.property('_id')
                    .that.equal(docId)
            })
            .end((err, res) => {
                if(err)
                    return done(err);

                Todo.findById(docId)
                    .then(doc => {
                        expect(doc).to.be.null;
                        done();
                    })
                ;
            })
        ;
    });

    it('should return 404 "Not Found" if id is invalid', done => {
        request(app)
            .delete('/todos/123')
            .expect(404)
            .end(done)
        ;
    });

    it('should return 404 "Not Found" if id is not found', done => {
        var docId = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${docId}`)
            .expect(404)
            .end(done)
        ;
    });
});

describe('PATCH /todos/:id', () => {

    before(seedCollection);

    it('should update todo', done => {
        var doc = todos[0];
        var docId = doc._id.toHexString();

        var input = {
            text: 'New Text from test',
            completed: true
        };

        request(app)
            .patch(`/todos/${docId}`)
            .send(input)
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.be.an('object');

                expect(res.body)
                    .to.have.property('text')
                    .that.is.equal(input.text);

                expect(res.body)
                    .to.have.property('completed')
                    .that.is.true;

                expect(res.body)
                    .to.have.property('completedAt')
                    .that.is.a('number');
            })
            .end(done)
        ;
    });

    it('should clear completedAt when todo is not completed', done => {
        var doc = todos[1];
        var docId = doc._id.toHexString();

        var input = {
            completed: false
        };

        request(app)
            .patch(`/todos/${docId}`)
            .send(input)
            .expect(200)
            .expect(res => {
                expect(res.body)
                    .to.have.property('completedAt')
                    .to.be.null;
            })
            .end(done)
        ;
    });

});
