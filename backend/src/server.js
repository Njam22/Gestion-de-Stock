import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à SQLite
const db = new Database('./stocks.db', { verbose: console.log });

// Créer la table si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  )
`);

// Insérer des données exemple si la table est vide
const count = db.prepare('SELECT COUNT(*) as count FROM stocks').get();
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO stocks (name, quantity, price) VALUES (?, ?, ?)');
  insert.run('Produit A', 50, 10);
  insert.run('Produit B', 30, 20);
  insert.run('Produit C', 100, 5);
}

// Middleware
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur Stock Management API avec SQLite' });
});

// Route pour récupérer tous les stocks
app.get('/api/stocks', (req, res) => {
  const stocks = db.prepare('SELECT * FROM stocks').all();
  res.json(stocks);
});

// Route pour récupérer un stock par ID
app.get('/api/stocks/:id', (req, res) => {
  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
  if (!stock) {
    return res.status(404).json({ message: 'Stock non trouvé' });
  }
  res.json(stock);
});

// Route pour ajouter un stock
app.post('/api/stocks', (req, res) => {
  const { name, quantity, price } = req.body;
  if (!name || !quantity || !price) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  const insert = db.prepare('INSERT INTO stocks (name, quantity, price) VALUES (?, ?, ?)');
  const result = insert.run(name, quantity, price);
  res.status(201).json({ id: result.lastInsertRowid, name, quantity, price });
});

// Route pour mettre à jour un stock
app.put('/api/stocks/:id', (req, res) => {
  const { name, quantity, price } = req.body;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(quantity);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(price);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
  }

  values.push(req.params.id);
  const update = db.prepare(`UPDATE stocks SET ${updates.join(', ')} WHERE id = ?`);
  const result = update.run(...values);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Stock non trouvé' });
  }
  // Récupérer l'élément mis à jour
  const updatedItem = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
  res.json(updatedItem);
});

// Route pour supprimer un stock
app.delete('/api/stocks/:id', (req, res) => {
  const deleteStmt = db.prepare('DELETE FROM stocks WHERE id = ?');
  const result = deleteStmt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Stock non trouvé' });
  }
  res.json({ message: 'Stock supprimé' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});