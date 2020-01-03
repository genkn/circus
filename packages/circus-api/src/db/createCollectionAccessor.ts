import status from 'http-status';
import mongo from 'mongodb';
import { Validator } from '../createValidator';

type CursorOptions = {
  sort?: object;
  limit?: number;
  skip?: number;
};

/**
 * Basic wrapper for Mongo collection that performs validation tasks.
 */
const createCollectionAccessor = (
  db: mongo.Db,
  validator: Validator,
  opts: { schema: object | string; collectionName: string; primaryKey: string }
) => {
  const { schema, collectionName, primaryKey } = opts;
  const collection = db.collection(collectionName);

  const dbEntrySchema = schema + '|dbEntry';

  /**
   * Inserts a single document after validation succeeds.
   */
  const insert = async (data: object) => {
    const date = new Date();
    const inserting = { ...data, createdAt: date, updatedAt: date };
    await validator.validate(dbEntrySchema, inserting);
    return await collection.insertOne(inserting);
  };

  /**
   * Upserts a single document after validation succeeds.
   * Partial update is not supported; you need to provide the whole document.
   * @param {string|number} id The primary key.
   * @param {object} data The data to upsert (excluding the id)
   */
  const upsert = async (id: string | number, data: object) => {
    const date = new Date();
    const upserting = { createdAt: date, updatedAt: date, ...data };
    await validator.validate(dbEntrySchema, { [primaryKey]: id, ...upserting });
    return await collection.updateOne(
      { [primaryKey]: id },
      { $set: upserting },
      { upsert: true }
    );
  };

  /**
   * Inserts multiple documents after validation succeeds for each document.
   */
  const insertMany = async (data: object[]) => {
    const documents = [];
    const date = new Date();
    for (const doc of data) {
      const inserting = { ...doc, createdAt: date, updatedAt: date };
      await validator.validate(dbEntrySchema, inserting);
      documents.push(inserting);
    }
    return await collection.insertMany(documents);
  };

  /**
   * Fetches documents that matches the given query as an array.
   * The `_id` field will not be included.
   */
  async function findAll(query: object, options: CursorOptions = {}) {
    const cursor = findAsCursor(query, options);
    const array = [];
    while (await cursor.hasNext()) {
      array.push(await cursor.next());
    }
    return array;
  }

  /**
   * Executes find and returns the matched documents as a cursor-like object.
   * Validation is performed for each document.
   * The `_id` field will not be included.
   */
  const findAsCursor = (query: object, options: CursorOptions = {}) => {
    const { sort, limit, skip } = options;
    let cursor = collection.find(query).project({ _id: 0 });
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    return {
      next: async () => {
        const next = await cursor.next();
        await validator.validate(dbEntrySchema, next);
        return next;
      },
      hasNext: () => cursor.hasNext(),
      count: () => cursor.count()
    };
  };

  /**
   * Provides direct access to MongoDB's aggregation framework.
   * Use this sparingly becuse this breaks encapsulation.
   * Validation is not performed.
   */
  async function aggregate(pipeline: object[]) {
    const cursor = await aggregateAsCursor(pipeline);
    const array = [];
    while (await cursor.hasNext()) {
      array.push(await cursor.next());
    }
    return array;
  }

  /**
   * Provides direct access to MongoDB's aggregation framework.
   * Use this sparingly becuse this breaks encapsulation.
   * Validation is not performed.
   */
  async function aggregateAsCursor(pipeline: object[]) {
    return collection.aggregate(pipeline);
  }

  /**
   * Fetches the single document that matches the primary key.
   */
  async function findById(id: number | string) {
    const key = primaryKey ? primaryKey : '_id';
    const docs = await collection
      .find({ [key]: id })
      .project({ _id: 0 })
      .limit(1)
      .toArray();
    const result = docs[0];
    if (result !== undefined) {
      await validator.validate(dbEntrySchema, result);
    }
    return result;
  }

  /**
   * Fetches the single document by the primary key.
   * Throws an error with 404 status if nothing found.
   */
  async function findByIdOrFail(id: number | string) {
    const result = await findById(id);
    if (result === undefined) {
      const err = new Error(`The requested ${schema} was not found.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }
    return result;
  }

  /**
   * Modifies the document by the primary key.
   */
  async function modifyOne(id: string, updates: object) {
    const key = primaryKey ? primaryKey : '_id';
    const date = new Date();
    if (key in updates) {
      const err = TypeError('The primary key cannot be modified.');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    const original = await collection.findOneAndUpdate(
      { [key]: id },
      { $set: { ...updates, updatedAt: date } }
    );
    if (original.value === null) {
      const err = new Error('The request resource was not found.');
      err.status = status.NOT_FOUND;
      err.expose = true;
      throw err;
    }
    const updated = { ...original.value, ...updates, updatedAt: date };
    try {
      const { _id, ...updatedWithoutId } = updated;
      await validator.validate(dbEntrySchema, updatedWithoutId);
    } catch (err) {
      // validation failed, rollback
      await collection.findOneAndReplace({ [key]: id }, original.value);
      throw err;
    }
    return updated;
  }

  /**
   * @returns {number}
   */
  async function newSequentialId() {
    const date = new Date();
    const doc = await db.collection('sequences').findOneAndUpdate(
      { key: collectionName },
      { $inc: { value: 1 }, $set: { updatedAt: date } },
      {
        upsert: true,
        projection: { _id: false, value: true },
        returnOriginal: false
      }
    );
    if (doc.value !== null) {
      return doc.value.value;
    } else {
      await db.collection('sequences').insertOne({
        key: collectionName,
        value: 1,
        cratedAt: date,
        updatedAt: date
      });
      return 1;
    }
  }

  // These methods are exposed as-is for now
  const find = collection.find.bind(collection);
  const deleteMany = collection.deleteMany.bind(collection);
  const deleteOne = collection.deleteOne.bind(collection);

  return {
    find,
    deleteMany,
    deleteOne,
    findAll,
    findAsCursor,
    findById,
    findByIdOrFail,
    insert,
    upsert,
    aggregate,
    insertMany,
    modifyOne,
    newSequentialId,
    collectionName: () => collectionName
  };
};

export default createCollectionAccessor;
export type CollectionAccessor = ReturnType<typeof createCollectionAccessor>;