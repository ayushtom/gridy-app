import { useRef, useMemo, useCallback, Dispatch } from "react";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import {
  colorScheme,
  HEIGHT,
  LAYER_HEIGHT,
  NUMBER_OF_LAYERS,
  SIDE_LENGTH,
  TREE_POSITION,
  WIDTH,
} from "../../utils/constants";
import useGameStore from "../../store/gameStore";
import { ThreeEvent } from "@react-three/fiber";
import usePlayerStore from "../../store/playerStore";
import { addAndRemoveCommon } from "../../utils/array";
import { getMaskedIdentityFromIndex, getTileMap } from "../../utils/layers";
import { motion } from "framer-motion-3d";
import { Tree } from "../models/tree";

const BoxWithBorder = ({
  position,
  color,
  onClick,
  hovered,
  setHovered,
  index,
  checkIfValidInstanceIdToSelect,
}: {
  position: [number, number, number];
  color: string;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  hovered: number;
  setHovered: Dispatch<React.SetStateAction<number>>;
  index: number;
  checkIfValidInstanceIdToSelect: (instanceId: number) => boolean;
}) => {
  const { selectedTile } = usePlayerStore();
  const hoverColor = new THREE.Color(1, 1, 1);
  const boxColor = new THREE.Color(color);
  const currentColor =
    hovered === index
      ? hoverColor
      : selectedTile.includes(index)
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
        <boxGeometry args={[SIDE_LENGTH, LAYER_HEIGHT, SIDE_LENGTH]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

export const Layer = (props: {
  hovered: number;
  setHovered: Dispatch<React.SetStateAction<number>>;
  handleBoxClick: (blockId: number, i: number) => void;
}) => {
  const { handleBoxClick, hovered, setHovered } = props;

  const groupRef = useRef(null);
  const removedTiles = useGameStore((state) => state.removedTiles);
  const formattedSelectedTile = usePlayerStore(
    (state) => state.formattedSelectedTile
  );

  const boxes = useMemo(() => {
    const temp = getTileMap();
    return temp;
  }, []);

  const checkIfValidInstanceIdToSelect = useCallback(
    (instanceId: number): boolean => {
      if (instanceId === undefined) return false;

      const getCurrentLayer = Math.floor(instanceId / (WIDTH * HEIGHT));

      if (getCurrentLayer === 4) return true;

      const previousLayerTile = instanceId + WIDTH * HEIGHT;

      const maskedPreviousLayerTile =
        getMaskedIdentityFromIndex(previousLayerTile).maskedIdentity;

      return addAndRemoveCommon(removedTiles, formattedSelectedTile).includes(
        maskedPreviousLayerTile
      );
    },
    [formattedSelectedTile, removedTiles]
  );

  return (
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
      <Instances limit={WIDTH * HEIGHT * NUMBER_OF_LAYERS}>
        <boxGeometry args={[SIDE_LENGTH, LAYER_HEIGHT, SIDE_LENGTH]} />
        <meshPhongMaterial />
        {boxes.map((pos, index) => {
          if (removedTiles.includes(pos[3])) {
            return null;
          }

          return (
            <BoxWithBorder
              key={index}
              position={[
                (Number(pos[0]) - Math.floor(WIDTH / 2)) * 10,
                -Math.floor((NUMBER_OF_LAYERS * LAYER_HEIGHT) / 2) +
                  Number(pos[2]) * LAYER_HEIGHT,
                (Number(pos[1]) - Math.floor(HEIGHT / 2)) * 10,
              ]}
              color={colorScheme[pos[2] as keyof typeof colorScheme]}
              checkIfValidInstanceIdToSelect={checkIfValidInstanceIdToSelect}
              onClick={(e) => {
                const isValid = checkIfValidInstanceIdToSelect(index);

                if (!isValid) return;

                handleBoxClick(pos[3], index);
                e.stopPropagation();
              }}
              hovered={hovered}
              setHovered={setHovered}
              index={index}
            />
          );
        })}
      </Instances>

      {TREE_POSITION.map((position, i) => (
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
          key={i}
        >
          <Tree scale={10} position={position} />
        </motion.mesh>
      ))}
    </motion.group>
  );
};
