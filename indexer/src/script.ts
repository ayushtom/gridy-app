import { Block, EventWithTransaction } from "./deps.ts";
import { hash, BN } from "./deps.ts";

export function formatFelt(key: bigint): string {
  return "0x" + key.toString(16);
}

const filter = {
  header: { weak: true },
  events: [
    {
      fromAddress: Deno.env.get("GAME_CONTRACT_ADDRESS"),
      keys: [hash.getSelectorFromName("TileMinted")],
      includeTransaction: false,
      includeReceipt: false,
    },
    {
      fromAddress: Deno.env.get("GAME_CONTRACT_ADDRESS"),
      keys: [hash.getSelectorFromName("GemstoneClaimed")],
      includeTransaction: false,
      includeReceipt: false,
    },
  ],
};

export const config = {
  streamUrl: "https://sepolia.starknet.a5a.ch",
  startingBlock: Number(Deno.env.get("STARTING_BLOCK")),
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter,
  sinkType: "mongo",

  sinkOptions: {
    connectionString: Deno.env.get("MONGO_CONNECTION_STRING"),
    database: Deno.env.get("DATABASE_NAME"),
    collectionNames: ["tiles_mined", "prize_claims"],
    entityMode: true,
  },
};

export default function transform({ header, events }: Block) {
  if (!header) {
    console.log("missing header, unable to process", events.length, "events");
    return;
  }
  const arr = [];

  events.forEach(({ event }: EventWithTransaction) => {
    const key = BigInt(event.keys[0]);

    switch (key) {
      case BigInt(hash.getSelectorFromName("TileMinted")):
        const keys_length_1 = event?.keys?.length;

        const game_id_1 = parseInt(
          new BN(event.keys[keys_length_1 - 1].slice(2), 16).toString(10)
        );

        const player_1 = formatFelt(BigInt(event.keys[keys_length_1 - 2]));

        for (let i = 2; i < keys_length_1 - 2; i++) {
          const block_id = parseInt(
            new BN(event.keys[i].slice(2), 16).toString(10)
          );

          const tile = {
            game_id: game_id_1,
            player: player_1,
            block_id,
          };

          arr.push({
            collection: "tiles_mined",
            entity: tile,
            update: [],
          });
        }

        break;

      case BigInt(hash.getSelectorFromName("GemstoneClaimed")):
        const keys_length_2 = event?.keys?.length;

        const block_id = parseInt(
          new BN(event.keys[1].slice(2), 16).toString(10)
        );

        const game_id = parseInt(
          new BN(event.keys[keys_length_2 - 1].slice(2), 16).toString(10)
        );

        const player_2 = formatFelt(BigInt(event.keys[keys_length_2 - 2]));

        const prize = {
          player: player_2,
          block_id,
          game_id,
        };

        arr.push({
          collection: "prize_claims",
          entity: prize,
          update: [],
        });

        break;
      default:
        break;
    }
  });

  return arr;
}
