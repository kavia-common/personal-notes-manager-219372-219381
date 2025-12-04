# Ocean Notes - React Frontend

A simple notes application (create, view, edit, delete) built with React and styled with the Ocean Professional theme.

## Highlights
- In-memory CRUD with optional backend sync if `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL` is set
- Clean layout: Sidebar (filters/tags), Notes List, Editor
- Search across title/content/tags and basic tag support (comma-separated)
- Smooth transitions, subtle shadows, rounded corners, responsive and keyboard-accessible
- LocalStorage persistence when no backend is present

## Model
Each note:
```json
{ "id": "string", "title": "string", "content": "string", "tags": ["string"], "createdAt": "ISO", "updatedAt": "ISO" }
```

## Available Scripts
- `npm start` - start dev server on http://localhost:3000
- `npm test` - run tests
- `npm run build` - production build

## Environment
- REACT_APP_API_BASE (preferred)
- REACT_APP_BACKEND_URL
If neither provided, the app uses in-memory + localStorage persistence.

## Keyboard Accessibility
- Tab-friendly controls
- Buttons and inputs have visible focus (blue focus ring)
- ARIA labels for key interactive elements

## Notes
No external UI frameworks; styles are in `src/App.css`.
