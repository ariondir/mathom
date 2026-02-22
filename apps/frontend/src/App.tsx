import './App.css';
import { PlayerProvider } from './contexts/PlayerContext';
import { ReaderProvider } from './contexts/ReaderContext';
import { Library } from './components/Library';
import { Player } from './components/Player';
import { Fireflies } from './components/Fireflies';
import { ReaderWrapper } from './components/Reader';

function App() {
  return (
    <PlayerProvider>
      <ReaderProvider>
        <Fireflies />
        <Library />
        <Player />
        <ReaderWrapper />
      </ReaderProvider>
    </PlayerProvider>
  );
}

export default App;
