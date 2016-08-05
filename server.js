var http = require('http');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var crispy = require('crispy-string');

const DEFAULT_LIMIT = 10;
const DEFAULT_SKIP = 0;

class NotFound extends Error {
  constructor() {
    super('Item not found');
    this.name = 'NOT_FOUND';
  }
}

class Database {
  constructor() {
    this.ID_LENGHT = 32;
    this.books = {};
  }

  createBook(book) {
    var data = Object.assign({}, book);
    data.id = crispy.base62String(this.ID_LENGHT);
    this.books[data.id] = data;
    return data;
  }

  deleteBook(id) {
    var book = this.findBookById(id);
    if (!book) throw new NotFound();
    delete this.books[id];
    return book;
  }

  updateBook(id, data) {
    var book = this.findBookById(id);

    if (!book) throw new NotFound();

    var updatedBook = Object.assign(book, data, {id});
    this.books[id] = updatedBook;
    return updatedBook;
  }

  findBookById(id) {
    var book = this.books[id];
    if (!book) return null;
    return book;
  }

  findBooks(skip, limit) {
    return Object.keys(this.books)
      .map(id => this.books[id])
      .slice(skip, skip+limit);
  }

  countBooks() {
    return Object.keys(this.books).length;
  }
}

var database = new Database();
var app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());

app.post('/books', (req, res) => {
  var data = req.body;
  var book = database.createBook(data);
  res.json(book);
});

app.get('/books', (req, res) => {
  var skip = req.query.skip || DEFAULT_SKIP;
  var limit = req.query.limit || DEFAULT_LIMIT;
  var books = database.findBooks(skip, limit);
  var count = database.countBooks();
  res.json({count: count, data: books});
});

app.get('/books/:id', (req, res) => {
  var bookId = req.params.id;
  var book = database.findBookById(bookId);

  if (book) {
    res.json(book);
  } else {
    res.status(404).json({message: 'Not found'});
  }
});

app.put('/books/:id', (req, res) => {
  var bookId = req.params.id;
  var data = req.body;

  try {
    res.json(database.updateBook(bookId, data));
  } catch(error) {
    if (error.name == 'NOT_FOUND') {
      res.status(404).json({message: 'Not found'});
    } else {
      res.status(500).json({message: error.message});
    }
  }
});

app.delete('/books/:id', (req, res) => {
  var bookId = req.params.id;

  try {
    res.json(database.deleteBook(bookId));
  } catch(error) {
    if (error.name == 'NOT_FOUND') {
      res.status(404).json({message: 'Not found'});
    } else {
      res.status(500).json({message: error.message});
    }
  }
});

http.createServer(app).listen(3000, () => {
  /* eslint-disable */
  console.log('Express server started at port 3000!');
  /* eslint-enable */
});
