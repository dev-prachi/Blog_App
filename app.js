const dotenv= require("dotenv");
const express= require("express");
const path= require("path");
const mongoose = require("mongoose");
const cookieParser= require("cookie-parser");

const Blog = require("./models/blog");

const userRoute= require("./routes/user");
const blogRoute = require("./routes/blog");


const { checkAuthenticationCookie } = require("./middlewares/authentication");

dotenv.config();

const app= express();
const PORT= process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URL)
    .then(()=> console.log("MongoDB Connected!"))
    .catch((err)=>console.log("error occured", err));

// console.log(process.env.MONGO_URL);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());
app.use(checkAuthenticationCookie('token'));
app.use(express.static(path.resolve('./public')));


app.get('/', async(req, res) =>{
    const searchQuery = req.query.search || "";
    
    // Read page number from URL — e.g. /?page=2
    // If no page in URL, default to page 1
    // Number() converts string "2" to number 2
    const page = Number(req.query.page) || 1;
    
    // How many blogs to show per page
    const blogsPerPage = 6;
    
    // How many blogs to skip — page 1 skips 0, page 2 skips 6, page 3 skips 12
    const skip = (page - 1) * blogsPerPage;

    // Build search filter — same as before
    const filter = searchQuery.trim() === ""
        ? {}
        : { title: { $regex: searchQuery, $options: "i" } };

    // Count total blogs matching filter — needed to calculate total pages
    const totalBlogs = await Blog.countDocuments(filter);

    // Calculate total number of pages
    // Math.ceil rounds up — 13 blogs / 6 per page = 2.16 → 3 pages
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    // Fetch only the blogs for current page
    // .skip() skips previous pages' blogs
    // .limit() takes only blogsPerPage number of blogs
    const allBlogs = await Blog.find(filter)
        .populate("createdBy")
        .skip(skip)
        .limit(blogsPerPage)
        .sort({ createdAt: -1 }); // newest blogs first

    const error = req.query.error;
    let errorMessage = null;
    if (error === "notallowed") {
        errorMessage = "You are not allowed to edit or delete this blog.";
    }

    res.render("home", {
        user: req.user,
        blogs: allBlogs,
        errorMessage,
        searchQuery,
        // Pass pagination data to EJS
        currentPage: page,
        totalPages,
        totalBlogs,
    });
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);
app.listen(PORT , ()=> console.log(`Server running on port: ${PORT}`));