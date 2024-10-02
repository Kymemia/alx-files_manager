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
}

export default FilesController;
