const dotenv= require("dotenv");
const express= require("express");
const path= require("path");
const mongoose = require("mongoose");
const cookieParser= require("cookie-parser");

const Blog = require("./models/blog");

const userRoute= require("./routes/user");
const blogRoute = require("./routes/blog");

const { checkAuthenticationCookie } = require("./middlewares/authentication");

const fs = require("fs");
const uploadDir = path.resolve("./public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created!");
}
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
    
    const page = Number(req.query.page) || 1;
    
    const blogsPerPage = 6;
    
    const skip = (page - 1) * blogsPerPage;

    const filter = searchQuery.trim() === ""
        ? {}
        : { title: { $regex: searchQuery, $options: "i" } };

    const totalBlogs = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    const allBlogs = await Blog.find(filter)
        .populate("createdBy")
        .skip(skip)
        .limit(blogsPerPage)
        .sort({ createdAt: -1 }); 

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
        currentPage: page,
        totalPages,
        totalBlogs,
    });
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);
app.listen(PORT , ()=> console.log(`Server running on port: ${PORT}`));