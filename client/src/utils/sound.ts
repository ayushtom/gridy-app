const errorAudio = new Audio("/audio/error_sound.mp3");
const mineAudio = new Audio("/audio/mine_sound.mp3");
const digAudio = new Audio("/audio/dig.mp3");
const moneyAudio = new Audio("/audio/money.mp3");
const winAudio = new Audio("/audio/winning.mp3");
const backgroundAudio = new Audio("/audio/background.mp3");

export const playErrorSound = () => {
  // stop any existing sound
  errorAudio.pause();
  errorAudio.volume = 0.08;
  errorAudio.currentTime = 0;

  // reset the sound
  errorAudio.play();
};

export const playMineSound = () => {
  // stop any existing sound
  mineAudio.pause();
  mineAudio.currentTime = 0;
  mineAudio.volume = 0.1;

  // reset the sound
  mineAudio.play();
};

export const playDigSound = () => {
  // stop any existing sound
  digAudio.pause();
  digAudio.currentTime = 0;
  digAudio.volume = 0.1;

  // reset the sound
  digAudio.play();
};

export const playMoneySound = () => {
  // stop any existing sound
  moneyAudio.pause();
  moneyAudio.currentTime = 0;

  // reset the sound
  moneyAudio.play();
};

export const playWinSound = () => {
  // stop any existing sound
  winAudio.pause();
  winAudio.currentTime = 0;
  winAudio.volume = 0.1;

  // reset the sound
  winAudio.play();
};

export const toggleBackgroudMusic = (val: boolean) => {
  if (val) {
    backgroundAudio.volume = 0.03;
    backgroundAudio.loop = true;
    backgroundAudio.play();
  } else {
    backgroundAudio.pause();
  }
};
