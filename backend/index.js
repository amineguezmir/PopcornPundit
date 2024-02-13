import express from "express";
import mysql from "mysql";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cookieParser());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "amineGZ99",
  database: "movies",
});

app.get("/profile", (req, res) => {
  const q = "SELECT * FROM profile";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(data);
  });
});

app.put("/profile/:id", (req, res) => {
  const profileId = req.params.id;
  const { username, bio, profilePic, coverPic, topFive } = req.body;

  const q =
    "UPDATE profile SET `username`=?, `bio`=?, `profilepic`=?, `coverpic`=?,`topfive`=? WHERE id = ? ";

  const values = [username, bio, profilePic, coverPic, profileId, topFive];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Profile has been updated successfully" });
  });
});

app.get("/", (req, res) => {
  res.json("hello this is the backend!");
});

app.get("/movies", (req, res) => {
  const q = "SELECT * FROM movies";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/movies/add", (req, res) => {
  const q =
    "INSERT INTO movies(`title`,`review`,`cover`,`rating`,`userid`) VALUES(?)";
  const values = [
    req.body.title,
    req.body.review,
    req.body.cover,
    req.body.rating,
    req.body.userid,
  ];

  db.query(q, [values], (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.delete("/movies/delete/:id", (req, res) => {
  const movieId = req.params.id;
  const q = "DELETE FROM movies WHERE id=?";

  db.query(q, [movieId], (err, data) => {
    return res.json("Movie has been deleted successfully");
  });
});

app.put("/movies/update/:id", (req, res) => {
  const movieId = req.params.id;
  const q =
    "UPDATE movies SET `title`=?,`review`=?,`cover`=?, `rating`=? WHERE id = ? ";

  const values = [
    req.body.title,
    req.body.review,
    req.body.cover,
    req.body.rating,
  ];

  db.query(q, [...values, movieId], (err, data) => {
    return res.json("Movie has been Updated successfully");
  });
});

app.post("/register", (req, res) => {
  const q = "SELECT * FROM profile WHERE username = ?";
  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).send(err);
    if (data.length) return res.status(409).json("User already exists!");
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const q = "INSERT INTO profile (`username`,`password`) VALUES (?)";

    const values = [req.body.username, hashedPassword];
    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("User has been created.");
    });
  });
});

app.post("/login", (req, res) => {
  const q = "SELECT * FROM profile WHERE username =?";
  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found!");

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );
    if (!checkPassword)
      return res.status(400).json("Wrong password or username!");

    const token = jwt.sign({ id: data[0].id }, "secretkey");

    const { password, ...others } = data[0];

    res
      .cookie("accesToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  });
});

app.post("/logout", (req, res) => {
  res
    .clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json("User has been logged out");
});

app.listen(8800, () => {
  console.log("Connected to backend!");
});
