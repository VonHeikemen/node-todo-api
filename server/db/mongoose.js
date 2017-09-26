var mongoose = require('mongoose');

var opts = { 
    useMongoClient: true
};

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, opts);

module.exports = mongoose;