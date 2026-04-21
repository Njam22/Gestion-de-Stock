import { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:5000/api/stocks';

function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: 0, price: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ name: '', price: 0 });
  const [restockingId, setRestockingId] = useState(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState('stock');
  const [saleQuantities, setSaleQuantities] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Impossible de récupérer les articles du stock.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Impossible d’ajouter le produit.');
      }

      const newItem = await response.json();
      setItems((current) => [...current, newItem]);
      setForm({ name: '', quantity: 0, price: 0 });
    } catch (err) {
      setError(err.message);
    }
  };

  const updateItem = async (itemId, changes) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });

      if (!response.ok) {
        throw new Error('Impossible de mettre à jour le produit.');
      }

      const updatedItem = await response.json();
      setItems((current) => current.map((item) => (item.id === itemId ? updatedItem : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (itemId) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Impossible de supprimer le produit.');
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (item) => {
    setRestockingId(null);
    setEditingId(item.id);
    setEditingForm({ name: item.name, price: item.price });
  };

  const saveEdit = async () => {
    await updateItem(editingId, { name: editingForm.name, price: editingForm.price });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const startRestock = (item) => {
    setEditingId(null);
    setRestockingId(item.id);
    setRestockAmount(0);
  };

  const saveRestock = async (item) => {
    const quantityToAdd = Number(restockAmount);
    if (!quantityToAdd || quantityToAdd <= 0) {
      setError('Veuillez saisir une quantité valide pour réapprovisionner.');
      return;
    }

    await updateItem(item.id, { quantity: item.quantity + quantityToAdd });
    setRestockingId(null);
    setRestockAmount(0);
  };

  const cancelRestock = () => {
    setRestockingId(null);
    setRestockAmount(0);
  };

  const openPage = (page) => {
    setError('');
    setEditingId(null);
    setRestockingId(null);
    setCurrentPage(page);
  };

  const handleSaleQuantityChange = (itemId, value) => {
    setSaleQuantities((current) => ({
      ...current,
      [itemId]: Number(value)
    }));
  };

  const sellItem = async (item) => {
    const quantityToSell = Number(saleQuantities[item.id] || 0);

    if (!quantityToSell || quantityToSell <= 0 || quantityToSell > item.quantity) {
      setError('Veuillez saisir une quantité valide à vendre.');
      return;
    }

    await updateItem(item.id, { quantity: item.quantity - quantityToSell });
    setSaleQuantities((current) => ({ ...current, [item.id]: 0 }));
  };

  const adjustQuantity = (item, delta) => {
    const nextQuantity = Math.max(0, item.quantity + delta);
    updateItem(item.id, { quantity: nextQuantity });
  };

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price, 0), [items]);

  return (
    <div className="app-shell">
      <div className="panel">
        <section className="hero">
          <header>
            <h1>Gestion de stock</h1>
            <p>Application complète React + Node pour suivre les articles, les quantités et les valeurs.</p>
          </header>

          <div className="page-nav">
            <button className={currentPage === 'stock' ? 'active' : ''} onClick={() => openPage('stock')}>
              Stock
            </button>
            <button className={currentPage === 'sales' ? 'active' : ''} onClick={() => openPage('sales')}>
              Vente
            </button>
          </div>

          {currentPage === 'stock' ? (
            <form className="product-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label>Produit</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Nom du produit"
                  required
                />
              </div>

              <div className="field-group">
                <label>Quantité</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Quantité du produit"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
                  required
                />
              </div>

              <div className="field-group">
                <label>Prix unitaire</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Prix du produit"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                  required
                />
              </div>

              <button type="submit">Ajouter au stock</button>
            </form>
          ) : (
            <div className="sales-panel">
              <h2>Page de vente</h2>
              <p>Sélectionnez un article et saisissez la quantité vendue pour mettre à jour le stock.</p>
            </div>
          )}
        </section>

        {currentPage === 'stock' && (
          <section className="status-bar">
            <div className="status-card">
              <span>Articles différents</span>
              <strong>{items.length}</strong>
            </div>
            <div className="status-card">
              <span>Total stock</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="status-card">
              <span>Valeur totale</span>
              <strong>{totalValue.toFixed(2)} €</strong>
            </div>
          </section>
        )}

        {error && <div className="error-banner">{error}</div>}

        {isLoading ? (
          <p className="loading">Chargement des données...</p>
        ) : currentPage === 'stock' ? (
          items.length === 0 ? (
            <p className="empty-state">Aucun article en stock, ajoutez-en un !</p>
          ) : (
            <div className="stock-table">
              <div className="stock-grid header-row">
                <span>Produit</span>
                <span>Quantité</span>
                <span>Prix</span>
                <span>Valeur</span>
                <span>Actions</span>
              </div>

              {items.map((item) => (
                <div key={item.id} className={`stock-grid item-row ${item.quantity < 2 ? 'low-stock' : ''}`}>
                  {editingId === item.id ? (
                    <>
                      <input
                        value={editingForm.name}
                        onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                        placeholder="Nom du produit"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Prix du produit"
                        value={editingForm.price}
                        onChange={(e) => setEditingForm({ ...editingForm, price: Number(e.target.value) })}
                        required
                      />
                      <span>{(item.quantity * editingForm.price).toFixed(2)} €</span>
                      <span className="actions">
                        <button onClick={saveEdit}>Sauvegarder</button>
                        <button onClick={cancelEdit}>Annuler</button>
                      </span>
                    </>
                  ) : restockingId === item.id ? (
                    <>
                      <span>{item.name}</span>
                      <input
                        type="number"
                        min="1"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(Number(e.target.value))}
                        placeholder="Qté à ajouter"
                      />
                      <span>{item.price.toFixed(2)} €</span>
                      <span>{((item.quantity + Number(restockAmount)) * item.price).toFixed(2)} €</span>
                      <span className="actions">
                        <button onClick={() => saveRestock(item)}>Valider</button>
                        <button onClick={cancelRestock}>Annuler</button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{item.name}</span>
                      <span>{item.quantity}</span>
                      <span>{item.price.toFixed(2)} €</span>
                      <span>{(item.quantity * item.price).toFixed(2)} €</span>
                      <span className="actions">
                        <button onClick={() => startRestock(item)}>Réapprovisionner</button>
                        <button onClick={() => startEdit(item)}>Modifier</button>
                        <button onClick={() => deleteItem(item.id)}>Supprimer</button>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <p className="empty-state">Aucun article en stock pour la vente.</p>
        ) : (
          <div className="sales-table">
            <div className="stock-grid header-row">
              <span>Produit</span>
              <span>Quantité</span>
              <span>Prix</span>
              <span>Quantité vendue</span>
              <span>Actions</span>
            </div>

            {items.map((item) => (
              <div key={item.id} className={`stock-grid item-row ${item.quantity < 2 ? 'low-stock' : ''}`}>
                <span>{item.name}</span>
                <span>{item.quantity}</span>
                <span>{item.price.toFixed(2)} €</span>
                <input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={saleQuantities[item.id] || ''}
                  onChange={(e) => handleSaleQuantityChange(item.id, e.target.value)}
                  placeholder="Qté vendue"
                />
                <span className="actions">
                  <button onClick={() => sellItem(item)}>Vendre</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
