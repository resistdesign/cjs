# Collection

A JavaScript Database Collection Manager with Context Driven Typing and Relationship Mapping.

## close

Close the database connection.

**Parameters**

-   `all` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** A flag signifying that all nested database connection should also be closed.

## constructor

**Parameters**

-   `name` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The human readable name of the Collection.
-   `context` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context map.
-   `db` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The MongoDB instance.

## create

Create item(s).
Any items in the nested structure are nested into the new items and updated if they have
been changed.

**Parameters**

-   `items` **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** The item or array of items to be created.

Returns **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** An object or array of objects (each) with only the new `id`.

## delete

Delete item(s) by `id`.
All items in the nested structure are deleted based on the `deleteNested` map of the
applicable Collection.

**Parameters**

-   `ids` **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>)** The id or array of ids of the item(s) to be deleted.

Returns **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** An object or array of objects representing the deleted
item(s) (each) with only the `id`.

## init

Initializer the MongoDB collection.

## read

Read item(s) by id.

**Parameters**

-   `ids` **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>)** The id or array of ids of the item(s) to be read.

Returns **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** An object or array of objects (each) with all nested objects
attached based on the `context`.

## search

Search item(s).

**Parameters**

-   `query` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** The query used to perform the search.
    The query is an array containing arrays.
    Each array is an acceptable scenario resulting in an `OR` operation.
    Each scenario is an array containing objects.
    Each object is a required parameters resulting in an `AND` operation.
    Each required parameter contains the following properties:<hr />
     - `field`: The name of the field to match.
     - `operator`: The operator used to match the `value` based on `Collection.QUERY_OPERATORS`.
     - `value`: The value to be matched.
    If `field` represents a nested Collection, value must be a nested query array targeting
    the fields of that Collection.
-   `config` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The configuration for the search.
    Config may contain any combination of the following properties:<hr />
     - `count`: A boolean flag signifying that only a count should be returned.
     - `onlyIds`: A boolean flag signifying that returned items should only contain an `id`. No
    nested items will be retrieved, although nested collections will still be searched for matching
    nested values based on the query.
     - `pageNumber`: The number of the page of items to retrieve.
     - `itemsPerPage`: The maximum number of items in each page of items.
     - `orderBy`: An array of fields (in order of importance) by which the matched items will be sorted.
     - `descending`: A boolean flag signifying that the items should be returned in reverse order.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The metadata and items matching the query.
The returned object contains the following properties:<hr />
 - `totalItems`: The number of items matching the query.
 - `totalPages`: The number of pages if `itemsPerPage` is a `number` on `config`.
 - `data`: An array of items matched by the query. If `onlyIds` is set to `true` on the `config`,
each item will only contain an `id`. Otherwise, all items are a full nested structure based
on the `context`.

## update

Update item(s).
If any items are missing from the nested structure they are deleted based on the
`deleteNested` map of the applicable Collection.
If any items are added to the nested structure they are created.
Items are accounted for by `id` and not by the index for each item in an array.

**Parameters**

-   `items` **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** The existing item or array of items to be updated.
    Each item must contain an `id`.

Returns **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)\|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>)** An object or array of objects representing the updated
item(s) (each) with only the `id`.

## getCollectionStructure

Get a Collection instance, potentially with other nested Collections.
Cyclical structures **are** permitted.

**Parameters**

-   `config` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The configuration for the Collection.
    Config contains the following properties:<hr />
     - `name`: The human readable name of the Collection.
     - `context`: A map of field names to types.
    Each key is the name of a field and each value is the valid type of data for that field.
    <hr />
    Supported built-in/primitive types: Any serializable type. **WARNING:** `Object` and `Array` types
    will not be not be type checked.
    Nested types:
    <hr />
     - A nested `Collection`.
     - A nested `Array` containing a `Collection`.
    `db`: The MongoDB database connection string including authentication information.
-   `map` **[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)=(default new Map())** (Typically not passed.) A map of config object to Collection instances used for tracking
    cyclical structures and avoiding infinite loops.

Returns **Collection** The configured, connected and initialized `Collection` instance.

# collection

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The MongoDB collection used to perform operations.

# context

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context map for the Collection.

# db

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The MongoDB database containing the targeted collection.

# deleteNested

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The map used to determine if items from certain fields with
nested collections will be deleted automatically during update and delete operations.
Each key is a field name from the `context` and each value must be truthy.

# name

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The human readable name of the Collection.
