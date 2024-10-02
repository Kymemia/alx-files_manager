import { v4 as uuid4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db.js';

class FilesController {
  static async postUpload (req, res) {
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    try {
      await dbClient.ensureConnection();
      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
      if ((type === 'file' || type === 'image') && !data) return res.status(400).json({ error: 'Missing data' });

      if (parentId !== 0) {
        const parentFile = await dbClient.collection('files').findOne({ _id: parentId });
        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      }

      if (type === 'folder') {
        const newFolder = {
          userId: null,
          name,
          type,
          isPublic,
          parentId,
          createdAt: new Date()
        };
        const result = await dbClient.db.collection('files').insertOne(newFolder);
        return res.status(201).json(result.ops[0]);
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const fileId = uuid4();
      const localPath = path.join(folderPath, fileId);
      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);

      const newFile = {
        userId: null,
        name,
        type,
        isPublic,
        parentId,
        localPath,
        createdAt: new Date()
      };
      const result = await dbClient.db.collection('files').insertOne(newFile);
      return res.status(201).json(result.ops[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow (req, res) {
    const { id } = req.params;

    try {
      const userId = req.user.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const file = await dbClient.collection('files').findOne({ _id: id, userId });
      if (!file) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json(file);
    } catch (error) {
	    console.error(error);
	    return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex (req, res) {
	  const { parentId = 0, page = 0 } = req.query;

	  try {
		  const userId = req.user.id;
		  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		  const limit = 20;
		  const skip = page * limit;

		  const files = await dbClient.connection('files').find({ parentId, userId }).skip(skip).limit(limit).toArray();

		  return res.status(200).json(files);
	  } catch (error) {
		  console.error(error);
		  return res.status(500).json({ error: 'Internal Server Error' });
	  }
  }

  static async putPublish (req, res) {
	  const { id } = req.params;

	  try {
		  const userId = req.user?.id;
		  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		  const file = await dbClient.collection('files').findOne({ _id: new ObjectId(id), userId });
		  if (!file) return res.status(404).json({ error: 'Not found' });

		  await dbClient.collection('files').updateOne(
			  { _id: new ObjectId(id), userId },
			  { $set: { isPublic: true } }
		  );

		  const updatedFile = await dbClient.collection('files').findOne({ _id: new ObjectId(id), userId });
		  return res.status(200).json(updatedFile);
	  } catch (error) {
		  console.error(error);
		  return res.status(500).json({ error: 'Internal Server Error' });
	  }
  }

  static async putUnpublish (req, res) {
	  const { id } = req.params;

	  try {
		  const userId = req.user?.id;
		  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		  const file = await dbClient.collection('files').findOne({ _id: new ObjectId(id), userId });
		  if (!file) return res.status(404).json({ error: 'Not found' });

		  await dbClient.collection('files').updateOne(
			  { _id: new ObjectId(id), userId },
			  { $set: { isPublic: false } }
		  );

		  const updatedFile = await dbClient.collection('files').findOne({ _id: new ObjectId(id), userId });
		  return res.status(200).json(updatedFile);
	  } catch (error) {
		  console.error(error);
		  return res.status(500).json({ error: 'Internal Server Error' });
	  }
  }
}

export default FilesController;
