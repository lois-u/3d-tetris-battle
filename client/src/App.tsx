import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import MainMenu from './components/screens/MainMenu';
import Lobby from './components/screens/Lobby';
import Room from './components/screens/Room';
import Game from './components/screens/Game';
import GameOver from './components/screens/GameOver';

export default function App() {
  const { screen } = useGameStore();
  useSocket();

  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return <MainMenu />;
      case 'lobby':
        return <Lobby />;
      case 'room':
        return <Room />;
      case 'game':
        return <Game />;
      case 'gameOver':
        return <GameOver />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      {renderScreen()}
    </div>
  );
}
