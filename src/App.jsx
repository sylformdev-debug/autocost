import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { SimulateurProvider } from './context/SimulateurContext';
import { useNavigationScroll } from './hooks/useNavigationScroll';
import { Indicateur } from './components/EtatChargement/EtatChargement';
import Accueil from './pages/Accueil/Accueil';

// Le simulateur embarque les graphiques (recharts) : il est chargé à la demande
// pour alléger le premier rendu de la page d'accueil.
const Simulateur = lazy(() => import('./pages/Simulateur/Simulateur'));
const DetailVehicule = lazy(() => import('./pages/DetailVehicule/DetailVehicule'));
const NonTrouve = lazy(() => import('./pages/NonTrouve/NonTrouve'));

function Chargement() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <Indicateur label="Chargement de la page" />
    </div>
  );
}

export default function App() {
  useNavigationScroll();

  return (
    <SimulateurProvider>
      <a className="lien-evitement" href="#contenu">
        Aller au contenu principal
      </a>

      <Navbar />

      <main id="contenu">
        <ErrorBoundary>
          <Suspense fallback={<Chargement />}>
            <Routes>
              <Route path="/" element={<Accueil />} />
              <Route path="/simulateur" element={<Simulateur />} />
              <Route path="/vehicule/:id" element={<DetailVehicule />} />
              <Route path="*" element={<NonTrouve />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </SimulateurProvider>
  );
}
