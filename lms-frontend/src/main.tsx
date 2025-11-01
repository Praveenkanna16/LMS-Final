import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

// Configure future flags to address warnings
const router = createBrowserRouter(createRoutesFromElements(<Route path='*' element={<App />} />), {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
