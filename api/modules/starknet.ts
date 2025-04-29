import "dotenv/config";
import { Contract, RpcProvider } from "starknet";

let myContract: Contract;

const setupContract = async () => {
  //initialize provider with a Sepolia Testnet node
  const provider = new RpcProvider({ nodeUrl: process.env.NODE_URL });
  // Connect the deployed Test contract in Sepolia Testnet
  const contractAddress = process.env.GAME_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not found in .env");
  }

  // read abi of Test contract
  const { abi } = await provider.getClassAt(contractAddress);
  if (abi === undefined) {
    throw new Error("no abi.");
  }
  myContract = new Contract(abi, contractAddress, provider);
};

export const checkIfBlockMined = async (block_id: number) => {
  if (!myContract) {
    await setupContract();
  }

  const response = await myContract.get_block_status(block_id);
  return response;
};
