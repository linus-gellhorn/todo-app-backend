import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import {
  addDummyDbItems,
  addDbItem,
  getAllDbItems,
  getDbItemById,
  DbItem,
  updateDbItemById,
  deleteDbItemById,
} from "./db";
import filePath from "./filePath";

const client = new Client({ database: "todoApp" });

client.connect();

// loading in some dummy items into the database
// (comment out if desired, or change the number)
addDummyDbItems(20);

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
    res.status(200).json(allTodos.rows);
  } catch (err) {
    console.error(err);
  }
});
// app.get("/todos", (req, res) => {
//   const allTodos = getAllDbItems();
//   res.status(200).json(allTodos);
// });

// Post a todo
app.post("/todos", async (req, res) => {
  try {
    const { description } = req.body;
    const newTodo = await client.query(
      "INSERT INTO todo (description) VALUES ($1) RETURNING *",
      [description]
    );
    res.status(201).json({
      status: "success",
      newTodo: newTodo.rows[0],
    });
  } catch (err) {
    console.error(err);
  }
});
// app.post<{}, {}, DbItem>("/todos", (req, res) => {
//   // to be rigorous, ought to handle non-conforming request bodies
//   // ... but omitting this as a simplification
//   const postData = req.body;
//   const createdTodo = addDbItem(postData);
//   res.status(201).json(createdTodo);
// });

// Get a specific todo
app.get("/todos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const matchingTodo = await client.query(
      "SELECT * FROM todo WHERE id = $1",
      [id]
    );
    res.status(200).json(matchingTodo.rows[0]);
  } catch (err) {
    console.error(err);
  }
});
// app.get<{ id: string }>("/todos/:id", (req, res) => {
//   const matchingTodo = getDbItemById(parseInt(req.params.id));
//   if (matchingTodo === "not found") {
//     res.status(404).json(matchingTodo);
//   } else {
//     res.status(200).json(matchingTodo);
//   }
// });

// Delete a todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deleteTodo = await client.query(
      "DELETE FROM todo WHERE id = $1 RETURNING *",
      [id]
    );
    res.status(200).json(deleteTodo.rows[0]);
  } catch (err) {
    console.error(err);
  }
});
// app.delete<{ id: string }>("/todos/:id", (req, res) => {
//   const matchingTodo = deleteDbItemById(parseInt(req.params.id));
//   if (matchingTodo === "not found") {
//     res.status(404).json(matchingTodo);
//   } else {
//     res.status(200).json(matchingTodo);
//   }
// });

// Update a todo
app.patch("/todos/:id", async (req, res) => {
  const { description } = req.body;
  const id = parseInt(req.params.id);
  const updateTodo = await client.query(
    "UPDATE todo SET description = $1 WHERE id = $2 RETURNING *",
    [description, id]
  );
  res.status(200).json(updateTodo.rows[0]);
});
// app.patch<{ id: string }, {}, Partial<DbItem>>("/todos/:id", (req, res) => {
//   const matchingTodo = updateDbItemById(parseInt(req.params.id), req.body);
//   if (matchingTodo === "not found") {
//     res.status(404).json(matchingTodo);
//   } else {
//     res.status(200).json(matchingTodo);
//   }
// });

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
