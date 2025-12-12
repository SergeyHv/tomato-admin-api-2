import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const basePath = path.join(process.cwd(), 'api');

    // Попробуем прочитать содержимое api и api/lib
    const apiEntries = fs.readdirSync(basePath, { withFileTypes: true });
    let libEntries = [];
    try {
      const libPath = path.join(basePath, 'lib');
      libEntries = fs.readdirSync(libPath, { withFileTypes: true });
    } catch (e) {
      // игнорируем, если lib не существует
    }

    res.status(200).json({
      cwd: process.cwd(),
      apiEntries: apiEntries.map(e => ({ name: e.name, isDir: e.isDirectory() })),
      libEntries: libEntries.map(e => ({ name: e.name, isDir: e.isDirectory() })),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
