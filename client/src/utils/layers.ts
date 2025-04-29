import {
  DEMO_NUMBER_OF_LAYERS,
  DEMO_SIDE_LENGTH,
  NUMBER_OF_LAYERS,
  SIDE_LENGTH,
} from "./constants";

const DIVISOR = BigInt(1024);
const NUMBER_OF_COORDINATES = 3;

export function imageIdToAssets(imageId: bigint): bigint[] {
  const assets: bigint[] = new Array(NUMBER_OF_COORDINATES).fill(BigInt(0));

  for (let i = 2; i >= 0; i--) {
    const divisor: bigint = DIVISOR ** BigInt(i);
    assets[i] = imageId / divisor;
    imageId %= divisor;
  }

  return assets;
}

export function assetsToImageId(imageAssets: bigint[]): bigint {
  let multiplier = BigInt(1);
  return imageAssets.reduce((acc, value) => {
    acc += value * multiplier;
    multiplier *= DIVISOR;
    return acc;
  }, BigInt(0));
}

export function getMaskedIdentityFromIndex(index: number) {
  // Compute the total number of elements in one layer
  const layerSize = SIDE_LENGTH * SIDE_LENGTH;

  // Calculate z, x, and y from the index
  const z = Math.floor(index / layerSize); // Layer number
  const remainingIndex = index % layerSize;
  const x = Math.floor(remainingIndex / SIDE_LENGTH); // Row
  const y = remainingIndex % SIDE_LENGTH; // Column

  // Calculate the maskedIdentity using the same logic from the useMemo loop
  const maskedIdentity = assetsToImageId([BigInt(x), BigInt(y), BigInt(z)]);

  return {
    x,
    y,
    z,
    maskedIdentity: Number(maskedIdentity), // Return as number
  };
}

export function getTileMap() {
  const temp = [];
  for (let z = 0; z < NUMBER_OF_LAYERS; z++) {
    for (let x = 0; x < SIDE_LENGTH; x++) {
      for (let y = 0; y < SIDE_LENGTH; y++) {
        const maskedIdentity = assetsToImageId([
          BigInt(x),
          BigInt(y),
          BigInt(z),
        ]);
        temp.push([x, y, z, Number(maskedIdentity)]);
      }
    }
  }
  return temp;
}

export const getDemoTileMap = () => {
  const temp = [];
  for (let z = 0; z < DEMO_NUMBER_OF_LAYERS; z++) {
    for (let x = 0; x < DEMO_SIDE_LENGTH; x++) {
      for (let y = 0; y < DEMO_SIDE_LENGTH; y++) {
        const maskedIdentity = assetsToImageId([
          BigInt(x),
          BigInt(y),
          BigInt(z),
        ]);
        temp.push([x, y, z, Number(maskedIdentity)]);
      }
    }
  }
  return temp;
};
