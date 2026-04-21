# Application de gestion de stock

Ce projet contient un backend Node/Express et un frontend React/Vite.

## Installation

```bash
cd '/Users/apple/REACT PROJECT/my-react-app'
npm install
```

## Exécution

Ouvrir deux terminaux ou lancer en workspace :

```bash
npm run dev
```

Puis :

- Backend : http://localhost:4000
- Frontend : http://localhost:5173

## Structure

- `backend/` : API REST pour les articles du stock
- `frontend/` : application React pour gérer le stock

## Scripts utiles

- `npm run dev` : démarre le backend et le frontend en parallèle
- `npm --prefix backend run dev` : lance uniquement le backend
- `npm --prefix frontend run dev` : lance uniquement le frontend
