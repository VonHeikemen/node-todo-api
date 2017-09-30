var mongoose = require('mongoose');

var Todo = mongoose.model('Todo', {
    _author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    text:{
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    completed:{
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    }
});

module.exports = Todo;