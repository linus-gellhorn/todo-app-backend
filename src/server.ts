import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import filePath from "./filePath";

const client = new Client({ database: "todoApp" });

client.connect();

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
dotenv.config();

// use the environment variable PORT, or 4000 as a fallback
const PORT_NUMBER = process.env.PORT ?? 4000;

// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// Get all todos
app.get("/todos", async (req, res) => {
  try {
    const allTodos = await client.query("SELECT * FROM todo");
    res.status(200).json({
      status: "success",
      todos: allTodos.rows,
    });
  } catch (err) {
    console.error(err);
  }
});

// Post a todo
app.post("/todos", async (req, res) => {
  const { description } = req.body;
  if (typeof description === "string") {
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
    res.status(200).json(deletedTodo);
  } else {
    res.status(404).json({
      status: "failure",
      message: "Could not find this to-do to delete",
    });
  }
});

// Update a todo
app.patch("/todos/:id", async (req, res) => {
  const { description } = req.body;
  const id = parseInt(req.params.id);
  const updateTodo = await client.query(
    "UPDATE todo SET description = $1 WHERE id = $2 RETURNING *",
    [description, id]
  );
  const updatedTodo = updateTodo.rows[0];
  if (updatedTodo) {
    res.status(200).json(updatedTodo);
  } else {
    res.status(404).json({
      status: "failure",
      message: "Could not find that to-do to update",
    });
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
