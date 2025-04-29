import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import MuteButton from "../components/ui/button/mute";

const HELPER_TEXT_ANIMATION_DURATION = 0.5;
const HELPER_TEXT_ANIMATION_DELAY = 10;

const HELPER_TEXT = [
  "Drag the mouse over the island to rotate the view",
  "Click on the tiles to reveal the hidden gemstones",
  "Buy more tiles to click to increase your chances of winning",
  "Each tile can be clicked only once",
  "Find gemstones to win rewards",
];

const DemoOverlay = ({
  userNumberOfGemstones,
  remainingClicks,
  prizePool,
  totalFoundGemstones,
}: {
  userNumberOfGemstones: number;
  remainingClicks: number;
  prizePool: number;
  totalFoundGemstones: number;
}) => {
  const [helperText, setHelperText] = useState(HELPER_TEXT[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHelperText(
        HELPER_TEXT[Math.floor(Math.random() * HELPER_TEXT.length)]
      );
    }, 2 * (HELPER_TEXT_ANIMATION_DURATION + HELPER_TEXT_ANIMATION_DELAY) * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className=" absolute top-6 left-6 flex flex-row gap-16 z-20">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ y: -350 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                className=" flex items-center pr-4 flex-row"
              >
                <div className="h-14 w-14 rounded-full flex-row flex items-center relative">
                  <motion.span
                    key={userNumberOfGemstones}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className=" absolute left-6 text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-12 rounded-3xl"
                  >
                    {userNumberOfGemstones ?? "0"}
                  </motion.span>
                  <img
                    loading="eager"
                    src={"/images/coin.webp"}
                    className="z-10"
                  />
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="px-2 py-1 bg-white rounded-3xl">
                Total Points Earned
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ y: -350 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.4,
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                className=" flex items-center pr-4 flex-row"
              >
                <div className="h-14 w-14 rounded-full flex-row flex items-center relative">
                  <motion.span
                    key={remainingClicks}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className=" absolute left-6 text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-12 rounded-3xl"
                  >
                    {remainingClicks ?? "0"}
                  </motion.span>

                  <img
                    loading="eager"
                    src={"/images/shovel_icon.webp"}
                    className=" z-10"
                  />
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="px-2 py-1 bg-white rounded-3xl">
                Shovels Remaining
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {localStorage.getItem("firstTimeUser") ? (
        <motion.div
          initial={{
            translateY: -100,
          }}
          animate={{
            translateY: 0,
          }}
          transition={{
            ease: "easeOut",
            duration: HELPER_TEXT_ANIMATION_DURATION,
            damping: 10,
            repeatType: "reverse",
            repeat: Infinity,
            repeatDelay: HELPER_TEXT_ANIMATION_DELAY,
          }}
          className="absolute top-6 w-full flex gap-2 justify-center cursor-pointer"
        >
          <p className="text-gray-600 px-4 py-2 backdrop-blur-lg rounded-3xl bg-white bg-opacity-50">
            {helperText}
          </p>
        </motion.div>
      ) : null}

      <div className="absolute top-6 right-6 flex flex-row gap-16 z-50">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ y: -350 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.4,
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                className=" flex items-center pr-4 flex-row mr-8"
              >
                <div className="h-18 w-18 rounded-full flex-row flex items-center relative">
                  <motion.span
                    key={prizePool}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className=" absolute left-6  text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-16 rounded-3xl"
                  >
                    ${prizePool.toLocaleString()}
                  </motion.span>

                  <img
                    loading="eager"
                    src={"/images/treasure_chest.webp"}
                    className=" z-10"
                    width={80}
                  />
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="px-2 py-1 bg-white rounded-3xl">Game Treasury</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ y: -350 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                className=" flex items-center pr-4 flex-row"
              >
                <div className="h-14 w-14 rounded-full flex-row flex items-center relative">
                  <img
                    loading="eager"
                    src={"/images/gemstone.webp"}
                    className=" z-10"
                    width={60}
                  />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalFoundGemstones}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className=" absolute left-6  text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-10 rounded-3xl"
                    >
                      {totalFoundGemstones}/{6}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="px-2 py-1 bg-white rounded-3xl">Gemstones Found</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <MuteButton />
      </div>
    </>
  );
};

export default DemoOverlay;
