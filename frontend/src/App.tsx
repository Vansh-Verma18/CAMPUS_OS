import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DevTestPage } from './pages/DevTestPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DevTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
