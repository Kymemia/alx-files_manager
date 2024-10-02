import pkg from 'mongodb';
const { MongoClient } = pkg;

const DB_HOST = process.env.DB_Host || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor () {
    const url = `mongodb://${DB_HOST}:${DB_PORT}`;
    this.dbName = DB_DATABASE;

    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    this.connectionPromise = this.client.connect()
      .then(() => {
        this.db = this.client.db(this.dbName);
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
      });
  }

  isAlive () {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  async ensureConnection () {
    await this.connectionPromise;
  }
  
  async collection(name) {
    await this.ensureConnection();
    return this.db.collection(name);
  }

  async nbUsers () {
    try {
      await this.ensureConnection();
      const usersCollection = this.db.collection('users');
      return await usersCollection.countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles () {
    try {
      await this.ensureConnection();
      const filesCollection = this.db.collection('files');
      return await filesCollection.countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
