import { Dispatch, useCallback, useEffect, useState } from "react";
import { Layer } from "../components/game/tile";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import {
  HEIGHT,
  INSTRUCTIONS,
  NUMBER_OF_LAYERS,
  TREE_POSITION_INDEX,
  WIDTH,
} from "../utils/constants";
import useGameStore from "../store/gameStore";
import { motion as planeMotion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { useGameContract } from "../hooks/contract";
import {
  useAccount,
  useConnect,
  useContractRead,
  useWaitForTransaction,
} from "@starknet-react/core";
import { Abi, ArgsOrCalldata, cairo, CallData } from "starknet";
import { establishConnection } from "../utils/websocket";
import { computeWinProbability, formatSellingPrice } from "../utils/number";
import BottomSheet from "../components/ui/bottomsheet";
import { X } from "lucide-react";
import Modal from "../components/ui/modal";
import Divider from "../components/ui/divider";
import usePlayerStore from "../store/playerStore";
import Confetti from "react-confetti";
import { ApiService } from "../services/apiService";
import RippleLoader from "../components/ui/loader/ripple";
import { toast } from "sonner";
import { Connector, useStarknetkitConnectModal } from "starknetkit";
import gameContractCalls from "../utils/calldata/gameContract";
import Button from "../components/ui/button";
import {
  BUY_SUCCESS_TEXT,
  GEMSTONE_FIND_SUCCESS_TEXT,
  shareOnTwitter,
} from "../utils/social";
import ButtonShapeTabs from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  playDigSound,
  playErrorSound,
  playMineSound,
  playWinSound,
  toggleBackgroudMusic,
  playMoneySound,
} from "../utils/sound";
import { availableConnectors } from "../store/starknetProvider";
import { getMaskedIdentityFromIndex } from "../utils/layers";

const OPTIONS = [5, 10, 20, 30];

const BuyOrMine = ({
  setShowBottomSheet,
  setShowPendingClaimsModal,
  setMineTransactionHash,
  setAllowSelectionEdit,
  allowSelectionEdit,
  setShowInstructions,
}: {
  setShowBottomSheet: Dispatch<React.SetStateAction<boolean>>;
  setShowPendingClaimsModal: Dispatch<React.SetStateAction<boolean>>;
  setMineTransactionHash: Dispatch<React.SetStateAction<string>>;
  setAllowSelectionEdit: Dispatch<React.SetStateAction<boolean>>;
  allowSelectionEdit: boolean;
  setShowInstructions: Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { selectedTile, setSelectedTile } = usePlayerStore((state) => state);
  const {
    remainingClicks,
    setRemainingClicks,
    formattedSelectedTile,
    setFormattedSelectedTile,
  } = usePlayerStore();
  const { account } = useAccount();
  const { connectAsync } = useConnect();
  const [loading, setLoading] = useState(false);
  const { audioEnabled } = useGameStore();

  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: availableConnectors as Connector[],
  });

  const connectWallet = useCallback(async () => {
    setLoading(true);
    const { connector } = await starknetkitConnectModal();
    if (!connector) {
      setLoading(false);
      return;
    }
    await connectAsync({ connector });
    localStorage.setItem("starkurabu-connectedWallet", connector.id);
    setLoading(false);
  }, [connectAsync, starknetkitConnectModal]);

  const handleClaimModal = useCallback(() => {
    if (!account) {
      toast.error("Please connect your wallet to manage your points");
      return;
    }
    setShowPendingClaimsModal(true);
  }, [account, setShowPendingClaimsModal]);

  const undoSelection = useCallback(() => {
    setRemainingClicks(remainingClicks + selectedTile.length);
    setSelectedTile(-1);
    setFormattedSelectedTile(-1);
  }, [
    remainingClicks,
    selectedTile,
    setFormattedSelectedTile,
    setRemainingClicks,
    setSelectedTile,
  ]);

  const mineTile = useCallback(async () => {
    try {
      const res = await gameContractCalls.mine(
        formattedSelectedTile.map((tile) => tile.toString())
      );

      const transactionResult = account
        ?.execute(res)
        .then((result) => {
          return result;
        })
        .catch(() => {
          return null;
        });

      return transactionResult;
    } catch (error) {
      return null;
    }
  }, [account, formattedSelectedTile]);

  const handleMintOrBuy = useCallback(async () => {
    if (!account) {
      await connectWallet();
    } else if (selectedTile.length > 0) {
      if (audioEnabled) playMineSound();
      // make transaction call
      const result = await mineTile();
      if (!result) return;
      setAllowSelectionEdit(false);
      setMineTransactionHash(result.transaction_hash);
    } else {
      // buy
      setShowBottomSheet(true);
    }
  }, [
    account,
    audioEnabled,
    connectWallet,
    mineTile,
    selectedTile,
    setAllowSelectionEdit,
    setMineTransactionHash,
    setShowBottomSheet,
  ]);
  return (
    <div className="fixed bottom-4 w-full flex justify-between px-8">
      <div className=" flex gap-3 items-center sm:w-full w-auto ">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <planeMotion.button
                onClick={handleClaimModal}
                whileTap={{
                  scale: 0.9,
                }}
                className=" bg-gray-100 border-2 w-20 h-20 rounded-full shadow-2xl flex justify-center items-center cursor-pointer"
              >
                <img
                  loading="eager"
                  src={"/images/cashier_machine.webp"}
                  width={40}
                />
              </planeMotion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="px-2 py-1 bg-white rounded-3xl">Manage Points</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className=" w-full flex flex-col items-center justify-end">
        <div className=" flex items-center gap-4 ml-12 my-first-step">
          <div className="w-auto">
            <Button
              size="lg"
              text={
                !account
                  ? "Get Started"
                  : selectedTile.length > 0
                  ? "Mine"
                  : "Buy"
              }
              onClick={handleMintOrBuy}
              loading={loading}
              wiggle={!account}
            />
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <planeMotion.button
                  className="  bg-red-600 w-10 h-10 cursor-pointer flex justify-center items-center rounded-full shadow-lg"
                  initial={{ x: -80, opacity: 0 }}
                  animate={{
                    x: allowSelectionEdit && selectedTile.length > 0 ? 0 : -80,
                    opacity:
                      allowSelectionEdit && selectedTile.length > 0 ? 1 : 0,
                    pointerEvents:
                      allowSelectionEdit && selectedTile.length > 0
                        ? "auto"
                        : "none",
                  }}
                  transition={{ duration: 0.5, type: "spring" }}
                  onClick={undoSelection}
                >
                  <X className=" text-white" />
                </planeMotion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="px-2 py-1 bg-white rounded-3xl">Undo Selection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="w-full flex items-end">
        <div className="flex flex-row gap-3 items-end w-full justify-end">
          <p
            onClick={() => setShowInstructions(true)}
            className=" underline text-gray-500 decoration-gray-500 cursor-pointer"
          >
            How to play
          </p>
          <a
            href="https://t.me/+LQDTOpsFJrxlZDg1"
            className=" underline text-gray-500 decoration-gray-500 cursor-pointer"
          >
            Report An Issue?
          </a>
        </div>
      </div>
    </div>
  );
};

