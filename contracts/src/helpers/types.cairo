use starknet::{ContractAddress};

#[derive(Drop, Serde,Debug, starknet::Store)]
pub struct block_status {
    pub block_id: felt252,
    pub open_status: bool,
    pub user: ContractAddress,
}

#[derive(Drop, Serde,Debug, starknet::Store)]
pub struct neighbour_map {
    pub user: ContractAddress,
    pub block_id: felt252,
}