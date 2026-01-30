import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import api from './api';

const TeamPanel = ({
  team,
  onTeamNameChange,
  teamNum,
  newPlayer,
  onNewPlayerChange,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePoints,
  onUpdateFouls,
  onUpdateTeamPoints,
  teamTotal,
  bgColor,
  accentColor,
  error,
}) => {
  const handleNumberChange = (value) => {
    if (value === '' || /^\d+$/.test(value)) {
      onNewPlayerChange({ ...newPlayer, number: value });
    }
  };

  return (
    <View style={[styles.teamPanel, { backgroundColor: bgColor }]}>
      <TextInput
        placeholder="Team Name"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={team.name}
        onChangeText={onTeamNameChange}
        style={styles.teamNameInput}
      />

      <View style={styles.teamTotalContainer}>
        <TouchableOpacity
          onPress={() => onUpdateTeamPoints(1)}
          style={[styles.teamTotalButton, { backgroundColor: accentColor }]}
        >
          <Text style={styles.teamTotalButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.teamTotalValue}>{teamTotal}</Text>
        <TouchableOpacity
          onPress={() => onUpdateTeamPoints(-1)}
          style={styles.teamTotalButtonMinus}
        >
          <Text style={styles.teamTotalButtonMinusText}>-</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addPlayerForm}>
        <View style={styles.addPlayerRow}>
          <TextInput
            placeholder="#"
            placeholderTextColor="#999"
            value={newPlayer.number}
            onChangeText={handleNumberChange}
            keyboardType="numeric"
            style={styles.numberInput}
          />
          <TextInput
            placeholder="Player Name"
            placeholderTextColor="#999"
            value={newPlayer.name}
            onChangeText={(text) => onNewPlayerChange({ ...newPlayer, name: text })}
            onSubmitEditing={onAddPlayer}
            style={styles.nameInput}
          />
          <TouchableOpacity onPress={onAddPlayer} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <ScrollView style={styles.playerList}>
        {team.players.length === 0 ? (
          <Text style={styles.noPlayersText}>No players added yet</Text>
        ) : (
          team.players.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={[styles.playerNumber, { backgroundColor: accentColor }]}>
                <Text style={styles.playerNumberText}>{player.number}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                <TouchableOpacity onPress={() => onRemovePlayer(player.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              {/* Points */}
              <View style={styles.statContainer}>
                <TouchableOpacity
                  onPress={() => onUpdatePoints(player.id, 1)}
                  style={[styles.statButtonPlus, { backgroundColor: accentColor }]}
                >
                  <Text style={styles.statButtonTextWhite}>+</Text>
                </TouchableOpacity>
                <View style={styles.statValueContainer}>
                  <Text style={[styles.statValue, { color: teamNum === 1 ? '#2563eb' : '#dc2626' }]}>
                    {player.points}
                  </Text>
                  <Text style={styles.statLabel}>pts</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onUpdatePoints(player.id, -1)}
                  style={styles.statButtonMinus}
                >
                  <Text style={styles.statButtonText}>-</Text>
                </TouchableOpacity>
              </View>

              {/* Fouls */}
              <View style={styles.statContainer}>
                <TouchableOpacity
                  onPress={() => onUpdateFouls(player.id, 1)}
                  style={styles.statButtonFoul}
                >
                  <Text style={styles.statButtonTextWhite}>+</Text>
                </TouchableOpacity>
                <View style={styles.statValueContainer}>
                  <Text style={[styles.statValue, { color: player.fouls >= 5 ? '#dc2626' : '#ca8a04' }]}>
                    {player.fouls}
                  </Text>
                  <Text style={styles.statLabel}>fls</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onUpdateFouls(player.id, -1)}
                  style={styles.statButtonMinus}
                >
                  <Text style={styles.statButtonText}>-</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const ConfirmModal = ({ visible, onSave, onDontSave, onCancel }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Save Game?</Text>
        <Text style={styles.modalMessage}>Do you want to save this game before leaving?</Text>
        <TouchableOpacity onPress={onSave} style={styles.modalButtonSave}>
          <Text style={styles.modalButtonSaveText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDontSave} style={styles.modalButtonDontSave}>
          <Text style={styles.modalButtonDontSaveText}>Don't Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.modalButtonCancel}>
          <Text style={styles.modalButtonCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [team1, setTeam1] = useState({ name: '', players: [], bonusPoints: 0 });
  const [team2, setTeam2] = useState({ name: '', players: [], bonusPoints: 0 });
  const [newPlayer1, setNewPlayer1] = useState({ name: '', number: '' });
  const [newPlayer2, setNewPlayer2] = useState({ name: '', number: '' });
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');
  const [pastGames, setPastGames] = useState([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load games from API on mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const games = await api.getGames();
      setPastGames(games);
    } catch (error) {
      console.error('Failed to load games:', error);
      // If API fails, continue with empty games (offline mode)
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = (teamNum) => {
    const newPlayer = teamNum === 1 ? newPlayer1 : newPlayer2;
    const setNewPlayer = teamNum === 1 ? setNewPlayer1 : setNewPlayer2;
    const team = teamNum === 1 ? team1 : team2;
    const setTeam = teamNum === 1 ? setTeam1 : setTeam2;
    const setError = teamNum === 1 ? setError1 : setError2;

    const hasName = newPlayer.name.trim() !== '';
    const hasNumber = newPlayer.number.trim() !== '';

    if (!hasName && !hasNumber) {
      setError('Please enter a player name or number');
      return;
    }

    setError('');

    const finalName = hasName ? newPlayer.name.trim() : 'Player';
    const finalNumber = hasNumber ? newPlayer.number.trim() : 'N/A';

    setTeam({
      ...team,
      players: [
        ...team.players,
        {
          id: Date.now(),
          name: finalName,
          number: finalNumber,
          points: 0,
          fouls: 0,
        },
      ],
    });
    setNewPlayer({ name: '', number: '' });
  };

  const removePlayer = (teamNum, id) => {
    if (teamNum === 1) {
      setTeam1({ ...team1, players: team1.players.filter((p) => p.id !== id) });
    } else {
      setTeam2({ ...team2, players: team2.players.filter((p) => p.id !== id) });
    }
  };

  const updatePoints = (teamNum, id, delta) => {
    const updateFn = (players) =>
      players.map((player) => {
        if (player.id === id) {
          return { ...player, points: Math.max(0, player.points + delta) };
        }
        return player;
      });

    if (teamNum === 1) {
      setTeam1({ ...team1, players: updateFn(team1.players) });
    } else {
      setTeam2({ ...team2, players: updateFn(team2.players) });
    }
  };

  const updateFouls = (teamNum, id, delta) => {
    const updateFn = (players) =>
      players.map((player) => {
        if (player.id === id) {
          return { ...player, fouls: Math.max(0, player.fouls + delta) };
        }
        return player;
      });

    if (teamNum === 1) {
      setTeam1({ ...team1, players: updateFn(team1.players) });
    } else {
      setTeam2({ ...team2, players: updateFn(team2.players) });
    }
  };

  const updateTeamName = (teamNum, name) => {
    if (teamNum === 1) {
      setTeam1({ ...team1, name });
    } else {
      setTeam2({ ...team2, name });
    }
  };

  const updateTeamPoints = (teamNum, delta) => {
    if (teamNum === 1) {
      setTeam1({ ...team1, bonusPoints: Math.max(0, team1.bonusPoints + delta) });
    } else {
      setTeam2({ ...team2, bonusPoints: Math.max(0, team2.bonusPoints + delta) });
    }
  };

  const getTeamTotal = (team) => team.players.reduce((sum, p) => sum + p.points, 0) + (team.bonusPoints || 0);

  const saveGame = async () => {
    if (team1.players.length > 0 || team2.players.length > 0) {
      setIsSaving(true);
      try {
        const gameData = {
          date: new Date().toLocaleDateString(),
          team1: { ...team1, total: getTeamTotal(team1) },
          team2: { ...team2, total: getTeamTotal(team2) },
        };
        const savedGame = await api.saveGame(gameData);
        setPastGames([savedGame, ...pastGames]);
      } catch (error) {
        console.error('Failed to save game:', error);
        // Fallback to local storage if API fails
        const newGame = {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          team1: { ...team1, total: getTeamTotal(team1) },
          team2: { ...team2, total: getTeamTotal(team2) },
        };
        setPastGames([newGame, ...pastGames]);
      } finally {
        setIsSaving(false);
      }
    }
    setTeam1({ name: '', players: [], bonusPoints: 0 });
    setTeam2({ name: '', players: [], bonusPoints: 0 });
    setShowExitModal(false);
    setCurrentPage('home');
  };

  const handleBackClick = () => {
    if (team1.players.length > 0 || team2.players.length > 0 || team1.name || team2.name) {
      setShowExitModal(true);
    } else {
      setCurrentPage('home');
    }
  };

  const handleDontSave = () => {
    setTeam1({ name: '', players: [], bonusPoints: 0 });
    setTeam2({ name: '', players: [], bonusPoints: 0 });
    setShowExitModal(false);
    setCurrentPage('home');
  };

  const startNewGame = () => {
    setTeam1({ name: '', players: [], bonusPoints: 0 });
    setTeam2({ name: '', players: [], bonusPoints: 0 });
    setError1('');
    setError2('');
    setCurrentPage('newGame');
  };

  const deleteGame = async (id) => {
    try {
      await api.deleteGame(id);
      setPastGames(pastGames.filter((game) => game.id !== id));
    } catch (error) {
      console.error('Failed to delete game:', error);
      // Still remove locally even if API fails
      setPastGames(pastGames.filter((game) => game.id !== id));
    }
  };

  // Home Page
  if (currentPage === 'home') {
    return (
      <SafeAreaView style={styles.homeContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.homeContent}>
          <Text style={styles.homeTitle}>Basketball</Text>
          <Text style={styles.homeSubtitle}>Stat Tracker</Text>
          <Text style={styles.homeDescription}>Track your game's points</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="white" style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.homeButtons}>
              <TouchableOpacity onPress={startNewGame} style={styles.newGameButton}>
                <Text style={styles.newGameButtonText}>New Game</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentPage('pastGames')} style={styles.pastGamesButton}>
                <Text style={styles.pastGamesButtonText}>Past Games</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // New Game Page
  if (currentPage === 'newGame') {
    return (
      <SafeAreaView style={styles.gameContainer}>
        <StatusBar barStyle="light-content" />
        <ConfirmModal
          visible={showExitModal}
          onSave={saveGame}
          onDontSave={handleDontSave}
          onCancel={() => setShowExitModal(false)}
        />

        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={handleBackClick}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <View style={styles.scoreDisplay}>
            <View style={styles.scoreBoxBlue}>
              <Text style={styles.scoreTextBlue}>{getTeamTotal(team1)}</Text>
            </View>
            <Text style={styles.scoreDash}>-</Text>
            <View style={styles.scoreBoxRed}>
              <Text style={styles.scoreTextRed}>{getTeamTotal(team2)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={saveGame}
            disabled={(team1.players.length === 0 && team2.players.length === 0) || isSaving}
            style={[
              styles.saveButton,
              ((team1.players.length === 0 && team2.players.length === 0) || isSaving) && styles.saveButtonDisabled,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#9ca3af" />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  (team1.players.length === 0 && team2.players.length === 0) && styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.teamsContainer}
        >
          <TeamPanel
            team={team1}
            onTeamNameChange={(name) => updateTeamName(1, name)}
            teamNum={1}
            newPlayer={newPlayer1}
            onNewPlayerChange={setNewPlayer1}
            onAddPlayer={() => addPlayer(1)}
            onRemovePlayer={(id) => removePlayer(1, id)}
            onUpdatePoints={(id, delta) => updatePoints(1, id, delta)}
            onUpdateFouls={(id, delta) => updateFouls(1, id, delta)}
            onUpdateTeamPoints={(delta) => updateTeamPoints(1, delta)}
            teamTotal={getTeamTotal(team1)}
            bgColor="#2563eb"
            accentColor="#1d4ed8"
            error={error1}
          />
          <TeamPanel
            team={team2}
            onTeamNameChange={(name) => updateTeamName(2, name)}
            teamNum={2}
            newPlayer={newPlayer2}
            onNewPlayerChange={setNewPlayer2}
            onAddPlayer={() => addPlayer(2)}
            onRemovePlayer={(id) => removePlayer(2, id)}
            onUpdatePoints={(id, delta) => updatePoints(2, id, delta)}
            onUpdateFouls={(id, delta) => updateFouls(2, id, delta)}
            onUpdateTeamPoints={(delta) => updateTeamPoints(2, delta)}
            teamTotal={getTeamTotal(team2)}
            bgColor="#dc2626"
            accentColor="#b91c1c"
            error={error2}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Past Games Page
  if (currentPage === 'pastGames') {
    return (
      <SafeAreaView style={styles.pastGamesContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.pastGamesHeader}>
          <TouchableOpacity onPress={() => setCurrentPage('home')}>
            <Text style={styles.backButtonOrange}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.pastGamesTitle}>Past Games</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.pastGamesList}>
          {pastGames.length === 0 ? (
            <View style={styles.noGamesContainer}>
              <Text style={styles.noGamesText}>No games saved yet. Play a game and save it to see it here.</Text>
            </View>
          ) : (
            pastGames.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                  <Text style={styles.gameDate}>{game.date}</Text>
                  <TouchableOpacity onPress={() => deleteGame(game.id)}>
                    <Text style={styles.deleteButton}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.gameScoreContainer}>
                  <View style={styles.gameTeamScore}>
                    <Text style={styles.gameTeamName1}>{game.team1.name || 'Team 1'}</Text>
                    <Text style={styles.gameTeamTotal1}>{game.team1.total}</Text>
                  </View>
                  <Text style={styles.vsText}>vs</Text>
                  <View style={styles.gameTeamScore}>
                    <Text style={styles.gameTeamName2}>{game.team2.name || 'Team 2'}</Text>
                    <Text style={styles.gameTeamTotal2}>{game.team2.total}</Text>
                  </View>
                </View>

                <View style={styles.gamePlayersContainer}>
                  <View style={styles.gameTeamPlayers}>
                    <Text style={styles.playersLabel}>{game.team1.name || 'Team 1'} Players</Text>
                    {game.team1.players.map((player) => (
                      <View key={player.id} style={styles.playerStatRow}>
                        <Text style={styles.playerStatName}>#{player.number} {player.name}</Text>
                        <Text style={styles.playerStatValue1}>{player.points} pts | {player.fouls} fls</Text>
                      </View>
                    ))}
                    {game.team1.players.length === 0 && <Text style={styles.noPlayersSmall}>No players</Text>}
                  </View>
                  <View style={styles.gameTeamPlayers}>
                    <Text style={styles.playersLabel}>{game.team2.name || 'Team 2'} Players</Text>
                    {game.team2.players.map((player) => (
                      <View key={player.id} style={styles.playerStatRow}>
                        <Text style={styles.playerStatName}>#{player.number} {player.name}</Text>
                        <Text style={styles.playerStatValue2}>{player.points} pts | {player.fouls} fls</Text>
                      </View>
                    ))}
                    {game.team2.players.length === 0 && <Text style={styles.noPlayersSmall}>No players</Text>}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Home Page
  homeContainer: {
    flex: 1,
    backgroundColor: '#ea580c',
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  homeTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  homeSubtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  homeDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    marginBottom: 48,
  },
  homeButtons: {
    width: '100%',
    maxWidth: 280,
    gap: 16,
  },
  newGameButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#ea580c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pastGamesButton: {
    backgroundColor: '#9a3412',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  pastGamesButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Game Page
  gameContainer: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1f2937',
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBoxBlue: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreBoxRed: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreTextBlue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreTextRed: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreDash: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  saveButtonText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  teamsContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  // Team Panel
  teamPanel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  teamNameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  teamTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 12,
  },
  teamTotalValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  teamTotalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamTotalButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  teamTotalButtonMinus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamTotalButtonMinusText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addPlayerForm: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  addPlayerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  numberInput: {
    width: 45,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    fontWeight: 'bold',
    color: '#1f2937',
    fontSize: 14,
  },
  errorText: {
    color: '#fef08a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  playerList: {
    flex: 1,
  },
  noPlayersText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 15,
  },
  removeText: {
    color: '#dc2626',
    fontSize: 10,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statButtonMinus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statButtonPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statButtonFoul: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
  },
  statButtonTextWhite: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
  statValueContainer: {
    alignItems: 'center',
    width: 32,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalMessage: {
    color: '#6b7280',
    marginBottom: 24,
  },
  modalButtonSave: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonSaveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonDontSave: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonDontSaveText: {
    color: '#1f2937',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#6b7280',
    fontSize: 14,
  },

  // Past Games Page
  pastGamesContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  pastGamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButtonOrange: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pastGamesTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pastGamesList: {
    flex: 1,
    padding: 16,
  },
  noGamesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noGamesText: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  gameDate: {
    color: '#6b7280',
    fontSize: 12,
  },
  deleteButton: {
    color: '#dc2626',
    fontSize: 12,
  },
  gameScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  gameTeamScore: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gameTeamName1: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
  },
  gameTeamTotal1: {
    color: '#2563eb',
    fontSize: 32,
    fontWeight: 'bold',
  },
  gameTeamName2: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 12,
  },
  gameTeamTotal2: {
    color: '#dc2626',
    fontSize: 32,
    fontWeight: 'bold',
  },
  vsText: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gamePlayersContainer: {
    flexDirection: 'row',
  },
  gameTeamPlayers: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  playersLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 8,
  },
  playerStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerStatName: {
    color: '#374151',
    fontSize: 11,
    flex: 1,
  },
  playerStatValue1: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '600',
  },
  playerStatValue2: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
  },
  noPlayersSmall: {
    color: '#9ca3af',
    fontSize: 11,
  },
});
