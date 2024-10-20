const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    reportedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Report", reportSchema);
