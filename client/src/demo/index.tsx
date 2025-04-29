import { OrbitControls } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import {
  useRef,
  useMemo,
  Dispatch,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getDemoTileMap, getMaskedIdentityFromIndex } from "../utils/layers";
import {
  DEMO_HEIGHT,
  DEMO_LAYER_HEIGHT,
  DEMO_NUMBER_OF_LAYERS,
  DEMO_SIDE_LENGTH,
  DEMO_WIDTH,
  INSTRUCTIONS,
} from "../utils/constants";
import { motion } from "framer-motion-3d";
import { addAndRemoveCommon } from "../utils/array";
import useGameStore from "../store/gameStore";
import { toast } from "sonner";
import {
  playDigSound,
  playErrorSound,
  playMineSound,
  playWinSound,
  toggleBackgroudMusic,
} from "../utils/sound";
import Button from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { X } from "lucide-react";
import { motion as planeMotion } from "framer-motion";
import BottomSheet from "../components/ui/bottomsheet";
import Modal from "../components/ui/modal";
import Divider from "../components/ui/divider";
import RippleLoader from "../components/ui/loader/ripple";
import Confetti from "react-confetti";
import { computeWinProbability } from "../utils/number";
import DemoOverlay from "./demoOverlay";
import { Tree } from "../components/models/tree";

export const colorScheme = {
  0: "#914F1E",
  1: "#368a0e",
  2: "#4CBB17",
};

const OPTIONS = [5, 10, 20, 30];

