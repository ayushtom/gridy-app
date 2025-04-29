import { Type as RecsType } from "@dojoengine/recs";

export type Block = {
  x: RecsType.BigInt;
  y: RecsType.BigInt;
};

export type PrizeStatusType = RecsType.BigInt;

export type LayerProps = {
  setRemovedLayers: React.Dispatch<React.SetStateAction<Block[]>>;
  position: Array<number>;
};
