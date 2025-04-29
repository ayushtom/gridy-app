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
