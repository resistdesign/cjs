import Collection from '@resistdesign/cjs';

async function createTodo() {
  const todoContext = {
    title: String,
    description: String,
    createdOn: Date
  };
  // Cyclical, nested items.
  todoContext.childTodos = [todoContext];
  const todos = await Collection.getCollectionStructure({
    name: 'Todos',
    db: 'mongodb://localhost:27017/example-db',
    context: todoContext,
    deleteNested: {
      childTodos: true
    }
  });
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
