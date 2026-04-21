import express from 'express';
import cors from 'cors';
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../data/stocks.json');
const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({ origin: 'http://localhost:5175' }));
app.use(express.json());

async function ensureDataFile() {
  try {
    await access(dataPath);
  } catch {
    await writeFile(dataPath, JSON.stringify([], null, 2));
  }
}

async function loadItems() {
  await ensureDataFile();
  const content = await readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

async function saveItems(items) {
  await writeFile(dataPath, JSON.stringify(items, null, 2));
}

app.get('/api/items', async (req, res) => {
  const items = await loadItems();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  const { name, quantity, price } = req.body;
  if (!name || quantity == null || price == null) {
    return res.status(400).json({ error: 'Name, quantity, and price are required.' });
  }

  const items = await loadItems();
  const nextItem = {
    id: `${Date.now()}`,
    name: name.trim(),
    quantity: Number(quantity),
    price: Number(price)
  };

  items.push(nextItem);
  await saveItems(items);
  res.status(201).json(nextItem);
});

app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, price } = req.body;
  const items = await loadItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  items[index] = {
    ...items[index],
    name: name != null ? name.trim() : items[index].name,
    quantity: quantity != null ? Number(quantity) : items[index].quantity,
    price: price != null ? Number(price) : items[index].price
  };

  await saveItems(items);
  res.json(items[index]);
});

app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const items = await loadItems();
  const filtered = items.filter((item) => item.id !== id);

  if (filtered.length === items.length) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  await saveItems(filtered);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Stock management API running on http://localhost:${PORT}`);
});
