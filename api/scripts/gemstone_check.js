const DIVISOR = BigInt(1024);

function assetsToImageId(imageAssets) {
  let multiplier = BigInt(1);
  return imageAssets.reduce((acc, value) => {
    acc += value * multiplier;
    multiplier *= DIVISOR;
    return acc;
  }, BigInt(0));
}

function getTileMap() {
  const temp = [];
  for (let z = 0; z < 5; z++) {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
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

function main() {
  const res = getTileMap();

  for (let i = 0; i < res.length; i++) {
    const [x, y, z, id] = res[i];
    console.log(`Tile (${x}, ${y}, ${z}) has ID ${id}`);

    const fetchResult = fetch(
      `<BASE_URL_HERE>/check_for_gemstone?block_id=${id}`
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
      });
  }
}

main();