const BuyOrMine = ({
  setShowBottomSheet,
  setAllowSelectionEdit,
  allowSelectionEdit,
  remainingClicks,
  setRemainingClicks,
  setSelectedTiles,
  selectedTiles,
  handleMineAction,
  wiggle,
  currentNudge,
}: {
  setShowBottomSheet: Dispatch<React.SetStateAction<boolean>>;
  setAllowSelectionEdit: Dispatch<React.SetStateAction<boolean>>;
  allowSelectionEdit: boolean;
  remainingClicks: number;
  setRemainingClicks: Dispatch<React.SetStateAction<number>>;
  setSelectedTiles: Dispatch<React.SetStateAction<number[]>>;
  selectedTiles: number[];
  handleMineAction: () => void;
  wiggle?: boolean;
  currentNudge: "Buy" | "Select Tile" | "Mine" | "Done";
}) => {
  const { audioEnabled } = useGameStore();

  const undoSelection = useCallback(() => {
    setRemainingClicks(remainingClicks + selectedTiles.length);
    setSelectedTiles([]);
  }, [remainingClicks, selectedTiles, setRemainingClicks, setSelectedTiles]);

  const mineTile = useCallback(async () => {
    try {
      if (currentNudge !== "Mine") {
        playErrorSound();
        if (currentNudge === "Buy") {
          toast.info("Please click on the buy button to purchase shovels");
          return;
        } else if (currentNudge === "Select Tile") {
          toast.info("Please select atleast 3 tile to mine");
          return;
        }
      }
      handleMineAction();
    } catch (error) {
      return;
    }
  }, [currentNudge, handleMineAction]);

  const handleMintOrBuy = useCallback(async () => {
    if (currentNudge === "Select Tile") {
      toast.info("Please select atleast 3 tile to mine");
      return;
    }
    if (selectedTiles.length > 0) {
      if (currentNudge === "Buy") {
        toast.info("Please buy shovels to mine");
        return;
      }
      if (audioEnabled) playMineSound();
      // make transaction call
      mineTile();
      setAllowSelectionEdit(false);
    } else {
      if (currentNudge === "Mine") {
        toast.info("Please select atleast 3 tile to mine");
        return;
      }
      setShowBottomSheet(true);
    }
  }, [
    audioEnabled,
    currentNudge,
    mineTile,
    selectedTiles.length,
    setAllowSelectionEdit,
    setShowBottomSheet,
  ]);

  return (
    <div className="fixed bottom-4 w-full flex justify-between px-8">
      <div className=" flex gap-3 items-center sm:w-full w-auto "></div>
      <div className=" w-full flex flex-col items-center justify-end">
        <div className=" flex items-center gap-4 ml-12 my-first-step">
          <div className="w-auto">
            <Button
              size="lg"
              text={selectedTiles.length > 0 ? "Mine" : "Buy"}
              onClick={handleMintOrBuy}
              wiggle={wiggle}
            />
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <planeMotion.button
                  className="  bg-red-600 w-10 h-10 cursor-pointer flex justify-center items-center rounded-full shadow-lg"
                  initial={{ x: -80, opacity: 0 }}
                  animate={{
                    x: allowSelectionEdit && selectedTiles.length > 0 ? 0 : -80,
                    opacity:
                      allowSelectionEdit && selectedTiles.length > 0 ? 1 : 0,
                    pointerEvents:
                      allowSelectionEdit && selectedTiles.length > 0
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

const BoxWithBorder = ({
  position,
  color,
  onClick,
  hovered,
  setHovered,
  index,
  checkIfValidInstanceIdToSelect,
  selectedTiles,
}: {
  position: [number, number, number];
  color: string;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  hovered: number;
  setHovered: Dispatch<React.SetStateAction<number>>;
  index: number;
  checkIfValidInstanceIdToSelect: (instanceId: number) => boolean;
  selectedTiles: number[];
}) => {
  const hoverColor = new THREE.Color(1, 1, 1);
  const boxColor = new THREE.Color(color);
  const currentColor =
    hovered === index
      ? hoverColor
      : selectedTiles.includes(index)
      ? "#825B32"
      : boxColor;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        checkIfValidInstanceIdToSelect(index) && setHovered(index);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(-1);
      }}
    >
      <Instance color={currentColor}>
        <meshPhongMaterial
          color={currentColor}
          emissive={hovered ? currentColor : "#fff"}
          emissiveIntensity={hovered ? 0.5 : 0}
          shininess={hovered ? 100 : 30}
        />
      </Instance>
      {/* <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(SIDE_LENGTH, LAYER_HEIGHT, SIDE_LENGTH)]}
        />
        <lineBasicMaterial color="#000" opacity={1} linewidth={1.5} />
      </lineSegments> */}
      <mesh
        scale={[1.001, 1.001, 1.001]}
        onClick={(e) => {
          onClick(e);
          e.stopPropagation();
        }}
      >
        <boxGeometry
          args={[DEMO_SIDE_LENGTH, DEMO_LAYER_HEIGHT, DEMO_SIDE_LENGTH]}
        />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

export default function Demo(props: {
  setIsFirstTimeUser: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { setIsFirstTimeUser } = props;
  const groupRef = useRef(null);
  const [removedTiles, setRemovedTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [remainingClicks, setRemainingClicks] = useState(0);
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const [hovered, setHovered] = useState(-1);
  const [selectedBuyOption, setSelectedBuyOption] = useState<number>(
    OPTIONS[1]
  );
  const [showGemstoneModal, setShowGemstoneModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [mineNudgeModal, setMineNudgeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gemstoneCheckLoading, setGemstoneCheckLoading] = useState(false);
  const [containsGemstone, setContainsGemstone] = useState(false);
  const [allowSelectionEdit, setAllowSelectionEdit] = useState(true);
  const [blocksContainingGemstoneCount, setBlocksContainingGemstoneCount] =
    useState<number>(0);
  const [showSuccessfulClaimModal, setShowSuccessfulClaimModal] =
    useState(false);
  const [winningProbability, setWinningProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const totalGemstones = useRef(25);
  const [totalFoundGemstones, setTotalFoundGemstones] = useState(0);
  const [numberOfPoints, setNumberOfPoints] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsSlideIndex, setInstructionsSlideIndex] = useState(0);
  const [CTAAttention, setCTAAttention] = useState(false);
  const [currentNudge, setCurrentNudge] = useState<
    "Buy" | "Select Tile" | "Mine" | "Done"
  >("Buy");

  const boxes = useMemo(() => {
    const temp = getDemoTileMap();
    return temp;
  }, []);

  const checkIfValidInstanceIdToSelect = useCallback(
    (instanceId: number): boolean => {
      if (instanceId === undefined) return false;

      const getCurrentLayer = Math.floor(
        instanceId / (DEMO_HEIGHT * DEMO_WIDTH)
      );

      if (getCurrentLayer === DEMO_NUMBER_OF_LAYERS - 1) return true;

      const previousLayerTile = instanceId + DEMO_WIDTH * DEMO_HEIGHT;

      const maskedPreviousLayerTile =
        getMaskedIdentityFromIndex(previousLayerTile).maskedIdentity;

      return addAndRemoveCommon(removedTiles, selectedTiles).includes(
        maskedPreviousLayerTile
      );
    },
    [removedTiles, selectedTiles]
  );

  const handleTreeClick = useCallback(() => {
    toast.success("Not here to hurt the trees 🌲", {});
  }, []);

  const handleBoxClick = useCallback(
    (i: number) => {
      if ([54, 65].includes(i)) {
        if (audioEnabled) playErrorSound();
        handleTreeClick();
        return;
      } else if (currentNudge === "Buy") {
        playErrorSound();
        toast.info("Please click on the buy button to purchase shovels");
        setCTAAttention(true);
        return;
      } else if (remainingClicks === 0) {
        if (audioEnabled) playErrorSound();
        toast.info("You have no remaining shovels");
        return;
      } else if (!selectedTiles.includes(i)) {
        if (audioEnabled) playDigSound();
        setRemainingClicks(remainingClicks - 1);
      } else if (selectedTiles.includes(i)) {
        setRemainingClicks(remainingClicks + 1);
      }
      setSelectedTiles((prev) => {
        if (prev.includes(i)) {
          return prev.filter((tile) => tile !== i);
        }
        return [...prev, i];
      });
    },
    [audioEnabled, currentNudge, remainingClicks, selectedTiles]
  );

  useEffect(() => {}, []);

  useEffect(() => {
    toggleBackgroudMusic(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    if (selectedTiles.length === 3) {
      setTimeout(() => {
        setMineNudgeModal(true);
      }, 500);
    }
    setCTAAttention(false);
  }, [selectedTiles]);

  useEffect(() => {
    const remainingGemstones = totalGemstones.current - totalFoundGemstones;
    const remainingTiles =
      DEMO_WIDTH * DEMO_HEIGHT * DEMO_NUMBER_OF_LAYERS - removedTiles.length;

    setWinningProbability(
      computeWinProbability(
        Number(remainingGemstones),
        Number(remainingTiles),
        Number(selectedBuyOption)
      )
    );
  }, [totalGemstones, totalFoundGemstones, removedTiles, selectedBuyOption]);

  const buyShovels = useCallback(async () => {
    try {
      setShowBuyModal(true);
      setShowConfetti(true);
    } catch (error) {
      return null;
    }
  }, []);

  const handleBuyAction = useCallback(() => {
    try {
      setLoading(true);
      const result = buyShovels();
      if (!result) {
        setLoading(false);
        return;
      }
      setShowBuyModal(true);
      setRemainingClicks(remainingClicks + selectedBuyOption);
      setShowBottomSheet(false);
      setLoading(false);
      setCTAAttention(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [buyShovels, remainingClicks, selectedBuyOption, setRemainingClicks]);

  const checkIfContainsGemstone = useCallback(async () => {
    const count = Math.floor(Math.random() * (selectedTiles.length / 2)) + 1;

    if (count > 0) {
      setShowConfetti(true);
      if (audioEnabled) playWinSound();
      setContainsGemstone(true);
    } else {
      setContainsGemstone(false);
    }
    setBlocksContainingGemstoneCount(count);
    setGemstoneCheckLoading(false);
    return;
  }, [audioEnabled, selectedTiles.length]);

  const handleCloseBuyModal = useCallback(() => {
    setShowBuyModal(false);
    setShowConfetti(false);
    setCTAAttention(false);
    setCurrentNudge("Select Tile");
  }, [setShowBuyModal]);

  useEffect(() => {
    if (currentNudge === "Done") {
      setInstructionsSlideIndex(2);
      setShowInstructions(true);
    }
  }, [currentNudge]);

  const handleClaimGemstone = useCallback(async (count: number) => {
    try {
      setNumberOfPoints((prev) => prev + count * 25);
      setTotalFoundGemstones((prev) => prev + count);
      return;
    } catch (err) {
      console.log(err);
      return null;
    }
  }, []);

  const handleCloseGemstoneModal = useCallback(() => {
    if (containsGemstone) {
      setLoading(true);
      const res = handleClaimGemstone(blocksContainingGemstoneCount);
      if (!res) {
        if (audioEnabled) playErrorSound();
        toast.error("Something went wrong. Please try again later");
      }
      setBlocksContainingGemstoneCount(0);
      setShowSuccessfulClaimModal(true);
    }
    setShowConfetti(false);
    setLoading(false);
    setShowGemstoneModal(false);
    setRemovedTiles((prev) => [...prev, ...selectedTiles]);
    setSelectedTiles([]);
    setContainsGemstone(false);
    setAllowSelectionEdit(true);
    setShowGemstoneModal(false);
  }, [
    containsGemstone,
    selectedTiles,
    handleClaimGemstone,
    blocksContainingGemstoneCount,
    audioEnabled,
  ]);

  const handleMineAction = useCallback(async () => {
    setGemstoneCheckLoading(true);
    setShowGemstoneModal(true);
    setTimeout(() => {
      checkIfContainsGemstone();
      setRemovedTiles((prev) => [...prev, ...selectedTiles]);
      setCTAAttention(false);
    }, 4000);
  }, [checkIfContainsGemstone, selectedTiles]);

  useEffect(() => {
    setTimeout(() => {
      setShowInstructions(true);
    }, 1000);
  }, []);

  return (
    <div className="flex h-full w-full flex-row">
      <DemoOverlay
        userNumberOfGemstones={numberOfPoints}
        remainingClicks={remainingClicks}
        prizePool={25000}
        totalFoundGemstones={totalFoundGemstones}
      />
      <Canvas
        style={{
          cursor: "url(/images/shovel_cursor.svg) 55 55, auto",
        }}
        camera={{
          fov: 15,
          position: [50, 50, 50],
        }}
        scene={{
          background: new THREE.Color("#cff0ff"),
        }}
        shadows
      >
        <ambientLight intensity={1.4} />
        <motion.group
          initial={{
            rotateY: Math.PI / 4,
          }}
          animate={{
            rotateY: 0,
            transition: {
              duration: 1,
              type: "spring",
            },
          }}
          ref={groupRef}
        >
          <Instances limit={DEMO_WIDTH * DEMO_HEIGHT * DEMO_NUMBER_OF_LAYERS}>
            <boxGeometry
              args={[DEMO_SIDE_LENGTH, DEMO_LAYER_HEIGHT, DEMO_SIDE_LENGTH]}
            />
            <meshPhongMaterial />
            {boxes.map((pos, index) => {
              if (removedTiles.includes(index)) {
                return null;
              }

              return (
                <BoxWithBorder
                  key={index}
                  position={[
                    (Number(pos[0]) - Math.floor(DEMO_WIDTH / 2)) * 5,
                    -Math.floor(
                      (DEMO_NUMBER_OF_LAYERS * DEMO_LAYER_HEIGHT) / 2
                    ) +
                      Number(pos[2]) * DEMO_LAYER_HEIGHT,
                    (Number(pos[1]) - Math.floor(DEMO_HEIGHT / 2)) * 5,
                  ]}
                  color={colorScheme[pos[2] as keyof typeof colorScheme]}
                  checkIfValidInstanceIdToSelect={
                    checkIfValidInstanceIdToSelect
                  }
                  onClick={(e) => {
                    const isValid = checkIfValidInstanceIdToSelect(index);

                    if (!isValid) return;

                    handleBoxClick(index);
                    e.stopPropagation();
                  }}
                  selectedTiles={selectedTiles}
                  hovered={hovered}
                  setHovered={setHovered}
                  index={index}
                />
              );
            })}
          </Instances>

          <motion.mesh
            initial={{
              y: -5,
            }}
            animate={{
              y: 0,
              transition: {
                duration: 0.3,
                type: "spring",
                stiffness: 80,
              },
            }}
          >
            <Tree
              scale={4}
              position={[
                5,
                (DEMO_NUMBER_OF_LAYERS * DEMO_LAYER_HEIGHT) / 2,
                -8.5,
              ]}
            />
          </motion.mesh>

          <motion.mesh
            initial={{
              y: -5,
            }}
            animate={{
              y: 0,
              transition: {
                duration: 0.3,
                type: "spring",
                stiffness: 80,
              },
            }}
          >
            <Tree
              scale={4}
              position={[
                -10,
                (DEMO_NUMBER_OF_LAYERS * DEMO_LAYER_HEIGHT) / 2,
                8.5,
              ]}
            />
          </motion.mesh>
        </motion.group>

        <directionalLight position={[10, 200, 10]} intensity={2} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          maxDistance={200}
          minDistance={150}
          enablePan={false}
        />
      </Canvas>

      <BuyOrMine
        setSelectedTiles={setSelectedTiles}
        selectedTiles={selectedTiles}
        setShowBottomSheet={setShowBottomSheet}
        setAllowSelectionEdit={setAllowSelectionEdit}
        allowSelectionEdit={allowSelectionEdit}
        remainingClicks={remainingClicks}
        setRemainingClicks={setRemainingClicks}
        handleMineAction={handleMineAction}
        wiggle={CTAAttention}
        currentNudge={currentNudge}
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
                    {`Checking for gemstones in your ${selectedTiles.length} 
                    minted tile${selectedTiles.length > 1 ? "s" : ""}`}
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
                      unearthed {blocksContainingGemstoneCount} gemstone
                      {blocksContainingGemstoneCount > 1 ? "s" : ""}
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
                    You earned {selectedTiles.length} points for mining{" "}
                    {selectedTiles.length} tile
                    {selectedTiles.length > 1 ? "s" : ""}. You now have a stake
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
                  <div className=" aspect-video">
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
                  </div>
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
                      and uncover hidden gemstones to earn points. These{" "}
                      <b>
                        points determine your share of the game&apos;s treasury
                      </b>
                      .
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
                    <p className="text-gray-600 text-md">
                      Let&apos;s get started by buying some free sample shovels
                      for your first time!
                    </p>
                  </div>
                ) : instructionsSlideIndex === 2 ? (
                  <div className=" flex flex-col gap-2">
                    <p className="text-gray-600 text-md">
                      <b>Points represent your shares in the game treasury</b>.
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
              text={instructionsSlideIndex === 0 ? "Next" : "Let's go!"}
              onClick={() => {
                if (instructionsSlideIndex === 0) {
                  setInstructionsSlideIndex(instructionsSlideIndex + 1);
                } else if (instructionsSlideIndex === 1) {
                  const isFirstTimeUser = localStorage.getItem("firstTimeUser");
                  if (isFirstTimeUser === "false") {
                    setInstructionsSlideIndex(instructionsSlideIndex + 1);
                  } else {
                    setCTAAttention(true);
                    setShowInstructions(false);
                  }
                } else if (instructionsSlideIndex === INSTRUCTIONS.length - 1) {
                  setShowInstructions(false);
                  setIsFirstTimeUser(false);
                } else {
                  setInstructionsSlideIndex(instructionsSlideIndex + 1);
                }
              }}
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
                You have {selectedBuyOption} shovels!
              </p>
              <p className=" text-gray-600 text-md text-center mt-2">
                Hover over the island and click on any 3 tiles to mine. 🚀
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
              }}
              text="Let's do it!"
            />
          </div>
        </div>
      </Modal>

      {/* Mine Nudge MODAL */}
      <Modal
        open={mineNudgeModal}
        onClose={() => {
          setMineNudgeModal(false);
          setCTAAttention(true);
          setCurrentNudge("Mine");
        }}
      >
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-8 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">
              Good Job! 💪
            </h2>
            <Divider />
            <div className="flex flex-col justify-center items-center">
              <p className=" text-gray-600 text-md text-center">
                Great choice! Click the "Mine" button below to start mining
                these tiles!
              </p>
              <p className=" text-gray-600 text-md text-center mt-4">
                To adjust your selection, deselect the tiles or press the red
                "X" button to reset.
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
              onClick={() => {
                setMineNudgeModal(false);
                setCTAAttention(true);
                setCurrentNudge("Mine");
              }}
              text="Let's do it!"
            />
          </div>
        </div>
      </Modal>

      {/* SUCCESSFUL CLAIM MODAL */}
      <Modal
        open={showSuccessfulClaimModal}
        onClose={() => {
          setShowSuccessfulClaimModal(false);
          setCurrentNudge("Done");
          localStorage.setItem("firstTimeUser", "false");
        }}
      >
        <div className="bg-white w-1/3 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
          <div className=" w-full pb-8 flex flex-col gap-4">
            <h2 className=" text-2xl text-gray-800 text-center">
              You are an expert 🔥
            </h2>
            <Divider />
            <div className="flex flex-col justify-center items-center">
              <ul className="flex w-full flex-col gap-2 list-disc px-4">
                <li className=" text-gray-600 text-md">
                  You&apos;ve claimed your gemstone points boost which directly
                  increases your share of the game treasury!
                </li>
                <li className=" text-gray-600 text-md">
                  The more points you earn, the larger your share in the game
                  treasury!
                </li>
                <li className=" text-gray-600 text-md">
                  The game treasury is funded by all shovel sales from players.
                </li>
              </ul>

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
              onClick={() => {
                setShowSuccessfulClaimModal(false);
                setCurrentNudge("Done");
                localStorage.setItem("firstTimeUser", "false");
              }}
              text="Got it!"
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
            <p className=" text-gray-600">FREE</p>
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
