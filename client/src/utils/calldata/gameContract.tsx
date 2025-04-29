import { Call, CallData } from "starknet";

function mine(token_id: string[]): Call {
  const mineCallData = CallData.compile({
    batched_blocks: token_id,
  });

  return {
    contractAddress: import.meta.env.VITE_GAME_CONTRACT_ADDRESS as string,
    entrypoint: "mine",
    calldata: mineCallData,
  };
}

function sellPoints(number_of_points: number): Call {
  const mineCallData = CallData.compile({
    number_of_points: number_of_points,
  });

  return {
    contractAddress: import.meta.env.VITE_GAME_CONTRACT_ADDRESS as string,
    entrypoint: "liquidify_points",
    calldata: mineCallData,
  };
}

function buyShovels(num_of_clicks: number): Call {
  const buyCallData = CallData.compile({
    shovels: num_of_clicks,
  });

  return {
    contractAddress: import.meta.env.VITE_GAME_CONTRACT_ADDRESS as string,
    entrypoint: "buy_user_shovels",
    calldata: buyCallData,
  };
}

function claimGemstone({
  block_id,
  game_id,
  proof,
  nonce,
  prize,
}: {
  block_id: number;
  game_id: number;
  proof: string[];
  nonce: number;
  prize: number;
}): Call {
  const claimCallData = CallData.compile({
    proof: proof,
    nonce: nonce.toString(),
    game_id: game_id.toString(),
    block_id: block_id.toString(),
    prize: prize.toString(),
  });

  return {
    contractAddress: import.meta.env.VITE_GAME_CONTRACT_ADDRESS as string,
    entrypoint: "claim_gemstone",
    calldata: claimCallData,
  };
}

const gameContractCalls = {
  mine,
  buyShovels,
  claimGemstone,
  sellPoints,
};

export default gameContractCalls;
