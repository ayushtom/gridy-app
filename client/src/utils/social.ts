export const shareOnTwitter = (text: string) => {
  return;
  const encodeText = encodeURIComponent(text);
  window.open(`https://twitter.com/intent/tweet?text=${encodeText}`);
};

export const BUY_SUCCESS_TEXT = `🚀 Just bought a tile in #GridOfGreed! 💎 Let’s see if my luck holds up. Who’s ready to join the hunt?\n\nGet in on the action 👉 ${
  import.meta.env.VITE_PUBLIC_APP_LINK
}  \n\n#GemRush #TreasureHunt`;

export const GEMSTONE_FIND_SUCCESS_TEXT = `🎉 I just uncovered a gemstone in #GridOfGreed! 💎 Got lucky this time, and the treasure hunt’s still on. Who’s next to score?\n\nJump in and try your luck 👉 ${
  import.meta.env.VITE_PUBLIC_APP_LINK
}\n\n#GemRush #TreasureHunt #PlayToWin`;

export const EARN_POINTS_SUCCESS_TEXT = `🤑 Just earned points in #GridOfGreed! 🚀 My stake’s growing while I sleep. Who’s ready to make money work for them?\n\nJoin the fun 👉  
   ${
     import.meta.env.VITE_PUBLIC_APP_LINK
   }\n\n#GemRush #TreasureHunt #PlayToWin`;
