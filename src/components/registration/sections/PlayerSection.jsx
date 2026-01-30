/**
 * Player Section Component
 *
 * Handles both single-player and multi-player modes.
 * Multi-player mode allows adding/removing players (siblings).
 */

import { motion } from 'framer-motion';
import { User, Plus, X } from 'lucide-react';
import Select from '@components/common/Select';
import DatePicker from '@components/common/DatePicker';

const PlayerSection = ({ formik, config }) => {
  const { multiPlayer, levelOptions = [] } = {
    multiPlayer: config.features.multiPlayer,
    levelOptions: config.levelOptions,
  };

  // Single player helpers
  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  // Multi-player helpers
  const getPlayerFieldError = (index, field) => {
    const touchedPlayers = formik.touched.players;
    const errorPlayers = formik.errors.players;
    if (touchedPlayers?.[index]?.[field] && errorPlayers?.[index]?.[field]) {
      return errorPlayers[index][field];
    }
    return null;
  };

  const MAX_PLAYERS = 6;

  const addPlayer = () => {
    const players = formik.values.players || [];
    if (players.length >= MAX_PLAYERS) return;
    formik.setFieldValue('players', [
      ...players,
      {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        levelOfPlay: '',
      },
    ]);
  };

  const removePlayer = index => {
    const players = formik.values.players || [];
    if (players.length === 1) return;
    formik.setFieldValue(
      'players',
      players.filter((_, i) => i !== index)
    );
  };

  const handlePlayerChange = (index, field, value) => {
    formik.setFieldValue(`players.${index}.${field}`, value);
  };

  const handlePlayerBlur = (index, field) => {
    formik.setFieldTouched(`players.${index}.${field}`, true);
  };

  // Render single player form
  if (!multiPlayer) {
    return (
      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-500" />
          Player Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="playerFirstName"
              className="block text-sm font-medium text-neutral-light mb-2"
            >
              First Name *
            </label>
            <input
              type="text"
              id="playerFirstName"
              name="playerFirstName"
              {...formik.getFieldProps('playerFirstName')}
              className={`w-full px-4 py-2 bg-neutral-bg border ${
                getFieldError('playerFirstName') ? 'border-red-500' : 'border-neutral-dark'
              } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
              placeholder="John"
            />
            {getFieldError('playerFirstName') && (
              <p className="text-red-400 text-sm mt-1">{getFieldError('playerFirstName')}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="playerLastName"
              className="block text-sm font-medium text-neutral-light mb-2"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="playerLastName"
              name="playerLastName"
              {...formik.getFieldProps('playerLastName')}
              className={`w-full px-4 py-2 bg-neutral-bg border ${
                getFieldError('playerLastName') ? 'border-red-500' : 'border-neutral-dark'
              } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
              placeholder="Doe"
            />
            {getFieldError('playerLastName') && (
              <p className="text-red-400 text-sm mt-1">{getFieldError('playerLastName')}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="playerDateOfBirth"
              className="block text-sm font-medium text-neutral-light mb-2"
            >
              Date of Birth *
            </label>
            <DatePicker
              id="playerDateOfBirth"
              name="playerDateOfBirth"
              value={formik.values.playerDateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('playerDateOfBirth')}
              placeholder="Select date of birth"
              maxDate={new Date()}
            />
            {getFieldError('playerDateOfBirth') && (
              <p className="text-red-400 text-sm mt-1">{getFieldError('playerDateOfBirth')}</p>
            )}
          </div>

          {/* Level of Play */}
          <div>
            <label
              htmlFor="playerLevelOfPlay"
              className="block text-sm font-medium text-neutral-light mb-2"
            >
              Level of Play *
            </label>
            <Select
              id="playerLevelOfPlay"
              name="playerLevelOfPlay"
              value={formik.values.playerLevelOfPlay}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('playerLevelOfPlay')}
              placeholder="Select level of play"
              options={levelOptions}
            />
            {getFieldError('playerLevelOfPlay') && (
              <p className="text-red-400 text-sm mt-1">{getFieldError('playerLevelOfPlay')}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render multi-player form
  const players = formik.values.players || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-teal-500" />
          Player Information
        </h3>
        <motion.button
          type="button"
          onClick={addPlayer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={players.length >= MAX_PLAYERS}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            players.length >= MAX_PLAYERS
              ? 'bg-neutral-dark/50 text-neutral-light/50 cursor-not-allowed'
              : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
          }`}
        >
          <Plus className="w-5 h-5" />
          {players.length >= MAX_PLAYERS ? `Max ${MAX_PLAYERS} Players` : 'Add Sibling'}
        </motion.button>
      </div>

      {players.map((player, index) => (
        <div key={index} className={`${index > 0 ? 'border-t border-neutral-dark pt-6 mt-6' : ''}`}>
          {players.length > 1 && (
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Player {index + 1}</h4>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                htmlFor={`player_${index}_firstName`}
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                First Name *
              </label>
              <input
                type="text"
                id={`player_${index}_firstName`}
                value={player.firstName}
                onChange={e => handlePlayerChange(index, 'firstName', e.target.value)}
                onBlur={() => handlePlayerBlur(index, 'firstName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getPlayerFieldError(index, 'firstName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="John"
              />
              {getPlayerFieldError(index, 'firstName') && (
                <p className="text-red-400 text-sm mt-1">
                  {getPlayerFieldError(index, 'firstName')}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor={`player_${index}_lastName`}
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Last Name *
              </label>
              <input
                type="text"
                id={`player_${index}_lastName`}
                value={player.lastName}
                onChange={e => handlePlayerChange(index, 'lastName', e.target.value)}
                onBlur={() => handlePlayerBlur(index, 'lastName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getPlayerFieldError(index, 'lastName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {getPlayerFieldError(index, 'lastName') && (
                <p className="text-red-400 text-sm mt-1">
                  {getPlayerFieldError(index, 'lastName')}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor={`player_${index}_dateOfBirth`}
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Date of Birth *
              </label>
              <DatePicker
                id={`player_${index}_dateOfBirth`}
                name={`players.${index}.dateOfBirth`}
                value={player.dateOfBirth}
                onChange={e => handlePlayerChange(index, 'dateOfBirth', e.target.value)}
                onBlur={() => handlePlayerBlur(index, 'dateOfBirth')}
                error={getPlayerFieldError(index, 'dateOfBirth')}
                placeholder="Select date of birth"
                maxDate={new Date()}
              />
              {getPlayerFieldError(index, 'dateOfBirth') && (
                <p className="text-red-400 text-sm mt-1">
                  {getPlayerFieldError(index, 'dateOfBirth')}
                </p>
              )}
            </div>

            {/* Level of Play */}
            <div>
              <label
                htmlFor={`player_${index}_levelOfPlay`}
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Level of Play *
              </label>
              <Select
                id={`player_${index}_levelOfPlay`}
                name={`players.${index}.levelOfPlay`}
                value={player.levelOfPlay}
                onChange={e => handlePlayerChange(index, 'levelOfPlay', e.target.value)}
                onBlur={() => handlePlayerBlur(index, 'levelOfPlay')}
                error={getPlayerFieldError(index, 'levelOfPlay')}
                placeholder="Select level of play"
                options={levelOptions}
              />
              {getPlayerFieldError(index, 'levelOfPlay') && (
                <p className="text-red-400 text-sm mt-1">
                  {getPlayerFieldError(index, 'levelOfPlay')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerSection;
