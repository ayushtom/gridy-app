use starknet::ContractAddress;
use grid_game::helpers::types::{block_status,neighbour_map};
use wadray::Wad;

#[starknet::interface]
pub trait IGridGame<TContractState> {
    // admin
    fn enable_contract(ref self: TContractState);
    fn disable_contract(ref self: TContractState);
    fn update_gemstone_locations(ref self: TContractState,game_id:u128, location_root: felt252);
    fn start_new_game(ref self: TContractState, gemstone_location: felt252, total_gemstones: u128, x_dimension: u128, y_dimension: u128, z_dimension: u128);
    fn set_payment_token(ref self: TContractState, token_address: ContractAddress);
    fn set_price_bump_threshold(ref self: TContractState, threshold: u128);
    fn withdraw_dev_pool(ref self: TContractState);
    fn update_pricing(ref self: TContractState, price: u256);
    
    // user
    fn mine(ref self: TContractState, batched_blocks: Span<felt252>);
    fn claim_gemstone(ref self: TContractState, proof: Span<felt252>, nonce: felt252, game_id: u128,block_id: felt252, prize:felt252);
    fn buy_user_shovels(ref self: TContractState, shovels: u128);
    fn top_up(ref self: TContractState, amount: u256);
    fn liquidify_points(ref self: TContractState, number_of_points: u128);

    // view
    fn get_block_status(self: @TContractState, block_id: felt252) -> block_status;
    fn get_blocks_mined(self: @TContractState) -> u128;
    fn get_total_gemstones(self: @TContractState) -> u128;
    fn get_current_game_id(self: @TContractState) -> u128;
    fn get_user_mine_count(self: @TContractState, user: ContractAddress) -> u128;
    fn get_total_gemstones_found(self: @TContractState) -> u128;
    fn get_user_gemstones_found(self: @TContractState, user: ContractAddress) -> u128;
    fn get_rewards_claimed(self: @TContractState) -> u256;
    fn get_existing_price(self: @TContractState, shovels: u128) -> Wad;
    fn get_gemstone_locations(self: @TContractState, game_id: u128) -> felt252;
    fn get_user_pending_shovels(self: @TContractState, user: ContractAddress) -> u128;
    fn get_contract_enabled(self: @TContractState) -> bool;
    fn get_points_count(self: @TContractState, player: ContractAddress) -> u256;
    fn get_total_points(self: @TContractState) -> u256;
    fn get_dev_pool(self: @TContractState) -> Wad;
    fn get_prize_pool(self: @TContractState) -> Wad;
    fn view_neighbours_from_block(self: @TContractState, block_id: felt252) -> Span<neighbour_map>;
    fn get_points_value(self: @TContractState, number_of_points: u128) -> Wad;
    fn get_highest_score(self: @TContractState) -> u256;
    fn get_highest_scorer(self: @TContractState) -> ContractAddress;
}