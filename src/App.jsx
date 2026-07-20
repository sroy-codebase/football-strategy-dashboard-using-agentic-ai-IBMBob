import React, { useState, useCallback } from 'react';
import players from './data/players.json';
import AppHeader from './components/Header/Header';
import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PlayerCard from './components/PlayerCard/PlayerCard';
import FormationBoard from './components/FormationBoard/FormationBoard';
import PlayerCompare from './components/PlayerCompare/PlayerCompare';
import { generateRandomTeam, FORMATIONS, DEFAULT_FORMATION } from './utils/teamGenerator';
import './App.scss';

function App() {
  const [activePage, setActivePage]       = useState('browser');  // 'browser' | 'formation' | 'compare'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teamPlayers, setTeamPlayers]     = useState([]);
  const [pitchPlayer, setPitchPlayer]     = useState(null);
  const [formation, setFormation]         = useState(DEFAULT_FORMATION);

  function handleSelect(name) {
    const found = players.find((p) => p.name === name) || null;
    setSelectedPlayer(found);
  }

  const handleGenerateTeam = useCallback(() => {
    setTeamPlayers(generateRandomTeam(players, formation.slots));
    setPitchPlayer(null);
  }, [formation]);

  function handleFormationChange(key) {
    const next = FORMATIONS.find((f) => f.key === key) || DEFAULT_FORMATION;
    setFormation(next);
    setTeamPlayers(generateRandomTeam(players, next.slots));
    setPitchPlayer(null);
  }

  function handlePitchPlayerClick(player) {
    setPitchPlayer((prev) => prev?.name === player.name ? null : player);
  }

  return (
    <div className="app">
      <AppHeader activePage={activePage} onNavigate={setActivePage} />

      <main className="app__content">
        {activePage === 'browser' && (
          <div className="app__browser-page">
            <PlayerSelect players={players} onSelect={handleSelect} />
            <PlayerCard player={selectedPlayer} />
          </div>
        )}

        {activePage === 'formation' && (
          <div className="app__formation-page">
            <h1 className="app__formation-title">Team Formation Visualizer</h1>

            <div className="app__toolbar">
              <div className="app__formation-pills">
                {FORMATIONS.map((f) => (
                  <button
                    key={f.key}
                    className={`app__pill${formation.key === f.key ? ' app__pill--active' : ''}`}
                    onClick={() => handleFormationChange(f.key)}
                    title={f.description}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="app__generate-btn" onClick={handleGenerateTeam}>
                Generate Random Team
              </button>
            </div>

            <p className="app__formation-desc">{formation.description}</p>

            <div className="app__board-wrap">
              <FormationBoard
                players={teamPlayers}
                rows={formation.rows}
                shirtNumbers={formation.shirtNumbers}
                onPlayerClick={handlePitchPlayerClick}
                selectedName={pitchPlayer?.name}
              />
              {pitchPlayer && (
                <div className="app__pitch-panel">
                  <button
                    className="app__pitch-panel-close"
                    onClick={() => setPitchPlayer(null)}
                    aria-label="Close panel"
                  >
                    ✕
                  </button>
                  <PlayerCard player={pitchPlayer} />
                </div>
              )}
            </div>
          </div>
        )}

        {activePage === 'compare' && (
          <div className="app__compare-page">
            <h1 className="app__page-title">Compare Players</h1>
            <PlayerCompare players={players} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
