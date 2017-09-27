const request = require('supertest');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const {ObjectID} = require('mongodb');

const User = require('./../models/User');

const expect = chai.expect;
const secret = '123';

describe('User model ', () => {
    before(done => {
        User.remove({}).then(() => done());
    });

    it('should generate valid token access', () => {
        var hexId = new ObjectID().toHexString();
        
        var tokenObject = User.generateAuthToken(hexId);
        expect(tokenObject).to.be.an('object');
        expect(tokenObject.access).to.be.equal('auth');
        expect(tokenObject.token).to.be.an('string');

        var decoded = jwt.verify(tokenObject.token, secret);
        expect(decoded._id).to.be.equal(hexId);
        expect(decoded.access).to.be.equal('auth');
    });

    it('should return save token access on user', done =>{
        var sampleUser = {
            email: 'userTest@example.com',
            password: '123abc!'
        };

        var user = new User(sampleUser);

        user.save()
            .then(res => {
                expect(res)
                    .to.be.an('object')
                    .which.is.instanceof(User);

                expect(res._id)
                    .to.be.instanceof(ObjectID);

                 return user.saveAuthToken();
            })
            .then(token => {
                expect(token).to.be.a('string');

                var decoded = jwt.verify(token, secret);

                expect(decoded._id).to.be.equal(user._id.toHexString());
                expect(decoded.access).to.be.equal('auth');

                return true;
            })
            .then(res => {
                User.remove({_id: user._id})
                    .then(() => done());
            })
            .catch(e => done(e))
        ;
    });
});
