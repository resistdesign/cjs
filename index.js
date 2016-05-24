import { MongoClient, ObjectID } from 'mongodb';

const escapeRegex = (value) => {
  return value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const processQueryCondition = async(queryCondition, collection) => {
  const newQueryCondition = {};

  if (queryCondition instanceof Object) {
    const context = collection.context;
    const { field, operator, value } = queryCondition;
    const targetField = field === 'id' ? '_id' : field;
    const resolvedOperator = Collection.QUERY_OPERATORS[operator];
    const type = context[field];

    let newOperationDescriptor;

    if (field !== 'id' && !context.hasOwnProperty(field)) {
      throw Collection.ERROR_PROCESSORS.INVALID_QUERY_FIELD(field);
    }

    if (!(resolvedOperator instanceof Function)) {
      throw Collection.ERROR_PROCESSORS.INVALID_QUERY_OPERATOR(operator);
    }

    if (type instanceof Collection) {
      const ids = (await type.search(value, {
        onlyIds: true
      })).data;

      if (ids instanceof Array && ids.length) {
        newOperationDescriptor = {
          $in: ids.map(item => item.id)
        };
      } else {
        return undefined;
      }
    } else if (type instanceof Array && type[0] instanceof Collection) {
      const nestedType = type[0];
      const ids = (await nestedType.search(value, {
        onlyIds: true
      })).data;

      if (ids instanceof Array && ids.length) {
        newOperationDescriptor = {
          $in: ids.map(item => item.id)
        };
      } else {
        return undefined;
      }
    } else if (
      !(value.constructor instanceof Function && value.constructor === Object) && !(value.constructor instanceof Function && value.constructor === Array)
    ) {
      newOperationDescriptor = resolvedOperator(field === 'id' ? ObjectID(value) : value);
    } else {
      throw Collection.ERROR_PROCESSORS.INVALID_QUERY_VALUE(value);
    }

    newQueryCondition[targetField] = newOperationDescriptor;
  } else {
    throw Collection.ERROR_PROCESSORS.INVALID_QUERY_STRUCTURE();
  }

  return newQueryCondition;
};

const processQueryScenario = async(queryScenario, collection) => {
  const newConditions = [];
  const newScenario = { $and: newConditions };

  let errors;

  if (queryScenario instanceof Array) {
    for (let i = 0; i < queryScenario.length; i++) {
      try {
        const condition = queryScenario[i];
        const newCondition = await processQueryCondition(condition, collection);

        if (typeof newCondition !== 'undefined') {
          newConditions.push(newCondition);
        } else {
          return undefined;
        }
      } catch (error) {
        errors = errors || {};
        errors[i] = error;
      }
    }
  } else {
    throw Collection.ERROR_PROCESSORS.INVALID_QUERY_STRUCTURE();
  }

  if (errors) {
    throw errors;
  }

  return newScenario;
};

const processQuery = async(query, collection) => {
  const newScenarios = [];
  const newQuery = {};

  let errors;

  if (query instanceof Array) {
    for (let i = 0; i < query.length; i++) {
      try {
        const scenario = query[i];
        const newScenario = await processQueryScenario(scenario, collection);

        if (typeof newScenario !== 'undefined') {
          newQuery.$or = newScenarios;
          newScenarios.push(newScenario);
        }
      } catch (error) {
        errors = errors || {};
        errors[i] = error;
      }
    }
  } else {
    throw Collection.ERROR_PROCESSORS.INVALID_QUERY_STRUCTURE();
  }

  if (errors) {
    throw errors;
  }

  return newQuery;
};

export default class Collection {
  static QUERY_OPERATORS = {
    EQUAL_TO: (value) => {
      return {
        $eq: value
      };
    },
    NOT_EQUAL_TO: (value) => {
      return {
        $ne: value
      };
    },
    GREATER_THAN: (value) => {
      return {
        $gt: value
      };
    },
    GREATER_THAN_OR_EQUAL_TO: (value) => {
      return {
        $gte: value
      };
    },
    LESS_THAN: (value) => {
      return {
        $lt: value
      };
    },
    LESS_THAN_OR_EQUAL_TO: (value) => {
      return {
        $lte: value
      };
    },
    CONTAINS: (value) => {
      return {
        $regex: `.*${escapeRegex(value)}.*`,
        $options: 'i'
      };
    },
    DOES_NOT_CONTAIN: (value) => {
      return {
        $not: {
          $regex: `.*${escapeRegex(value)}.*`,
          $options: 'i'
        }
      };
    },
    STARTS_WITH: (value) => {
      return {
        $regex: `^${escapeRegex(value)}`,
        $options: 'i'
      };
    },
    DOES_NOT_START_WITH: (value) => {
      return {
        $not: {
          $regex: `^${escapeRegex(value)}`,
          $options: 'i'
        }
      };
    },
    ENDS_WITH: (value) => {
      return {
        $regex: `${escapeRegex(value)}$`,
        $options: 'i'
      };
    },
    DOES_NOT_END_WITH: (value) => {
      return {
        $not: {
          $regex: `${escapeRegex(value)}$`,
          $options: 'i'
        }
      };
    },
    EMPTY: (value) => {
      return {
        $not: {
          $exists: true
        }
      };
    },
    NOT_EMPTY: (value) => {
      return {
        $exists: true
      };
    }
  };

  static METHODS = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    SEARCH: 'SEARCH'
  };

  static ERROR_PROCESSORS = {
    TYPE: (fieldName, dataType) => {
      return {
        type: 'TYPE_ERROR',
        fieldName,
        dataType
      };
    },
    INVALID_ITEM: () => {
      return {
        type: 'INVALID_ITEM_ERROR'
      };
    },
    DB: type => {
      return {
        type: `DB_${type}_ERROR`
      };
    },
    INVALID_ITEM_ID: (id) => {
      return {
        type: 'INVALID_ITEM_ID_ERROR',
        id
      };
    },
    INVALID_QUERY_STRUCTURE: () => {
      return {
        type: 'INVALID_QUERY_STRUCTURE'
      };
    },
    INVALID_QUERY_FIELD: (field) => {
      return {
        type: 'INVALID_QUERY_FIELD',
        field
      };
    },
    INVALID_QUERY_OPERATOR: (operator) => {
      return {
        type: 'INVALID_QUERY_OPERATOR',
        operator
      };
    },
    INVALID_QUERY_VALUE: (value) => {
      return {
        type: 'INVALID_QUERY_VALUE',
        value
      };
    }
  };

  static async getCollectionStructure(config) {
    const { name, context, db } = config;
    const newContext = { ...context };

    for (let k in context) {
      const type = context[k];

      if (type instanceof Array && type[0] instanceof Object) {
        const nestedConfig = type[0];

        newContext[k] = [await Collection.getCollectionStructure(nestedConfig)];
      } else if (type && type.constructor === Object) {
        newContext[k] = await Collection.getCollectionStructure(type);
      }
    }

    const newCollection = await new Collection(name, newContext, await Collection.getDb(db)).init();
    newCollection.deleteNested = config.deleteNested;

    return newCollection;
  }

  static async getDb(url) {
    return await new Promise((res, rej) => {
      MongoClient.connect(url, {
        server: {
          auto_reconnect: true
        }
      }, function (err, db) {
        if (err) {
          rej(err);
        } else {
          res(db);
        }
      });
    });
  }

  static async getCollection(name, db) {
    return await new Promise((res, rej) => {
      db.collection(name, (err, collection) => {
        if (err) {
          rej(err);
        } else {
          res(collection);
        }
      })
    });
  }

  static getCleanItem(item, context) {
    const newItem = {};

    if (item instanceof Object && item.hasOwnProperty('id')) {
      newItem.id = item.id;
    }

    if (item instanceof Object && context instanceof Object) {
      for (let k in context) {
        if (item.hasOwnProperty(k)) {
          const value = item[k];
          const type = context[k];

          if (type instanceof Collection) {
            if (value instanceof Object || value === undefined) {
              newItem[k] = value;
            } else {
              throw Collection.ERROR_PROCESSORS.TYPE(k, 'Object');
            }
          } else if (type instanceof Array && type[0] instanceof Collection) {
            if (value instanceof Array || value === undefined) {
              newItem[k] = value;
            } else {
              throw Collection.ERROR_PROCESSORS.TYPE(k, 'Array');
            }
          } else if (
            value instanceof type ||
            (value.constructor instanceof Function && value.constructor === type)
          ) {
            newItem[k] = value;
          } else if (type === Date) {
            try {
              newItem[k] = value ? new Date(value) : value;
            } catch (error) {
              throw Collection.ERROR_PROCESSORS.TYPE(k, type.name);
            }
          } else {
            throw Collection.ERROR_PROCESSORS.TYPE(k, type.name);
          }
        }
      }
    }

    return newItem;
  }

  static getCleanItems(items, context) {
    const newItems = [];

    let errors;

    if (items instanceof Array) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        try {
          newItems.push(Collection.getCleanItem(item, context));
        } catch (error) {
          errors = errors || {};
          errors[i] = error;
        }
      }
    }

    if (errors) {
      throw errors;
    }

    return newItems;
  }

  static async save(items, collection, update, loadData) {
    const context = collection.context;

    let data;
    // Clean data.
    if (items instanceof Array) {
      data = Collection.getCleanItems(items, context);
    } else if (items instanceof Object) {
      data = Collection.getCleanItem(items, context);
    } else {
      throw Collection.ERROR_PROCESSORS.INVALID_ITEM();
    }

    if (data instanceof Array) {
      const saveMethod = loadData ?
        (items) => {
          return Collection.save(items, collection, false, true);
        } :
        update ? collection.update : collection.create;
      const newItemIds = [];
      let errors;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        try {
          newItemIds.push(await saveMethod(item));
        } catch (error) {
          errors = errors || {};
          errors[i] = error;
        }
      }

      if (errors) {
        throw errors;
      }

      return newItemIds;
    } else {
      if (update && (!data.hasOwnProperty('id') || typeof data.id !== 'string')) {
        throw Collection.ERROR_PROCESSORS.INVALID_ITEM_ID(data.id);
      }

      if (!update && data.hasOwnProperty('id')) {
        if (loadData) {
          data._id = ObjectID(data.id);
        }

        delete data.id;
      }

      if (update) {
        await Collection.deleteNested(data.id, collection, data);
      }

      for (let k in data) {
        const type = collection.context[k];
        const value = data[k];

        let errors;

        if (type instanceof Collection) {
          const nestedUpdate = value instanceof Object && value.hasOwnProperty('id');
          const saveValue = loadData ?
            (items) => {
              return Collection.save(items, type, false, true);
            } :
            nestedUpdate ? ::type.update : ::type.create;

          try {
            data[k] = typeof value === 'undefined' ? undefined : (await saveValue(value)).id;
          } catch (error) {
            errors = errors || {};
            errors[k] = error;
          }
        } else if (
          type instanceof Array &&
          type[0] instanceof Collection &&
          value instanceof Array
        ) {
          const nestedCollection = type[0];
          const newDataValue = [];

          let nestedErrors;

          for (let i = 0; i < value.length; i++) {
            const nestedValue = value[i];
            const nestedUpdate = nestedValue instanceof Object && nestedValue.hasOwnProperty('id');

            const saveValue = loadData ?
              (items) => {
                return Collection.save(items, nestedCollection, false, true);
              } :
              nestedUpdate ? ::nestedCollection.update : ::nestedCollection.create;

            try {
              newDataValue.push((await saveValue(nestedValue)).id);
            } catch (error) {
              nestedErrors = nestedErrors || {};
              nestedErrors[i] = error;
            }
          }

          if (nestedErrors) {
            errors = errors || {};
            errors[k] = nestedErrors;
          }

          data[k] = newDataValue;
        }

        if (errors) {
          throw errors;
        }
      }

      return await new Promise((res, rej) => {
        const callBack = (err, result) => {
          if (err) {
            console.log('UPDATE ERROR:', err);
            const methodName = update ? Collection.METHODS.UPDATE : Collection.METHODS.CREATE;

            rej(Collection.ERROR_PROCESSORS.DB(methodName));
          } else {
            res({
              id: update ? data.id : result.insertedId.toString()
            });
          }
        };

        let cursor;

        if (update) {
          const modifiers = {};

          // TRICKY: Clean undefined values and don't use modifiers if there are none.
          for (let k in data) {
            if (data.hasOwnProperty(k) && k !== 'id') {
              if (typeof data[k] === 'undefined') {
                modifiers.$unset = modifiers.$unset || {};
                modifiers.$unset[k] = '';
              } else {
                modifiers.$set = modifiers.$set || {};
                modifiers.$set[k] = data[k];
              }
            }
          }

          cursor = collection.collection.updateOne(
            { _id: ObjectID(data.id) },
            modifiers,
            callBack
          );
        } else {
          // TRICKY: Clean undefined values.
          for (let k in data) {
            if (data.hasOwnProperty(k) && typeof data[k] === 'undefined') {
              delete data[k];
            }
          }

          cursor = collection.collection.insertOne(data, callBack);
        }
      });
    }
  }

  static async deleteNested(id, collection, updatedItem) {
    if (collection.deleteNested instanceof Object) {
      const context = collection.context;
      const item = await collection.read(id);

      let nestedErrors;

      for (let k in collection.deleteNested) {
        if (
          collection.deleteNested.hasOwnProperty(k) &&
          item.hasOwnProperty(k) &&
          (
            !updatedItem ||
            (
              updatedItem instanceof Object &&
              updatedItem.hasOwnProperty(k)
            )
          ) &&
          collection.deleteNested[k] &&
          context.hasOwnProperty(k) &&
          (
            context[k] instanceof Collection ||
            (
              context[k] instanceof Array &&
              context[k].length &&
              context[k][0] instanceof Collection
            )
          )
        ) {
          const value = item[k];
          // TRICKY: Remove missing nested items for an updated item.
          const updatedValue = updatedItem instanceof Object && updatedItem[k];

          if (value instanceof Array && context[k] instanceof Array) {
            const nestedCollection = context[k][0];
            const remainingIdMap = {};

            if (updatedValue instanceof Array) {
              for (let i = 0; i < updatedValue.length; i++) {
                const newItem = updatedValue[i];

                if (newItem instanceof Object && typeof newItem.id === 'string') {
                  remainingIdMap[newItem.id] = true;
                }
              }
            }

            let errors;

            for (let i = 0; i < value.length; i++) {
              const item = value[i];

              if (!remainingIdMap[item.id]) {
                try {
                  await nestedCollection.delete(item.id);
                } catch (error) {
                  errors = errors || {};
                  errors[i] = error;
                }
              }
            }

            if (errors) {
              nestedErrors = nestedErrors || {};
              nestedErrors[k] = errors;
            }
          } else if (value instanceof Object && context[k] instanceof Collection) {
            const nestedCollection = context[k];

            if (!updatedValue || !updatedValue.id === value.id) {
              try {
                await nestedCollection.delete(value.id);
              } catch (error) {
                nestedErrors = nestedErrors || {};
                nestedErrors[k] = error;
              }
            }
          }
        }
      }

      if (nestedErrors) {
        throw nestedErrors;
      }
    }
  }

  name;
  context;
  db;
  collection;
  deleteNested;

  constructor(name, context, db) {
    if (!name) {
      throw new Error('name is required');
    } else if (!context) {
      throw new Error('context is required');
    } else if (!db) {
      throw new Error('db is required');
    }

    this.name = name;
    this.context = context;
    this.db = db;
  }

  async init() {
    if (!this.collection) {
      this.collection = await Collection.getCollection(this.name, this.db);
    }
    return this;
  }

  async create(items) {
    return await Collection.save(items, this);
  }

  async read(ids) {
    if (ids instanceof Array) {
      const newItems = [];
      let errors;

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];

        try {
          newItems.push(await this.read(id));
        } catch (error) {
          errors = errors || {};
          errors[i] = error;
        }
      }

      if (errors) {
        throw errors;
      }

      return newItems;
    } else if (typeof ids !== 'string') {
      throw Collection.ERROR_PROCESSORS.INVALID_ITEM_ID(ids);
    }

    const context = this.context;
    const selectedFields = {};

    for (let k in context) {
      selectedFields[k] = 1;
    }

    const readItem = await new Promise((res, rej) => {
      this.collection.find({ _id: ObjectID(ids) }, selectedFields).toArray((err, value) => {
        if (err || !value.length) {
          rej(Collection.ERROR_PROCESSORS.DB(Collection.METHODS.READ));
        } else {
          const newItem = {
            ...value[0]
          };
          newItem.id = newItem._id.toString();
          delete newItem._id;

          res(newItem);
        }
      });
    });

    // Read nested items based on context.
    for (let k in readItem) {
      const type = context[k];
      const value = readItem[k];

      if (type instanceof Collection) {
        try {
          readItem[k] = await type.read(value);
        } catch (error) {
          readItem[k] = undefined;
        }
      } else if (
        type instanceof Array &&
        type[0] instanceof Collection &&
        value instanceof Array
      ) {
        const nestedCollection = type[0];
        const newValue = [];

        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          try {
            newValue.push(await nestedCollection.read(item));
          } catch (error) {
            // Don't populate nested arrays with `undefined` or `null` when items are missing.
          }
        }

        readItem[k] = newValue;
      }
    }

    return readItem;
  }

  async update(items) {
    return await Collection.save(items, this, true);
  }

  async delete(ids) {
    const context = this.context;

    if (ids instanceof Array) {
      const newIds = [];

      let errors;

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];

        try {
          newIds.push(await this.delete(id));
        } catch (error) {
          errors = errors || {};
          errors[i] = error;
        }
      }

      if (errors) {
        throw errors;
      }

      return newIds;
    } else if (typeof ids !== 'string') {
      throw Collection.ERROR_PROCESSORS.INVALID_ITEM_ID(ids);
    }

    await Collection.deleteNested(ids, this);

    return await new Promise((res, rej) => {
      this.collection.remove({ _id: ObjectID(ids) }, (err, value) => {
        if (err) {
          rej(Collection.ERROR_PROCESSORS.DB(Collection.METHODS.DELETE));
        } else {
          res({
            id: ids
          });
        }
      });
    });
  }

  async search(query, config) {
    const results = {};
    const {
      count,
      onlyIds,
      pageNumber,
      itemsPerPage,
      orderBy,
      descending
    } = ( config || {} );
    const context = this.context;
    // Query structure: `[[{field, operator, value} AND {f, o, v}] OR [{f, o, v}]]`
    const queryStructure = await processQuery(query, this);
    const itemCount = await new Promise((res, rej) => {
      this.collection.count(queryStructure, (err, value) => {
        if (err) {
          console.log('DB ERROR:', err, queryStructure.$or[0].$and[0].title);
          rej(Collection.ERROR_PROCESSORS.DB(Collection.METHODS.SEARCH));
        } else {
          res(value);
        }
      });
    });

    results.totalItems = itemCount;

    if (typeof itemsPerPage === 'number') {
      results.totalPages = itemCount / itemsPerPage;
    }

    if (count) {
      return results;
    } else {
      const foundItems = await new Promise((res, rej) => {
        const limit = typeof itemsPerPage === 'number' ? Math.abs(itemsPerPage) : 0;
        const targetPageNumber = typeof pageNumber === 'number' ? Math.abs(pageNumber) : 1;
        const skip = (targetPageNumber - 1) * limit;
        const targetOrderBy = orderBy instanceof Array ? orderBy : [];
        const sort = {};

        if (targetOrderBy.length) {
          targetOrderBy.forEach(item => {
            if (context.hasOwnProperty(item)) {
              sort[item] = descending ? -1 : 1;
            }
          });
        } else if (descending) {
          sort._id = -1;
        }

        const cursor = this.collection
          .find(queryStructure, { _id: 1 })
          .sort(sort)
          .skip(skip)
          .limit(limit);

        cursor.toArray((err, value) => {
          if (err || !(value instanceof Array)) {
            rej(Collection.ERROR_PROCESSORS.DB(Collection.METHODS.SEARCH));
          } else {
            res(value);
          }
        });
      });

      if (onlyIds) {
        results.data = foundItems.map(item => {
          return {
            id: item._id
          };
        });
      } else {
        results.data = await this.read(foundItems.map(item => item && item._id && item._id.toString()));
      }
    }

    return results;
  }

  async close(all) {
    if (this.db) {
      await new Promise((res, rej) => {
        this.db.close(true, (err, result) => {
          if (err) {
            rej(err);
          } else {
            res(result);
          }
        });
      });
      if (all && this.context instanceof Object) {
        for (let k in this.context) {
          const type = this.context[k];

          if (type instanceof Collection) {
            await type.close(true);
          } else if (type instanceof Array && type[0] instanceof Collection) {
            const nestedCollection = type[0];

            await nestedCollection.close(true);
          }
        }
      }
    }
  }
}
