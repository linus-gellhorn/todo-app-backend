import express from "express";
import cors from "cors";
import { Client } from "pg";
import { config } from "dotenv";
import filePath from "./filePath";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// Get all todos
app.get("/todos", async (req, res) => {
  const allTodos = await client.query(
    "SELECT * FROM todo ORDER BY creation_date"
  );
  res.status(200).json({
    status: "success",
    todos: allTodos.rows,
  });
});

// Post a todo
app.post("/todos", async (req, res) => {
  const { description } = req.body;
  if (typeof description === "string") {
    if (description.length > 0) {
      const newTodo = await client.query(
        "INSERT INTO todo (description) VALUES ($1) RETURNING *",
        [description]
      );
      res.status(201).json({
        status: "success",
        newTodo: newTodo.rows[0],
      });
    } else {
      res.status(400).json({
        status: "failure",
        message: "A to-do must not be empty",
      });
    }
  } else {
    res.status(400).json({
      status: "failure",
      message: "A to-do must be a string",
    });
  }
});

// Get a specific todo
app.get("/todos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const matchingTodo = await client.query("SELECT * FROM todo WHERE id = $1", [
    id,
  ]);
  const matchedTodo = matchingTodo.rows[0];
  if (matchedTodo) {
    res.status(200).json({ status: "success", matchedTodo });
  } else {
    res.status(404).json({
      status: "failure",
      message: "Could not find a to-do for this id",
    });
  }
});

// Delete a todo
app.delete("/todos/:id", async (req, res) => {
  const id = req.params.id;
  const deleteTodo = await client.query(
    "DELETE FROM todo WHERE id = $1 RETURNING *",
    [id]
  );
  const deletedTodo = deleteTodo.rows[0];
  if (deletedTodo) {
    res.status(200).json({
      status: "success",
      deleted: deletedTodo,
    });
  } else {
    res.status(404).json({
      status: "failure",
      message: "Could not find this to-do to delete",
    });
  }
});

// Update a todo
app.patch("/todos/:id", async (req, res) => {
  const { description, completed } = req.body;
  const id = parseInt(req.params.id);

  // edit description
  if (description) {
    const updateTodo = await client.query(
      "UPDATE todo SET description = $1 WHERE id = $2 RETURNING *",
      [description, id]
    );
    const updatedTodo = updateTodo.rows[0];
    if (updatedTodo) {
      res.status(200).json({
        status: "success",
        newTodo: updatedTodo,
      });
    } else {
      res.status(404).json({
        status: "failure",
        message: "Could not find that to-do to update",
      });
    }
  }

  // edit completion status
  if (typeof completed === "boolean") {
    const updateTodo = await client.query(
      "UPDATE todo SET completed = $1 WHERE id = $2 RETURNING *",
      [completed, id]
    );
    const updatedTodo = updateTodo.rows[0];
    if (updatedTodo) {
      res.status(200).json({
        status: "success",
        newTodo: updatedTodo,
      });
    } else {
      res.status(404).json({
        status: "failure",
        message: "Could not find that to-do to update",
      });
    }
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
