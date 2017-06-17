# Collection JS

A JavaScript Database Collection Manager with Context Driven Typing and Relationship Mapping.

## Installation

Run `npm i -S resistdesign-cjs`

## Usage

```js
import Collection from 'resistdesign-cjs';

async function createTodo () {
  const todoContext = {
    title: String,
    description: String,
    createdOn: Date
  };
  const todoConfig = {
    name: 'Todos',
    db: 'mongodb://localhost:27017/example-db',
    context: todoContext,
    deleteNested: {
      childTodos: true
    }
  };
  // Cyclical, nested items.
  todoContext.childTodos = [todoConfig];
  const todos = await Collection.getCollectionStructure(todoConfig);
  const createdOn = new Date();

  return await todos.create([
    {
      title: 'Wash Clothes',
      description: `Get them very clean, you're going to need to look your best! :)`,
      createdOn
    },
    {
      title: 'Jump Rope',
      description: 'Time to stay in shape!',
      createdOn,
      childTodos: [
        {
          title: 'Learn Tricks',
          description: `You'd look silly just hopping up and down like that without a little pizzazz.`,
          createdOn
        }
      ]
    }
  ]);
}

createTodo();
```

## API

View the API documentation [here](http://cjs.resist.design/docs).

## License

MIT
