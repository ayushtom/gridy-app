import { merkle, hash, BigNumberish } from "starknet";
import { assetsToImageId, imageIdToAssets } from "./grid";
import path from "path";
import fs from "fs/promises";

// THESE ARE TEST LOCATIONS - DO NOT USE IN PRODUCTION
export const GEMSTONE_COORDINATES = {
  1: { x: 4, y: 0, z: 0, prize: 25, nonce: 2748127 },
  2: { x: -1, y: 3, z: 0, prize: 25, nonce: 4928354 },
  3: { x: 5, y: -4, z: 0, prize: 25, nonce: 8573629 },
  4: { x: -3, y: -1, z: 0, prize: 25, nonce: 1387241 },
  5: { x: 2, y: 4, z: 0, prize: 25, nonce: 9857316 },
  6: { x: -5, y: -3, z: 0, prize: 25, nonce: 2649187 },
  7: { x: 0, y: 1, z: 0, prize: 25, nonce: 7124839 },

  8: { x: 1, y: 2, z: 1, prize: 25, nonce: 7841623 },
  9: { x: -4, y: 5, z: 1, prize: 25, nonce: 9342765 },
  10: { x: -2, y: 1, z: 1, prize: 25, nonce: 1983742 },
  11: { x: 4, y: -3, z: 1, prize: 25, nonce: 9328471 },
  12: { x: 5, y: 1, z: 1, prize: 25, nonce: 7812345 },
  13: { x: 0, y: 4, z: 1, prize: 25, nonce: 7623918 },

  14: { x: -3, y: 2, z: 2, prize: 25, nonce: 2746395 },
  15: { x: 1, y: -5, z: 2, prize: 25, nonce: 9174823 },
  16: { x: 3, y: -1, z: 2, prize: 25, nonce: 6384729 },
  17: { x: -1, y: 3, z: 2, prize: 25, nonce: 9374621 },
  18: { x: 4, y: 1, z: 2, prize: 25, nonce: 1759328 },

  19: { x: 0, y: -3, z: 3, prize: 25, nonce: 7328946 },
  20: { x: 2, y: 5, z: 3, prize: 25, nonce: 9182736 },
  21: { x: -5, y: -4, z: 3, prize: 25, nonce: 6847312 },
  22: { x: -2, y: 0, z: 3, prize: 25, nonce: 4819263 },

  23: { x: 1, y: -2, z: 4, prize: 25, nonce: 8473621 },
  24: { x: -4, y: -1, z: 4, prize: 25, nonce: 2648123 },
  25: { x: 3, y: 2, z: 4, prize: 25, nonce: 1392847 },
};

let merkleTree: merkle.MerkleTree;
const arr: string[] = [];

// Get the root directory of the project
const rootDir = path.resolve(__dirname, "..");

// Function to get the full path of a file in the public directory
function getPublicFilePath(relativePath: string) {
  return path.join(rootDir, "assets", relativePath);
}

// Function to read a JSON file from the public directory
async function readCoordinates(relativePath: string): Promise<{
  [x: string]: {
    x: number;
    y: number;
    z: number;
    nonce: number;
    prize: number;
  };
}> {
  const fullPath = getPublicFilePath(relativePath);
  try {
    const data = await fs.readFile(fullPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file at ${relativePath}:`, error);
    throw error;
  }
}

// get block index
export function getBlockIndex(blockId: string): string {
  let index = -1;
  const [assetX, assetY, assetZ] = imageIdToAssets(BigInt(blockId));

  let gemstoneIndex = -1;

  for (const key in GEMSTONE_COORDINATES) {
    const formatKey = parseInt(key);
    const { x, y, z } =
      GEMSTONE_COORDINATES[formatKey as keyof typeof GEMSTONE_COORDINATES];

    if (
      BigInt(x + 5) === assetX &&
      BigInt(y + 5) === assetY &&
      BigInt(z) === assetZ
    ) {
      gemstoneIndex = Number(key);
      break;
    }
  }

  if (gemstoneIndex === -1) {
    return (-1).toString();
  }
  return arr[gemstoneIndex - 1];
}

function proofMerklePath(
  root: bigint,
  leaf: BigNumberish,
  path: string | any[],
  hashMethod: ((a: BigNumberish, b: BigNumberish) => string) | undefined
) {
  if (path.length === 0) {
    return root === leaf;
  }

  const [next, ...rest] = path;

  return proofMerklePath(
    root,
    BigInt(merkle.MerkleTree.hash(leaf, next, hashMethod)),
    rest,
    hash.computePoseidonHash
  );
}

// get leaf data
export function getLeafData(blockId: string) {
  let gemstoneNonce = -1;
  let gemstonePrize = -1;
  const [assetX, assetY, assetZ] = imageIdToAssets(BigInt(blockId));

  for (const key in GEMSTONE_COORDINATES) {
    const formatKey = parseInt(key);
    const { x, y, z } =
      GEMSTONE_COORDINATES[formatKey as keyof typeof GEMSTONE_COORDINATES];

    if (
      BigInt(x + 5) === assetX &&
      BigInt(y + 5) === assetY &&
      BigInt(z) === assetZ
    ) {
      gemstoneNonce =
        GEMSTONE_COORDINATES[formatKey as keyof typeof GEMSTONE_COORDINATES]
          .nonce;
      gemstonePrize =
        GEMSTONE_COORDINATES[formatKey as keyof typeof GEMSTONE_COORDINATES]
          .prize;
      break;
    }
  }

  return {
    nonce: gemstoneNonce,
    prize: gemstonePrize,
  };
}

export function getProof(addressToProve: string) {
  // Get the Merkle proof for this address
  const proof = merkleTree.getProof(addressToProve);

  // convert to BigInt
  const proofBigInt = proof.map((el) => BigInt(el).toString());

  // const isPartOfTree = proofMerklePath(
  //   BigInt(merkleTree.root),
  //   addressToProve,
  //   proofBigInt,
  //   hash.computePoseidonHash
  // );

  // console.log(
  //   "\nIs address part of the tree with the given root?",
  //   isPartOfTree
  // );

  return proofBigInt;
}

export async function merkleTreeSetup() {
  try {
    Object.keys(GEMSTONE_COORDINATES)?.forEach((gemstone) => {
      const { x, y, z, nonce, prize } =
        GEMSTONE_COORDINATES[
          parseInt(gemstone) as keyof typeof GEMSTONE_COORDINATES
        ];
      const imageId = assetsToImageId([
        BigInt(x + 5),
        BigInt(y + 5),
        BigInt(z),
      ]);

      const hashResult = hash.computePoseidonHashOnElements([
        BigInt(imageId),
        BigInt(nonce),
        BigInt(prize),
      ]);

      arr.push(BigInt(hashResult).toString());
    });

    merkleTree = new merkle.MerkleTree(arr, hash.computePoseidonHash);
    // console.log("\nMerkle Tree Root :", BigInt(merkleTree.root));
  } catch (error) {
    console.error("Merkle setup", error);
  }
}
