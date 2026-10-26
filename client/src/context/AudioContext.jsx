import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  playClick as audioPlayClick,
  playSwoosh as audioPlaySwoosh,
  playSuccessChime as audioPlaySuccessChime,
  playStationChime as audioPlayStationChime,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/audio';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [soundActive, setSoundActive] = useState(isSoundEnabled);

  useEffect(() => {
    setSoundEnabled(soundActive);
  }, [soundActive]);

  const toggleSound = () => {
    setSoundActive((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        audioPlayClick();
      }
      return next;
    });
  };

  const playClick = () => {
    if (soundActive) audioPlayClick();
  };

  const playSwoosh = () => {
    if (soundActive) audioPlaySwoosh();
  };

  const playSuccessChime = () => {
    if (soundActive) audioPlaySuccessChime();
  };

  const playStationChime = () => {
    if (soundActive) audioPlayStationChime();
  };

  return (
    <AudioContext.Provider
      value={{
        soundActive,
        toggleSound,
        playClick,
        playSwoosh,
        playSuccessChime,
        playStationChime,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
