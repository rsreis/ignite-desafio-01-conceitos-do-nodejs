const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const userFound = users.find((user) => user.username === username);
  if (!userFound)
    return response.status(404).json({ error: "Unknown user" });
  request.user = userFound;
  next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const todoFound = request.user.todos.find((todo) => todo.id === id);
  if (!todoFound)
    return response.status(404).json({ error: "Invalid todo" });
  request.todo = todoFound;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);
  if (userAlreadyExists)
    return response.status(400).json({ error: "User already exists" });

  const newUser = { id: uuidv4(), name, username, todos: [] };
  users.push(newUser);
  return response.status(201).json( Object.assign(newUser, ["name", "username", "todos"]) );
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const userTodos = request.user.todos;
  return response.json(userTodos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const todo = { id: uuidv4(), title, deadline: new Date(deadline), done: false, 
    created_at: new Date() };
  request.user.todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { title, deadline } = request.body;
  const todo = request.todo;
  todo.title = title;
  todo.deadline = new Date(deadline);
  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const todo = request.todo;
  todo.done = true;
  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const id = request.todo.id;
  const userTodos = request.user.todos;
  const index = userTodos.findIndex((todo) => todo.id === id);
  userTodos.splice(index, 1);
  return response.status(204).send();
});

module.exports = app;