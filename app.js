const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const listsSchema = {
  name: String,
  list: [itemsSchema],
};

const List = mongoose.model('List', listsSchema);
const day = date.getDate();

app.get('/', function (req, res) {
  Item.find(function (err, itemList) {
    if (err) {
      console.log(err);
    } else {
      res.render('list', { listTitle: day, newListItems: itemList });
    }
  });
});

app.post('/', function (req, res) {
  const item = new Item({
    name: req.body.newItem,
  });

  const listName = req.body.list;

  if (listName == day) {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (!err) {
        foundList.list.push(item);
        foundList.save();
        res.redirect('/' + listName);
      }
    });
  }
});

app.post('/delete', function (req, res) {
  const id = req.body.toDelete;
  const listName = req.body.listName;

  if (listName == day) {
    Item.findByIdAndRemove(id, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully Deleted!');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { list: { _id: id } } },
      function (err, foundList) {
        res.redirect('/' + listName);
      }
    );
  }
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          list: [],
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.list,
        });
      }
    }
  });
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