export default function Playground() {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const {
    selectedTile,
    setSelectedTile,
    setFormattedSelectedTile,
    formattedSelectedTile,
    remainingClicks,
    setRemainingClicks,
    numberOfPoints,
  } = usePlayerStore((state) => state);
  const {
    totalGemstones,
    totalFoundGemstones,
    removedTiles,
    audioEnabled,
    setRemovedTiles,
    prizePoolRaw,
  } = useGameStore();
  const { address } = useAccount();
  const { contract } = useGameContract();
  const [hovered, setHovered] = useState(-1);
  const [selectedBuyOption, setSelectedBuyOption] = useState<number>(
    OPTIONS[1]
  );
  const [pendingClaims, setPendingClaims] = useState([]);
  const [showPendingClaimsModal, setShowPendingClaimsModal] = useState(false);
  const [mineTransactionHash, setMineTransactionHash] = useState<string>("");
  const [buyTransactionHash, setBuyTransactionHash] = useState<string>("");
  const [showGemstoneModal, setShowGemstoneModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gemstoneCheckLoading, setGemstoneCheckLoading] = useState(false);
  const [containsGemstone, setContainsGemstone] = useState(false);
  const [allowSelectionEdit, setAllowSelectionEdit] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsSlideIndex, setInstructionsSlideIndex] = useState(0);
  const [blocksContainingGemstone, setBlocksContainingGemstone] = useState<
    number[]
  >([]);
  const [showSuccessfulClaimModal, setShowSuccessfulClaimModal] =
    useState(false);
  const [showBigGridInformation, setShowBigGridInformation] = useState(false);
  const { account } = useAccount();
  const [winningProbability, setWinningProbability] = useState(0);
  const [clickPackPrice, setClickPackPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPointsTab, setSelectedPointsTab] = useState("Claim Points");
  const [pointsToSell, setPointsToSell] = useState<number>(0);

  useEffect(() => {
    toggleBackgroudMusic(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    const remainingGemstones = totalGemstones - totalFoundGemstones;
    const remainingTiles =
      WIDTH * HEIGHT * NUMBER_OF_LAYERS - removedTiles.length;

    setWinningProbability(
      computeWinProbability(
        Number(remainingGemstones),
        Number(remainingTiles),
        Number(selectedBuyOption)
      )
    );
  }, [totalGemstones, totalFoundGemstones, removedTiles, selectedBuyOption]);

  const checkIfContainsGemstone = useCallback(async () => {
    // fetch gemstone check
    for (let i = 0; i < formattedSelectedTile.length; i++) {
      const res = await ApiService.checkForGemstone(formattedSelectedTile[i]);
      if (res && res?.result === true) {
        setBlocksContainingGemstone((prev) => {
          if (prev.includes(formattedSelectedTile[i])) return prev;
          return [...prev, formattedSelectedTile[i]];
        });
      }
    }

    if (blocksContainingGemstone.length > 0) {
      setShowConfetti(true);
      if (audioEnabled) playWinSound();
      setContainsGemstone(true);
    } else {
      setContainsGemstone(false);
    }
    setGemstoneCheckLoading(false);
  }, [audioEnabled, blocksContainingGemstone.length, formattedSelectedTile]);

  const socketHandler = useCallback(() => {
    establishConnection((i: number) => setRemovedTiles([i]));
  }, [setRemovedTiles]);

  const fetchPageData = useCallback(async () => {
    const minedBlocks = ApiService.fetchMinedBlocks();

    toast.promise(minedBlocks, {
      loading: "Fetching latest mined blocks",
      success: (data) => {
        const arr = data?.blocks?.map((block) => {
          return block.block_id;
        });

        setRemovedTiles(arr);
        return `Successfully fetched latest mined blocks`;
      },
      error: () => {
        return "Error fetching latest mined blocks";
      },
    });
  }, [setRemovedTiles]);

  const fetchPendingClaims = useCallback(async () => {
    if (!address) return;
    const pendingClaims = await ApiService.getPendingClaims(address);

    if (!pendingClaims || pendingClaims?.message) {
      return;
    }
    setPendingClaims(pendingClaims?.result);
  }, [address]);
  useEffect(() => {
    if (!address) return;
    fetchPendingClaims();
  }, [address, fetchPendingClaims]);

  // launch instructions
  useEffect(() => {
    if (
      localStorage.getItem("firstTimeUser") &&
      localStorage.getItem("firstTimeUser") === "false" &&
      (!localStorage.getItem("notifyFirstTimeUser") ||
        localStorage.getItem("notifyFirstTimeUser") === "false")
    ) {
      setTimeout(() => {
        setShowBigGridInformation(true);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    socketHandler();
    fetchPageData();
  }, [fetchPageData, socketHandler]);

  const handleCloseBuyModal = useCallback(() => {
    setShowBuyModal(false);
    setBuyTransactionHash("");
    setShowConfetti(false);
  }, [setShowBuyModal]);

  const handleClaimGemstone = useCallback(
    async (blockIds: string[]) => {
      try {
        const finalCalldata = await Promise.all(
          blockIds.map(async (blockId) => {
            const claimParams = await ApiService.getGemstoneClaimParams(
              Number(blockId)
            );
            const res = await gameContractCalls.claimGemstone({
              block_id: Number(blockId),
              game_id: claimParams.game_id,
              proof: claimParams.proof,
              nonce: claimParams.nonce,
              prize: claimParams.prize,
            });

            return res;
          })
        );

        const transactionResult = account
          ?.execute(finalCalldata)
          .then((result) => {
            return result;
          })
          .catch(() => {
            return null;
          });

        return transactionResult;
      } catch (err) {
        console.log(err);
        return null;
      }
    },
    [account]
  );

  const handleCloseGemstoneModal = useCallback(async () => {
    if (containsGemstone) {
      setLoading(true);
      const res = await handleClaimGemstone(
        blocksContainingGemstone.map((block) => block.toString())
      );
      if (!res) {
        if (audioEnabled) playErrorSound();
        toast.error("Something went wrong. Please try again later");
      }
      setBlocksContainingGemstone([]);
      setShowSuccessfulClaimModal(true);
    }
    setShowConfetti(false);
    setLoading(false);
    setShowGemstoneModal(false);
    setRemovedTiles(formattedSelectedTile);
    setSelectedTile(-1);
    setFormattedSelectedTile(-1);
    setContainsGemstone(false);
    setMineTransactionHash("");
    setAllowSelectionEdit(true);
    setShowGemstoneModal(false);
  }, [
    containsGemstone,
    setRemovedTiles,
    formattedSelectedTile,
    setSelectedTile,
    setFormattedSelectedTile,
    handleClaimGemstone,
    blocksContainingGemstone,
    audioEnabled,
  ]);

  useEffect(() => {
    if (buyTransactionHash?.length > 0) {
      setShowBuyModal(true);
      setShowConfetti(true);
    }
  }, [buyTransactionHash]);

  // TODO
  const { status: mineTransactionStatus } = useWaitForTransaction({
    hash: mineTransactionHash,
    retry: true,
  });

  const handleTreeClick = useCallback(() => {
    toast.success("Not here to hurt the trees 🌲", {});
  }, []);

  const handleMineAction = useCallback(async () => {
    // add delay so that transaction can be confirmed to be mined by the rpc
    setTimeout(async () => {
      await checkIfContainsGemstone();
    }, 4000);
  }, [checkIfContainsGemstone]);

  useEffect(() => {
    if (
      !mineTransactionStatus ||
      !mineTransactionHash ||
      mineTransactionHash?.length === 0
    )
      return;

    setGemstoneCheckLoading(true);
    setShowGemstoneModal(true);

    if (mineTransactionStatus === "success") {
      handleMineAction();
    }
  }, [handleMineAction, mineTransactionHash, mineTransactionStatus]);

  // fetch prize pool
  const { data: clickCount, error: clickCountError } = useContractRead({
    address: contract?.address as string,
    abi: contract?.abi as Abi,
    functionName: "get_user_pending_shovels",
    args: [address] as ArgsOrCalldata,
    watch: true,
    refetchInterval: 30000,
  });

  // fetch prize pool
  const { data: pointsCount } = useContractRead({
    address: contract?.address as string,
    abi: contract?.abi as Abi,
    functionName: "get_total_points",
    args: [] as ArgsOrCalldata,
    watch: true,
    refetchInterval: 30000,
  });

  // fetch prize pool
  const { data: clickPackPriceData, error: clickPackPriceError } =
    useContractRead({
      address: contract?.address as string,
      abi: contract?.abi as Abi,
      functionName: "get_existing_price",
      args: [selectedBuyOption] as ArgsOrCalldata,
    });

  const formatEthToUsd = useCallback(async (price: bigint) => {
    try {
      const formattedprice = await formatSellingPrice(price);
      setClickPackPrice(Number(formattedprice));
    } catch (error) {
      console.error(error);
      setClickPackPrice(0);
    }
  }, []);

  useEffect(() => {
    if (!clickPackPriceData || clickPackPriceError) return;
    const data = clickPackPriceData as { val: bigint };
    formatEthToUsd(data.val);
  }, [clickPackPriceData, clickPackPriceError, formatEthToUsd]);

  const buyShovels = useCallback(async () => {
    try {
      const res = await gameContractCalls.buyShovels(selectedBuyOption);
      if (!account || !clickPackPriceData) return;

      const transactionResult = account
        ?.execute([
          {
            contractAddress: import.meta.env.VITE_TOKEN_ADDRESS,
            entrypoint: "approve",
            calldata: CallData.compile({
              recipient: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
              amount: cairo.uint256(
                (clickPackPriceData as { val: string })?.val
              ),
            }),
          },
          res,
        ])
        .then((result) => {
          return result;
        })
        .catch(() => {
          return null;
        });

      return transactionResult;
    } catch (error) {
      console.error(error);
    }
  }, [account, selectedBuyOption, clickPackPriceData]);

  const handleBuyAction = useCallback(async () => {
    try {
      setLoading(true);
      const result = await buyShovels();
      if (!result) {
        setLoading(false);
        return;
      }
      setBuyTransactionHash(result?.transaction_hash);
      setShowBuyModal(true);
      setRemainingClicks(remainingClicks + selectedBuyOption);
      setShowBottomSheet(false);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [buyShovels, remainingClicks, selectedBuyOption, setRemainingClicks]);

  useEffect(() => {
    if (!address) return;
    if (clickCountError || !clickCount) {
      return;
    }
    setRemainingClicks(Number(clickCount));
  }, [clickCount, clickCountError, address, setRemainingClicks]);

  const handleBoxClick = useCallback(
    (blockId: number, i: number) => {
      let tilesToRemove = [];
      let formattedTilesToRemove = [];
      if (TREE_POSITION_INDEX.includes(i)) {
        if (audioEnabled) playErrorSound();
        handleTreeClick();
        return;
      } else if (!account) {
        if (audioEnabled) playErrorSound();
        toast.error("Please connect your wallet to continue playing");
        return;
      } else if (selectedTile.includes(i)) {
        // check for tiles to remove which are below the selected tile
        const getCurrentLayer = Math.floor(i / (WIDTH * HEIGHT));

        for (let j = 0; j < getCurrentLayer; j++) {
          const previousLayerTile = i - WIDTH * HEIGHT * (j + 1);
          if (selectedTile.includes(previousLayerTile)) {
            tilesToRemove.push(previousLayerTile);
            formattedTilesToRemove.push(
              getMaskedIdentityFromIndex(i).maskedIdentity
            );
          }
        }
        setRemainingClicks(remainingClicks + 1);
      } else if (remainingClicks === 0) {
        if (audioEnabled) playErrorSound();
        toast.info("You have no remaining shovels", {
          description: "Please buy more shovels to continue playing",
        });
        return;
      } else if (!selectedTile.includes(i)) {
        if (audioEnabled) playDigSound();
        setRemainingClicks(remainingClicks - 1);
      }

      if (tilesToRemove.length > 0) {
        setRemainingClicks(remainingClicks + tilesToRemove.length);
        tilesToRemove.forEach((tile) => {
          setSelectedTile(tile);
          setFormattedSelectedTile(tile);
        });

        tilesToRemove = [];
        formattedTilesToRemove = [];
      }
      setSelectedTile(i);
      setFormattedSelectedTile(blockId);
    },
    [
      account,
      audioEnabled,
      handleTreeClick,
      remainingClicks,
      selectedTile,
      setFormattedSelectedTile,
      setRemainingClicks,
      setSelectedTile,
    ]
  );

  return (
    <div className="flex h-full w-full flex-row">
      <Canvas
        style={{
          cursor: "url(/images/shovel_cursor.svg) 55 55, auto",
        }}
        camera={{
          fov: 15,
          position: [300, 200, 300],
        }}
        scene={{
          background: new THREE.Color("#cff0ff"),
        }}
        shadows
      >
        <ambientLight intensity={1.4} />

        <Layer
          handleBoxClick={handleBoxClick}
          hovered={hovered}
          setHovered={setHovered}
        />

        <directionalLight position={[10, 200, 10]} intensity={2} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          maxDistance={500}
          minDistance={300}
          enablePan={false}
        />
      </Canvas>
      <BuyOrMine
        setShowBottomSheet={setShowBottomSheet}
        setShowPendingClaimsModal={setShowPendingClaimsModal}
        setMineTransactionHash={setMineTransactionHash}
        setAllowSelectionEdit={setAllowSelectionEdit}
        allowSelectionEdit={allowSelectionEdit}
        setShowInstructions={setShowInstructions}
      />
      {/* CONFETTI */}
      {showConfetti && (
        <Confetti
          numberOfPieces={1000}
          recycle={false}
          width={innerWidth}
          height={innerHeight}
          colors={[
            "#bbf7d0",
            "#86efac",
            "#4ade80",
            "#22c55e",
            "#16a34a",
            "#15803d",
            "#166534",
          ]}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      {/* MINE MODAL */}
      <Modal open={showGemstoneModal} onClose={handleCloseGemstoneModal}>
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4 transition-all">
          <div className=" w-full pb-8 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">
              {gemstoneCheckLoading
                ? "Checking for Gemstones ⌛"
                : containsGemstone
                ? "Congratulations! 🎉"
                : "Let's Go 🔥"}
            </h2>
            <Divider />
            <div className="flex flex-col gap-4">
              {gemstoneCheckLoading ? (
                <div className="flex flex-col gap-4 justify-center items-center w-full">
                  <p className=" text-gray-600 text-md text-center">
                    {mineTransactionStatus === "pending"
                      ? `Waiting for your transaction to confirm`
                      : `Checking for gemstones in your ${selectedTile.length} 
                    minted tile${selectedTile.length > 1 ? "s" : ""}`}
                  </p>
                  <div className=" flex w-full justify-center mt-10">
                    <RippleLoader />
                  </div>
                </div>
              ) : containsGemstone ? (
                <div className=" flex flex-col w-full justify-center items-center">
                  <p className=" text-gray-600 text-md text-center">
                    You&apos;ve just{" "}
                    <b>
                      unearthed {blocksContainingGemstone.length} gemstone
                      {blocksContainingGemstone.length > 1 ? "s" : ""}
                    </b>
                    ! 🎉
                  </p>
                  <p className=" text-gray-600 text-md text-center mt-4">
                    Your are now a key stakeholder in the game treasury 🚀{" "}
                    <br /> Keep mining to maximise your stake!
                  </p>

                  <img
                    loading="eager"
                    src={"/images/gemstone.png"}
                    width={150}
                    height={200}
                    className="mt-10"
                  />
                </div>
              ) : (
                <div className=" flex flex-col w-full justify-center items-center">
                  <p className=" text-gray-600 text-lg text-center">
                    You earned {selectedTile.length} points for mining{" "}
                    {selectedTile.length} tile
                    {selectedTile.length > 1 ? "s" : ""}. You now have a stake
                    in the game treasury! 🚀 Let&apos;s continue to find a
                    gemstone and scale up your rewards!
                  </p>

                  <img
                    loading="eager"
                    src={"/images/shovel_on_ground.webp"}
                    width={220}
                    height={200}
                    className="mt-10"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <Button
              text={
                !gemstoneCheckLoading
                  ? !containsGemstone
                    ? "Keep Mining"
                    : "Claim"
                  : "Close"
              }
              onClick={handleCloseGemstoneModal}
              loading={loading}
            />
          </div>
        </div>
      </Modal>

      {/* BUY MODAL */}
      <Modal open={showBuyModal} onClose={handleCloseBuyModal}>
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-8 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">
              Congratulations! 🎉
            </h2>
            <Divider />
            <div className="flex flex-col justify-center items-center">
              <p className=" text-gray-600 text-md text-center">
                You can now mine {selectedBuyOption} more tiles to find
                gemstones!
              </p>
              <p className=" text-gray-600 text-md text-center">
                All the best! 🍀
              </p>
              <img
                loading="eager"
                src={"/images/bag_of_shovels.webp"}
                width={320}
                height={300}
                className="mt-10"
              />
            </div>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <Button
              variant="secondary"
              text="Close"
              onClick={handleCloseBuyModal}
            />
            <Button
              onClick={() => {
                handleCloseBuyModal();
                shareOnTwitter(BUY_SUCCESS_TEXT);
              }}
              text="Share on X"
            />
          </div>
        </div>
      </Modal>

      {/* INFORMATION MODAL */}
      <Modal
        open={showBigGridInformation}
        onClose={() => {
          setShowBigGridInformation(false);
        }}
      >
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-4 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">Welcome 🎉</h2>
            <Divider />
            <p className=" text-gray-600 text-md font-bold">
              Welcome to gridy! You have joined the island where you can mine
              with chances to make real money! 🚀
            </p>

            <p className=" text-gray-600 text-md">
              Just a few tips before you start:
            </p>
            <ul className="flex flex-col justify-center items-center gap-2 px-4 leading-relaxed">
              <li className=" text-gray-600 text-md list-disc">
                Jump into the island and race against other players to boost
                your points and rack up those profits! 🚀
              </li>
              <li className=" text-gray-600 text-md list-disc">
                Sell points or claim pending gemstone points by clicking the
                cashier icon in the bottom left corner!
              </li>
              <li className=" text-gray-600 text-md list-disc">
                The grid is updated live depending on how other players in the
                grid mine! 🚀
              </li>
              <img
                loading="eager"
                src={"/images/bag_of_diamonds.webp"}
                width={320}
                height={300}
                className="mt-10"
              />
            </ul>
          </div>
          <div className="flex flex-row gap-2  ">
            <Button
              onClick={() => {
                setShowBigGridInformation(false);
                localStorage.setItem("notifyFirstTimeUser", "true");
              }}
              text="Let's Go!"
            />
          </div>
        </div>
      </Modal>

      {/* SUCCESSFUL CLAIM MODAL */}
      <Modal
        open={showSuccessfulClaimModal}
        onClose={() => {
          setShowSuccessfulClaimModal(false);
        }}
      >
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-8 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">
              Congratulations! 🎉
            </h2>
            <Divider />
            <div className="flex flex-col justify-center items-center">
              <p className=" text-gray-600 text-md text-center">
                You&apos;ve successfully claimed your prize and increased your
                stake by a substantial amount! Keep mining and find the other
                gemstones to maximise your stake! 💎
              </p>

              <img
                loading="eager"
                src={"/images/bag_of_diamonds.webp"}
                width={320}
                height={300}
                className="mt-10"
              />
            </div>
          </div>
          <div className="flex flex-row gap-2 w-full ">
            <Button
              variant="secondary"
              text="Close"
              onClick={() => setShowSuccessfulClaimModal(false)}
            />
            <Button
              onClick={() => {
                setShowSuccessfulClaimModal(false);
                shareOnTwitter(GEMSTONE_FIND_SUCCESS_TEXT);
              }}
              text="Share on X"
            />
          </div>
        </div>
      </Modal>

      {/* PENDING CLAIMS MODAL */}
      <Modal
        open={showPendingClaimsModal}
        onClose={() => setShowPendingClaimsModal(false)}
      >
        <div className="bg-white  w-full md:w-1/2 xl:w-1/3 sm:m-4 m-2 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-2 flex flex-col gap-4">
            <h2 className=" text-2xl text-center text-gray-800">
              Manage your rewards 🏦
            </h2>
            <Divider />
            <ButtonShapeTabs
              tabs={["Claim Points", "Sell Points"]}
              selected={selectedPointsTab}
              setSelected={setSelectedPointsTab}
            />
            {selectedPointsTab === "Claim Points" ? (
              <div className="flex flex-col h-[350px] mt-4">
                {pendingClaims.map((claim, index) => (
                  <div className="">
                    <div
                      key={index}
                      className=" flex flex-row items-center w-full justify-between px-4 py-4 hover:bg-gray-100 cursor-pointer rounded-lg"
                    >
                      <p className=" font-semibold text-md text-green-600">
                        Gemstone Reward 💎
                        <span className=" ml-3 italic font-normal text-gray-400 ">
                          (id : {claim})
                        </span>
                      </p>
                    </div>
                  </div>
                ))}

                {pendingClaims.length === 0 ? (
                  <div className=" flex flex-col w-full justify-center items-center">
                    <p className=" text-gray-600 text-md text-center">
                      No pending rewards found! Keep mining to find gemstones!{" "}
                      You miss 100% of the shots you don&apos;t take!
                    </p>
                    <img
                      loading="eager"
                      src={"/images/empty_chest.webp"}
                      width={320}
                      height={300}
                      className="mt-10"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col h-[350px] mt-4">
                {numberOfPoints === 0 ? (
                  <div className=" flex flex-col w-full justify-center items-center">
                    <p className=" text-gray-600 text-md text-center">
                      No points to sell! Keep mining to find gemstones or earn
                      points by mining in places where poeple can come and mine!
                    </p>
                    <img
                      loading="eager"
                      src={"/images/no_points_to_sell.webp"}
                      width={320}
                      height={300}
                      className="mt-10"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex gap-2 justify-end">
                        <p className=" text-sm text-gray-500">
                          Points Balance: {numberOfPoints}
                        </p>
                      </div>
                      <input
                        className="w-full caret-green-600 rounded-xl my-2 px-4 py-4 text-lg border-2 focus:border-transparent focus:ring-2 focus:ring-green-600 outline-none"
                        type="number"
                        value={pointsToSell}
                        placeholder="Enter your points to sell"
                        onChange={(e) => {
                          setPointsToSell(Number(e.target.value));
                        }}
                      />
                      <div className="flex flex-row gap-2 w-full">
                        {["25%", "50%", "75%", "100%"].map((option) => {
                          const points = Math.floor(
                            (numberOfPoints * Number(option.replace("%", ""))) /
                              100
                          );
                          return (
                            <planeMotion.button
                              key={option}
                              onClick={() => {
                                setPointsToSell(points);
                              }}
                              style={{
                                backgroundColor:
                                  pointsToSell === points
                                    ? "#16a34a"
                                    : "#F7F8F9",
                                color:
                                  pointsToSell === points ? "white" : "black",
                              }}
                              className="bg-[#F7F8F9] text-sm w-full px-6 py-2 rounded-3xl text-black font-semibold border-1 transition-all shadow-md"
                            >
                              {option}
                            </planeMotion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 mt-10">
                      <div className="flex w-full justify-between">
                        <p className="text-gray-600 text-sm">
                          Total shares in game
                        </p>
                        <p className="text-gray-600 text-sm">
                          {Number(pointsCount) ?? "Loading..."}
                        </p>
                      </div>
                      <div className="flex w-full justify-between">
                        <p className="text-gray-600 text-sm ">
                          Value of each point in ETH
                        </p>
                        <p className="text-gray-600 text-sm">
                          {(Number(prizePoolRaw) / Number(pointsCount)).toFixed(
                            4
                          )}
                        </p>
                      </div>
                      <div className="flex w-full justify-between">
                        <p className="text-gray-600 text-sm font-bold">
                          Total Amount Withdrawn in ETH
                        </p>
                        <p className="text-gray-600 text-sm font-bold">
                          {(
                            (Number(pointsToSell) / Number(pointsCount)) *
                            prizePoolRaw
                          ).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-row w-full gap-4">
            <Button
              text="Close"
              onClick={() => setShowPendingClaimsModal(false)}
              variant="secondary"
            />

            <Button
              text={selectedPointsTab === "Claim Points" ? "Claim All" : "Sell"}
              disabled={
                selectedPointsTab === "Sell Points"
                  ? !pointsToSell
                  : pendingClaims.length === 0
              }
              loading={loading}
              onClick={async () => {
                try {
                  if (selectedPointsTab === "Claim Points") {
                    setLoading(true);
                    const res = await handleClaimGemstone(pendingClaims);
                    if (!res) {
                      setLoading(false);
                      return;
                    }
                    setPendingClaims([]);
                    setLoading(false);
                  } else if (selectedPointsTab === "Sell Points") {
                    setLoading(true);
                    if (!pointsToSell) {
                      setLoading(false);
                      toast.info("Please enter the points to sell");
                      if (audioEnabled) playErrorSound();
                      return;
                    }
                    const res = await gameContractCalls.sellPoints(
                      pointsToSell
                    );

                    account
                      ?.execute(res)
                      .then(() => {
                        playMoneySound();
                        setPointsToSell(0);
                        setLoading(false);
                      })
                      .catch(() => {
                        setLoading(false);
                        toast.error("Something went wrong. Please try again");
                        return;
                      });
                  }
                } catch (err) {
                  console.log(err);
                  setLoading(false);
                }
              }}
            />
          </div>
        </div>
      </Modal>

      {/* INSTRUCTION MODAL */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)}>
        <div className="bg-white w-full m-2 sm:w-1/3 sm:m-4 p-4 rounded-lg flex items-center flex-col gap-4 relative">
          <div className=" w-full pb-8 flex flex-col gap-4 justify-center items-center">
            <h2 className=" text-2xl text-center text-gray-800 mt-2">
              {INSTRUCTIONS[instructionsSlideIndex].title}
            </h2>
            <planeMotion.button
              transition={{ duration: 0.5, type: "spring" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowInstructions(false);
              }}
              className=" absolute -right-4 -top-4 bg-gray-100 w-14 h-14 rounded-full flex justify-center items-center"
            >
              <X size={24} strokeWidth={3} className=" text-black" />
            </planeMotion.button>
            <Divider />
            <div className="flex flex-col gap-4">
              <div className=" flex w-full ">
                {instructionsSlideIndex === 0 ? (
                  <div className="aspect-video">
                    <img
                      src={"/images/island_image.webp"}
                      className="w-full h-full rounded-xl"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : instructionsSlideIndex === 1 ? (
                  <video
                    src="/video/minedTutorial.mp4"
                    className="flex flex-1 w-full h-full rounded"
                    style={{
                      objectFit: "cover",
                    }}
                    preload="auto"
                    autoPlay
                    loop
                    controls={false}
                  ></video>
                ) : instructionsSlideIndex === 3 ? (
                  <div className="aspect-video">
                    <img
                      src={"/images/points_sell.webp"}
                      className="w-full h-full rounded-xl"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : instructionsSlideIndex === 2 ? (
                  <div className="aspect-video">
                    <img
                      src={"/images/minedGrid.webp"}
                      className="w-full h-full rounded-xl"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={"/images/money_bag.webp"}
                    className="w-full h-full rounded-xl"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              <div className="flex w-full">
                {instructionsSlideIndex === 0 ? (
                  <ul className="flex w-full flex-col gap-2">
                    <li className=" text-gray-600 text-md">
                      Welcome to the 3D grid world! Your goal is to mine tiles
                      and uncover hidden gemstones to earn points. These points
                      determine your <b>share of the game&apos;s treasury</b>.
                    </li>
                    <li className="text-gray-600 text-md">
                      Find gemstones or mine strategically to win points and
                      increase your stake in the game!
                    </li>
                  </ul>
                ) : instructionsSlideIndex === 1 ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-gray-600 text-md">
                      You can start playing in two simple steps!
                    </p>
                    <ul className="flex w-full flex-col gap-2 list-disc px-4 pl-4">
                      <li className=" text-gray-600 text-md">Buy shovels</li>
                      <li className=" text-gray-600 text-md">
                        Mine each tile by clicking on them
                      </li>
                    </ul>
                  </div>
                ) : instructionsSlideIndex === 2 ? (
                  <div className=" flex flex-col gap-2">
                    <p className="text-gray-600 text-md">
                      There are three ways to earn points and increase your
                      stake in the treasury:
                    </p>
                    <ul className="flex w-full flex-col gap-2 list-disc px-4">
                      <li className=" text-gray-600 text-md">
                        <b>Gemstone Points:</b> Gemstones offer a 25-points
                        bonus instantly
                      </li>
                      <li className=" text-gray-600 text-md">
                        <b>Mine Tiles</b>: Each tile mined earns you 1 point.{" "}
                      </li>
                      <li className=" text-gray-600 text-md">
                        <b>Neighbour Points:</b> Get additional 2 points for
                        each tile you mine beside other players.{" "}
                      </li>
                    </ul>
                  </div>
                ) : instructionsSlideIndex === 3 ? (
                  <ul className="flex w-full flex-col gap-2 list-disc px-4">
                    <li className=" text-gray-600 text-md">
                      <b>Prices Rise</b>: Shovel prices rise as the game
                      progresses.{" "}
                    </li>
                    <li className=" text-gray-600 text-md">
                      <b>Claim Rewards</b>: Sell your points and claim your
                      share of the treasury anytime.
                    </li>
                    <li className=" text-gray-600 text-md">
                      Once all gemstones are found, the game restarts, with the
                      treasury balance and your points carried over.
                    </li>
                  </ul>
                ) : instructionsSlideIndex === 4 ? (
                  <div className="flex w-full flex-col gap-2 px-4 justify-center">
                    <p className=" text-gray-600 text-md text-center">
                      Good luck, and may your mining lead to riches! 🎉
                    </p>
                    <p className=" text-gray-600 text-md text-center">
                      PS: Avoid hurting the trees 🌳
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-4 w-full justify-center ">
            <Button
              variant="secondary"
              text={instructionsSlideIndex === 0 ? "Close" : "Previous"}
              onClick={() =>
                instructionsSlideIndex === 0
                  ? setShowInstructions(false)
                  : setInstructionsSlideIndex(instructionsSlideIndex - 1)
              }
            />

            <Button
              text={
                instructionsSlideIndex === INSTRUCTIONS.length - 1
                  ? "Close"
                  : "Next"
              }
              onClick={() =>
                instructionsSlideIndex === INSTRUCTIONS.length - 1
                  ? (setShowInstructions(false), setInstructionsSlideIndex(0))
                  : setInstructionsSlideIndex(instructionsSlideIndex + 1)
              }
            />
          </div>
        </div>
      </Modal>

      {/* BUY TILES BOTTOM SHEET */}
      <BottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
      >
        <div className="px-2 flex flex-col gap-4">
          <h3 className=" font-semibold text-lg">
            Select number of shovels to buy
          </h3>

          <div className="flex flex-row gap-2">
            {OPTIONS.map((option) => (
              <planeMotion.button
                key={option}
                onClick={() => {
                  setSelectedBuyOption(option);
                }}
                style={{
                  backgroundColor:
                    selectedBuyOption === option ? "#16a34a" : "#F7F8F9",
                  color: selectedBuyOption === option ? "white" : "black",
                }}
                className="bg-[#F7F8F9] w-full px-6 py-2 rounded-3xl text-black font-semibold border-1 transition-all shadow-md"
              >
                {option}
              </planeMotion.button>
            ))}
          </div>

          <div className="flex flex-row w-full justify-between pt-4">
            <p className=" font-semibold text-md">Probability of gemstone</p>
            <p className=" text-gray-600">{winningProbability}</p>
          </div>
          <div className="flex flex-row w-full justify-between">
            <p className=" font-semibold text-md">Price</p>
            <p className=" text-gray-600">${clickPackPrice}</p>
          </div>

          <div className="flex flex-row gap-2 pt-4">
            <Button
              text="Cancel"
              onClick={() => setShowBottomSheet(false)}
              variant="secondary"
            />

            <Button loading={loading} text="Buy" onClick={handleBuyAction} />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
