# Blogify — Full Stack Blogging App

A full stack blogging application built with Node.js, Express, MongoDB, and EJS.

## Features
- User authentication (Signup, Signin, Logout)
- Create, Edit, Delete blogs
- AI blog content generator using Google Gemini API
- Like / Unlike blogs
- Search blogs by title
- Pagination
- Role based access control
- Comment on blogs
- Responsive design

## Tech Stack
- **Frontend** — EJS, Bootstrap 5, CSS
- **Backend** — Node.js, Express.js
- **Database** — MongoDB Atlas
- **AI** — Google Gemini API
- **Authentication** — JWT, Cookie Parser

## How to Run Locally

1. Clone the repo
   git clone https://github.com/YOUR_USERNAME/blogify.git

2. Install dependencies
   npm install

3. Create a .env file in root with these values
   MONGO_URL=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_api_key
   PORT=8000

4. Start the server
   node app.js

5. Open browser and go to
   http://localhost:8000