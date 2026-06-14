const { Schema, model } = require("mongoose");

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    coverImageURL: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },

    // ── LIKES FEATURE ──
    // stores array of user IDs who liked this blog
    // e.g. ["507f1f", "507f2a", "507f3b"]
    // using Set prevents same user liking twice
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      }
    ],
  },
  { timestamps: true }
);

const Blog = model("blog", blogSchema);

module.exports = Blog;