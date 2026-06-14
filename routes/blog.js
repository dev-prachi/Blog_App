const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// ── Multer storage config ──────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// ── Layer 1 — requireLogin middleware ──────────────────────
// Add this once here — reuse on every protected route below
function requireLogin(req, res, next) {
  if (!req.user) {
    // User is not logged in — send to signin page
    return res.redirect("/user/signin");
  }
  next(); // User is logged in — continue to route handler
}

// ── SPECIFIC ROUTES FIRST (before /:id) ───────────────────

router.get("/add-new", requireLogin, (req, res) => {
  return res.render("addBlog", { user: req.user });
});

router.get("/edit/:id", requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.redirect("/");

  // Only creator can edit — redirect others with error
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.redirect("/?error=notallowed");
  }

  return res.render("editBlog", { user: req.user, blog });
});

router.post("/generate-ai", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Write a blog post about: "${topic}".
Return ONLY in this exact format with no extra text:
TITLE: <the blog title here, maximum 80 characters>
BODY: <the full blog content here, at least 3 paragraphs>`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const title = text.split("BODY:")[0].replace("TITLE:", "").trim().substring(0, 100);
  const body  = text.split("BODY:")[1]?.trim();

  return res.json({ title, body });
});

router.post("/comment/:blogId", requireLogin, async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/delete/:id", requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.redirect("/");

  // Only creator can delete
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.redirect("/?error=notallowed");
  }

  await Comment.deleteMany({ blogId: req.params.id });
  await Blog.findByIdAndDelete(req.params.id);
  return res.redirect("/");
});

router.post("/edit/:id", requireLogin, upload.single("coverImage"), async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.redirect("/");

  // Only creator can edit
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.redirect("/?error=notallowed");
  }

  blog.title = req.body.title;
  blog.body  = req.body.body;

  if (req.file) {
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }

  await blog.save();
  return res.redirect(`/blog/${blog._id}`);
});

router.post("/", requireLogin, upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;

  if (!title || !title.trim() || !body || !body.trim()) {
    return res.render("addBlog", {
      user: req.user,
      error: "Title and Body are required fields.",
    });
  }

  const coverImageURL = req.file
    ? `/uploads/${req.file.filename}`
    : `/images/default.png`;

  const blog = await Blog.create({
    body: body.trim(),
    title: title.trim(),
    createdBy: req.user._id,
    coverImageURL,
  });
  return res.redirect(`/blog/${blog._id}`);
});

// ── DYNAMIC /:id ROUTE LAST ────────────────────────────────
// Must be at bottom — matches ANY string so must come after all specific routes

router.post("/like/:id", requireLogin, async (req, res) => {
  // Find the blog by its ID
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.redirect("/");
  const alreadyLiked = blog.likes.includes(req.user._id.toString());
  if (alreadyLiked) {
     blog.likes.pull(req.user._id);
  } else {
    blog.likes.push(req.user._id);
  }
  await blog.save();
 return res.redirect(req.headers.referer || "/");
});


router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

module.exports = router;