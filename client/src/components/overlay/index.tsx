import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import usePlayerStore from "../../store/playerStore";
import useGameStore from "../../store/gameStore";
import { Abi, ArgsOrCalldata } from "starknet";
import { useGameContract } from "../../hooks/contract";
import { useAccount, useContractRead } from "@starknet-react/core";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import MuteButton from "../ui/button/mute";
import { ApiService } from "../../services/apiService";
import { PRICE_DIVISOR } from "../../utils/constants";
import Loader from "../ui/loader";

const HELPER_TEXT_ANIMATION_DURATION = 0.5;
const HELPER_TEXT_ANIMATION_DELAY = 10;

const HELPER_TEXT = [
  "Drag the mouse over the island to rotate the view",
  "Click on the tiles to reveal the hidden gemstones",
  "Buy more tiles to click to increase your chances of winning",
  "Each tile can be clicked only once",
  "Find gemstones to win rewards",
];

export function TopOverlay() {
  const { remainingClicks } = usePlayerStore();
  const { contract } = useGameContract();
  const { address } = useAccount();

  const {
    totalGemstones,
    setTotalGemstones,
    totalFoundGemstones,
    setTotalFoundGemstones,
    prizePool,
    setPrizePool,
    setPrizePoolRaw,
  } = useGameStore();
  const { numberOfPoints, setNumberOfPoints } = usePlayerStore();

  const [helperText, setHelperText] = useState(HELPER_TEXT[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHelperText(
        HELPER_TEXT[Math.floor(Math.random() * HELPER_TEXT.length)]
      );
    }, 2 * (HELPER_TEXT_ANIMATION_DURATION + HELPER_TEXT_ANIMATION_DELAY) * 1000);

    return () => clearInterval(interval);
  }, []);

  // fetch gemstones found minted by user
  const {
    data: userPointsData,
    error: userPointsError,
    isLoading: userPointsLoading,
  } = useContractRead({
    address: contract?.address as string,
    abi: contract?.abi as Abi,
    functionName: "get_points_count",
    args: [address] as ArgsOrCalldata,
    watch: true,
    refetchInterval: 30000,
  });

  const {
    data: prizePoolData,
    error: prizePoolError,
    isLoading: prizePoolLoading,
  } = useContractRead({
    address: contract?.address as string,
    abi: contract?.abi as Abi,
    functionName: "get_prize_pool",
    args: [] as ArgsOrCalldata,
    watch: true,
    refetchInterval: 30000,
  });

  // fetch total gemstones
  const { data: totalGemstonesCountData, error: totalGemstonesCountError } =
    useContractRead({
      address: contract?.address as string,
      abi: contract?.abi as Abi,
      functionName: "get_total_gemstones",
      args: [] as ArgsOrCalldata,
    });

  // fetch total gemstones found
  const {
    data: totalFoundGemstonesCountData,
    error: totalFoundGemstonesCountError,
  } = useContractRead({
    address: contract?.address as string,
    abi: contract?.abi as Abi,
    functionName: "get_total_gemstones_found",
    args: [] as ArgsOrCalldata,
    watch: true,
  });

  useEffect(() => {
    if (userPointsError || !userPointsData) return;
    setNumberOfPoints(Number(userPointsData));
  }, [address, setNumberOfPoints, userPointsData, userPointsError]);

  useEffect(() => {
    if (totalGemstonesCountError || !totalGemstonesCountData) return;

    setTotalGemstones(Number(totalGemstonesCountData));
  }, [setTotalGemstones, totalGemstonesCountData, totalGemstonesCountError]);

  useEffect(() => {
    if (totalFoundGemstonesCountError || !totalFoundGemstonesCountData) return;

    setTotalFoundGemstones(Number(totalFoundGemstonesCountData));
  }, [
    setTotalFoundGemstones,
    totalFoundGemstonesCountData,
    totalFoundGemstonesCountError,
  ]);

  useEffect(() => {
    if (prizePoolError || !prizePoolData) return;

    const data = prizePoolData as { val: bigint };

    setPrizePoolRaw(Number(data.val) / PRICE_DIVISOR);
    ApiService.getCoinQuote().then((quote) => {
      setPrizePool(Number(data.val) * Number(quote));
    });
  }, [prizePoolData, prizePoolError, setPrizePool, setPrizePoolRaw]);

  return (
    <>
      <div className=" absolute top-6 left-6 flex flex-row gap-16">
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
                    key={numberOfPoints}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className=" absolute left-6 text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-12 rounded-3xl"
                  >
                    {address ? (
                      userPointsLoading ? (
                        <>
                          <Loader />
                        </>
                      ) : (
                        numberOfPoints
                      )
                    ) : (
                      "0"
                    )}
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
                    {address ? remainingClicks : "0"}
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

      {localStorage.getItem("firstTimeUser") === "false" ? (
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

      <div className="absolute top-6 right-6 flex flex-row gap-16">
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
                    className=" absolute left-6 text-xl font-bold text-white bg-black bg-opacity-50 px-4 py-2 pl-16 rounded-3xl"
                  >
                    {prizePoolLoading ? (
                      <div className="px-4 py-1">
                        <Loader />
                      </div>
                    ) : (
                      `$${prizePool.toLocaleString()}`
                    )}
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
                      {totalFoundGemstones}/{totalGemstones}
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
}
