const chai = require('chai');
const request = require('supertest');
const {ObjectID} = require('mongodb');

var {app} = require('./../server');
var Todo = require('./../models/Todo');
var User = require('./../models/User');
var todoSeeder = require('./seeds/todos');
var userSeeder = require('./seeds/users');
var todos = todoSeeder.seeds;
var users = userSeeder.seeds;

var expect = chai.expect;
var errorHandler = e => done(e);

describe('POST /todos', () => {

    beforeEach(todoSeeder.removeAll);

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

    before(todoSeeder.populate);

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

    before(todoSeeder.populate);

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

    before(todoSeeder.populate);

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

    before(todoSeeder.populate);

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

describe('GET /users/me', () => {

    before(userSeeder.populate);

    it('should return user if authenticated', done => {
        var user = users[0];

        request(app)
            .get('/users/me')
            .set('x-auth', user.tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body).to.exist;

                expect(res.body._id)
                    .to.equal(user._id.toHexString());
                
                expect(res.body.email)
                    .to.equal(user.email);
            })
            .end(done)
        ;
    });

    it('should return 401 "Not Authorized" if user not found', done => {
        var userID = new ObjectID().toHexString();
        var newToken = User.generateAuthToken(userID);

        request(app)
            .get('/users/me')
            .set('x-auth', newToken.token)
            .expect(401)
            .expect(res => {
                expect(res.body).to.be.empty;
            })
            .end(done)
        ;
    });

    it('should return 401 "Not Authorized" if not authenticated', done => {

        request(app)
            .get('/users/me')
            .expect(401)
            .expect(res => {
                expect(res.body).to.be.empty;
            })
            .end(done)
        ;
    });
});

describe('POST /users', () => {

    before(userSeeder.populate);

    it('should create user', done => {
        var sampleUser = {
            email: 'userTest@example.com',
            password: '123abc!'
        };

        request(app)
            .post('/users')
            .send(sampleUser)
            .expect(200)
            .expect(res => {
                expect(res.headers['x-auth'])
                    .to.exist
                    .and.to.be.a('string')
                    .that.is.not.empty;
                
                expect(res.body)
                    .to.exist
                    .and.not.be.empty;

                expect(res.body._id)
                    .to.exist
                    .and.to.be.a('string')
                    .that.is.not.empty

                expect(res.body.email)
                    .to.equal(sampleUser.email);

            })
            .end(err => {
                if(err)
                    return done(err);

                User.findOne({email:sampleUser.email})
                    .then(res => {
                        expect(res).to.exist;

                        expect(res.password)
                            .to.not.equal(sampleUser.password);

                        return true;
                    })
                    .then(() => User.remove({email:sampleUser.email}))
                    .then(() => done())
                    .catch(done)
                ;
            })
    });

    it('should not create user with invalid data', done => {
        var sampleUser = {
            email: 'InvalidExampleDotcom',
            password: '123ab'
        };

        request(app)
            .post('/users')
            .send(sampleUser)
            .expect(400)
            .expect(res => {
                expect(res.body).to.be.empty;
            })
            .end(done)
        ;
    });

    it('should not create user with email in use', done => {
        var sampleUser = {
            email: users[0].email,
            password: users[0].password
        };

        request(app)
            .post('/users')
            .send(sampleUser)
            .expect(400)
            .expect(res => {
                expect(res.body).to.be.empty;
            })
            .end(done)
        ;
    });

});
