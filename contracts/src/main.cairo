#[starknet::contract]
pub mod GridGame {
    use starknet::{ContractAddress, get_caller_address, ClassHash,get_contract_address};
    use wadray::{Wad,WAD_SCALE};
    use openzeppelin::{
        access::ownable::OwnableComponent,
        upgrades::{UpgradeableComponent, interface::IUpgradeable},
        token::erc20::interface::{IERC20Camel, IERC20CamelDispatcher, IERC20CamelDispatcherTrait}
    };
    use grid_game::{
        interface::IGridGame,
        helpers::{
            constants::{BUY_TOKEN},
            types::{block_status,neighbour_map},
        }
    };
    use alexandria_merkle_tree::merkle_tree::{
        Hasher, MerkleTree, MerkleTreeImpl, poseidon::PoseidonHasherImpl, MerkleTreeTrait,
    };
    use core::poseidon::PoseidonTrait;
    use core::hash::{HashStateTrait, HashStateExTrait};
    use core::num::traits::Zero;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    // handle storage
    #[storage]
    struct Storage {
        initial_price: u256,
        // used to disable contract
        contract_enabled: bool,

        // grid dimensions
        x_dimension: u128,
        y_dimension: u128,
        z_dimension: u128,

        // mined blocks list
        mined_blocks_config: LegacyMap<u128, felt252>,
        
        // block status
        open_status: LegacyMap<felt252, bool>,

        // user mine registry -> stores the mapping of block mapped to each user
        user_mine_registry: LegacyMap<felt252, ContractAddress>,

        // store total gemstones found
        user_num_of_gemstones_found: LegacyMap<ContractAddress, u128>,

        // prize claimed status -> blocks that have been claimed
        prize_claimed_status: LegacyMap<felt252, bool>,

        // user mine count -> stores the number of blocks mined by each user
        user_mine_count: LegacyMap<ContractAddress, u128>,

        // user_shovels_count shovel count -> stores the number of shovels left for each user
        user_shovels_count: LegacyMap<ContractAddress, u128>,

        //shovels_sold -> stores the number of shovels sold
        shovels_sold: LegacyMap<u128, u128>,

        // gemstone location -> stores the location of gemstones
        gemstone_location:LegacyMap<u128, felt252>,

        // game id -> stores the current game id
        game_id:u128,

        // price_bump_threshold -> stores the threshold for price bump
        price_bump_threshold: u128,

        // blocks mined -> stores the number of blocks mined in each game
        blocks_mined:LegacyMap<u128, u128>,

        // payment token -> stores the address of the payment token
        payment_token: ContractAddress,

        // stores total number of gemstones
        total_gemstones: LegacyMap<u128, u128>,

        // gemstones found
        num_of_gemstones_found: LegacyMap<u128, u128>,

        // pending points reward 
        pending_points: LegacyMap<ContractAddress, u256>,

        // total points
        total_points: u256,

        // rewards pool
        rewards_pool: u256,

        // money pools
        dev_pool: Wad,
        prize_pool: Wad,

        // highest score tracking
        highest_score: u256,
        highest_scorer: ContractAddress,

        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        TileMinted: TileMinted,
        GemstoneClaimed: GemstoneClaimed,
        GemstoneLocationUpdated: GemstoneLocationUpdated,
        NewGameInitialized: NewGameInitialized,
        ShovelsSale: ShovelsSale,
        PointsSold: PointsSold,
        HighScoreUpdated: HighScoreUpdated,
    }


    #[derive(Drop, starknet::Event)]
    struct TileMinted {
        #[key]
        blocks: Array<felt252>,
        #[key]
        owner: ContractAddress,
        #[key]
        game_id: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct PointsSold {
        #[key]
        player: ContractAddress,
        #[key]
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct NewGameInitialized {
        #[key]
        game_id: u128,
        #[key]
        location_root: felt252,
        #[key]
        total_gemstones: u128,
        #[key]
        x_dimension: u128,
        #[key]
        y_dimension: u128,
        #[key]
        z_dimension: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct GemstoneClaimed {
        #[key]
        block_id: felt252,
        #[key]
        owner: ContractAddress,
        #[key]
        game_id: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct GemstoneLocationUpdated {
        #[key]
        game_id: u128,
        #[key]
        location_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ShovelsSale {
        #[key]
        user: ContractAddress,
        #[key]
        shovels: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct HighScoreUpdated {
        #[key]
        player: ContractAddress,
        #[key]
        score: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, 
        owner: ContractAddress, 
        payment_token: ContractAddress,
        initial_price: u256
    ) {
        // Set the initial owner of the contract
        self.ownable.initializer(owner);

        // disable contract at deployment
        self.contract_enabled.write(false);

        // set initial values
        self.payment_token.write(payment_token);
        self.initial_price.write(initial_price);
        self.price_bump_threshold.write(100);
        
        // initialize highest score tracking
        self.highest_score.write(0);
        self.highest_scorer.write(starknet::contract_address_const::<0>());
    }

    #[abi(embed_v0)]
    impl GridGame of IGridGame<ContractState> {
        // mine function
        fn mine(ref self: ContractState, batched_blocks: Span<felt252>) {
            // check if contract is enabled
            let contract_enabled = self.contract_enabled.read();
            assert(contract_enabled, 'game is paused');

            let player = get_caller_address();

            let mut mined_blocks = ArrayTrait::new();

            let mined_count= self.blocks_mined.read(self.game_id.read());

            let mut total_increment: u256 = 0;

            let mut index = 0;
            loop {
                if index == batched_blocks.len() {
                    break;
                }
                let block = *batched_blocks.at(index);

                // check if block is already mined
                let open_status = self.open_status.read(block);
                assert(open_status == false, 'block already mined');

                // check if player has shovels count more than 0 
                let user_shovels_count = self.user_shovels_count.read(player);
                assert(user_shovels_count > 0, 'no shovels left');

                // update block mine registry
                self.user_mine_registry.write(block, player);

                // update mined blocks list
                self.mined_blocks_config.write((mined_count + index.try_into().unwrap()) ,block);

                // update user mine count
                let user_mine_count = self.user_mine_count.read(player);
                let new_user_mine_count = user_mine_count + 1;
                self.user_mine_count.write(player, new_user_mine_count);

                // update user shovel count
                let new_user_shovel_count = user_shovels_count - 1;
                self.user_shovels_count.write(player, new_user_shovel_count);

                // update block status
                self.open_status.write(block,true);

                // fetch game id
                let game_id = self.game_id.read();

                let blocks_mined = self.blocks_mined.read(game_id);
                let new_blocks_mined = blocks_mined + 1;
                self.blocks_mined.write(game_id,new_blocks_mined);

                // check if neighbours in radius of 2 have mined the block
                let mut neighbours = self.get_neighbours_from_block(block);
                let array_length: u128 = neighbours.len().try_into().unwrap();

                if array_length > 0 {
                    loop {
                        match neighbours.pop_front() {
                            Option::Some(v) => {
                                let increment: u256 = 2;
                                // allocate new count
                                if (*v.user == player) {
                                    continue;
                                }
                                total_increment += increment;
                            },
                            Option::None(_) => {
                                break;
                            }
                        };
                    };

                    self=unsafe_new_contract_state();
                }

                // update blocks queue
                mined_blocks.append(block);
                
                index += 1;
            };
            self=unsafe_new_contract_state();

            // update user points and game points
            let new_points = self.pending_points.read(player) + batched_blocks.len().try_into().unwrap() + total_increment;
            self.pending_points.write(player, new_points);
            self.total_points.write(self.total_points.read() + batched_blocks.len().try_into().unwrap()+ total_increment);

            // check and update highest score if needed
            let highest_score = self.highest_score.read();
            if new_points > highest_score {
                self.highest_score.write(new_points);
                self.highest_scorer.write(player);
                
                // emit high score updated event
                self.emit(Event::HighScoreUpdated(HighScoreUpdated { player: player, score: new_points }));
            }

            // emit event
            self.emit(Event::TileMinted(TileMinted { blocks:mined_blocks, owner: player, game_id: self.game_id.read() }));
        }

        fn update_pricing(ref self: ContractState, price: u256) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // update initial price
            self.initial_price.write(price);
        }

        // admin function
        fn enable_contract(ref self: ContractState) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Enable the contract
            self.contract_enabled.write(true);
        }

        // admin function
        fn disable_contract(ref self: ContractState) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Disable the contract
            self.contract_enabled.write(false);
        }

        fn withdraw_dev_pool(ref self: ContractState) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // withdraw dev pool
            let dev_pool = self.dev_pool.read();
            let formatted_dev_pool : u256 = dev_pool.val.try_into().unwrap();

            let token_address= self.payment_token.read();
            let starknet_erc20 = IERC20CamelDispatcher { contract_address: token_address };

            // approve owner
            let approve_result = starknet_erc20.approve(get_caller_address(), formatted_dev_pool);
            assert(approve_result, 'approve failed');

            let transfer_result = starknet_erc20.transferFrom(get_contract_address(),get_caller_address(), formatted_dev_pool);
            assert(transfer_result, 'transfer failed');
        }

        fn top_up(ref self: ContractState, amount: u256) {
            let token_address= self.payment_token.read();
            let starknet_erc20 = IERC20CamelDispatcher { contract_address: token_address };

            // approve
            let approve_result = starknet_erc20.approve(get_contract_address(), amount);
            assert(approve_result, 'approve failed');

            // transfer tokens
            let transfer_result = starknet_erc20.transferFrom(get_caller_address(), get_contract_address(), amount);
            assert(transfer_result, 'transfer failed');

        }

        fn get_points_value(self: @ContractState, number_of_points: u128) -> Wad {
            let prize_pool = self.prize_pool.read();
            let total_points = self.total_points.read();   
            let liquid_amount =  prize_pool * Wad { val: number_of_points * WAD_SCALE } / Wad { val: total_points.low.into() * WAD_SCALE };

            liquid_amount
        }

        fn liquidify_points(ref self: ContractState, number_of_points: u128) {
            let user= get_caller_address();
            let contract=get_contract_address();
            let prize_pool = self.prize_pool.read();

            let total_points = self.total_points.read();   

            let pending_points=self.pending_points.read(user);   
            assert(pending_points.low.into() >= number_of_points, 'insufficient points');

            let token_address= self.payment_token.read();
            let starknet_erc20 = IERC20CamelDispatcher { contract_address: token_address };
            let liquid_amount =  prize_pool * Wad { val: number_of_points * WAD_SCALE } / Wad { val: total_points.low.into() * WAD_SCALE };
            let formatted_liquid_amount : u256 = liquid_amount.try_into().unwrap();

            // check balance
            let balance = starknet_erc20.balanceOf(contract);
            assert(balance >= formatted_liquid_amount, 'insufficient balance');

            // approve as allowance
            let approve_result = starknet_erc20.approve(contract, formatted_liquid_amount);
            assert(approve_result, 'approve failed');

            let transfer_result = starknet_erc20.transferFrom(contract,user, formatted_liquid_amount);
            assert(transfer_result, 'transfer failed');

            let formatted_number_of_points : u256 = number_of_points.try_into().unwrap();

            self.pending_points.write(user, (pending_points - formatted_number_of_points));
            self.total_points.write(total_points - formatted_number_of_points);
            self.prize_pool.write(prize_pool - liquid_amount);

            // emit event
            self.emit(Event::PointsSold(PointsSold { player: user, amount: formatted_number_of_points }));

            // check and update highest score if needed
            let current_player_points = self.pending_points.read(user);
            let highest_score = self.highest_score.read();
            
            if current_player_points > highest_score {
                self.highest_score.write(current_player_points);
                self.highest_scorer.write(user);
                
                // emit high score updated event
                self.emit(Event::HighScoreUpdated(HighScoreUpdated { player: user, score: current_player_points }));
            }
        }

        fn get_dev_pool(self: @ContractState) -> Wad {
            self.dev_pool.read()
        }

        fn get_prize_pool(self: @ContractState) -> Wad {
            self.prize_pool.read()
        }

        fn get_points_count(self: @ContractState, player: ContractAddress)-> u256 {
            self.pending_points.read(player)
        }

        // admin function
        fn set_payment_token(ref self: ContractState, token_address: ContractAddress) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // set payment token
            self.payment_token.write(token_address);
        }

        // admin function
        fn update_gemstone_locations(ref self: ContractState, game_id:u128, location_root: felt252) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();
            self.gemstone_location.write(game_id, location_root);

            // emit event
            self.emit(Event::GemstoneLocationUpdated(GemstoneLocationUpdated { game_id: game_id, location_root: location_root }));
        }

        // admin function
        fn start_new_game(ref self: ContractState, gemstone_location: felt252, total_gemstones: u128, x_dimension: u128, y_dimension: u128, z_dimension: u128) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // increment game id
            let game_id = self.game_id.read();
            let new_game_id = game_id + 1;
            self.game_id.write(new_game_id);


            let mut index=0;
            loop{
                if (index == self.blocks_mined.read(game_id)){
                    break;
                }

                let block_id = self.mined_blocks_config.read(index);

                // reset open status
                self.open_status.write(block_id, false);

                // reset user mine registry
                self.user_mine_registry.write(block_id, Zero::zero());

                // reset prize claimed status
                self.prize_claimed_status.write(block_id, false);

                // reset config
                self.mined_blocks_config.write(index, 0);
            };
            self=unsafe_new_contract_state();

            // update game state
            self.gemstone_location.write(new_game_id, gemstone_location);
            self.total_gemstones.write(new_game_id, total_gemstones);
            self.blocks_mined.write(new_game_id, 0);
            self.x_dimension.write(x_dimension);
            self.y_dimension.write(y_dimension);
            self.z_dimension.write(z_dimension);

            // emit event
            self.emit(Event::NewGameInitialized(NewGameInitialized { game_id: new_game_id, location_root: gemstone_location, total_gemstones: total_gemstones, x_dimension: x_dimension, y_dimension: y_dimension, z_dimension: z_dimension }));
        }

        fn view_neighbours_from_block(self: @ContractState,block_id: felt252) -> Span<neighbour_map> {
            self.get_neighbours_from_block(block_id)
        }

        fn set_price_bump_threshold(ref self: ContractState, threshold: u128) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // set price bump threshold
            self.price_bump_threshold.write(threshold);
        }

        fn get_total_gemstones(self: @ContractState) -> u128 {
            self.total_gemstones.read(self.game_id.read())
        }

        fn get_rewards_claimed(self: @ContractState) -> u256 {
            self.rewards_pool.read()
        }

        fn get_user_gemstones_found(self: @ContractState, user: ContractAddress) -> u128 {
            self.user_num_of_gemstones_found.read(user)
        }

        fn get_blocks_mined(self: @ContractState) -> u128 {
            self.blocks_mined.read(self.game_id.read())
        }

        fn get_current_game_id(self: @ContractState) -> u128 {
            self.game_id.read()
        }

        fn get_existing_price(self: @ContractState, shovels: u128)->Wad {
            self.get_price(shovels)
        }

        fn get_user_mine_count(self: @ContractState, user: ContractAddress) -> u128 {
            let count : u128 = self.user_mine_count.read(user);

            if count == 0 {
                0
            }
            else {
                count
            }
        }

        fn get_gemstone_locations(self: @ContractState, game_id: u128) -> felt252 {
            self.gemstone_location.read(game_id)
        }

        fn get_total_points(self: @ContractState) -> u256 {
            self.total_points.read()
        }

        fn get_user_pending_shovels(self: @ContractState, user: ContractAddress) -> u128 {
            self.user_shovels_count.read(user)
        }

        fn get_block_status(self: @ContractState, block_id: felt252) -> block_status {
            block_status {
                block_id: block_id,
                open_status: self.open_status.read(block_id),
                user: self.user_mine_registry.read(block_id),
            }
        }

        fn get_contract_enabled(self: @ContractState) -> bool {
            self.contract_enabled.read()
        }

        fn get_total_gemstones_found(self: @ContractState) -> u128 {
            self.num_of_gemstones_found.read(self.game_id.read())
        }

        fn claim_gemstone(ref self: ContractState, proof: Span<felt252>, nonce: felt252, game_id: u128, block_id: felt252, prize: felt252) {
            // check if block is already mined
            let open_status = self.open_status.read(block_id);
            assert(open_status, 'block not mined');

            // This function can only be called by the owner
            let player=get_caller_address();
            let block_owner = self.user_mine_registry.read(block_id);
            assert(block_owner == player, 'caller is not the miner');

            // check if prize is already claimed
            let prize_claimed_status = self.prize_claimed_status.read(block_id);
            assert(!prize_claimed_status, 'prize already claimed');
            
            // verify proof
            let block_nonce_hash = PoseidonTrait::new().update(block_id).update(nonce).update(prize).finalize();
            let check_if_valid_proof = self.verify_proof(proof, game_id, block_nonce_hash);
            assert(check_if_valid_proof, 'invalid proof');

            // update gemstones found count
            let gemstones_found = self.num_of_gemstones_found.read(game_id);
            let new_gemstones_found = gemstones_found + 1;
            self.num_of_gemstones_found.write(game_id, new_gemstones_found);

            // update prize claimed status
            self.prize_claimed_status.write(block_id, true);

            // update gemstones found count
            let user_gemstones_found = self.user_num_of_gemstones_found.read(player);
            let new_user_gemstones_found = user_gemstones_found + 1;
            self.user_num_of_gemstones_found.write(player, new_user_gemstones_found);

            // pause game if all gemstones are found
            if gemstones_found == self.total_gemstones.read(game_id) {
                self.contract_enabled.write(false);
            }

            // update user share count
            let formatted_prize : u256 = prize.try_into().unwrap();
            let user_points = self.pending_points.read(player);
            let new_user_points = user_points + formatted_prize;
            self.pending_points.write(player, new_user_points);

            // update total points
            let total_points = self.total_points.read();
            let new_total_points = total_points + formatted_prize;
            self.total_points.write(new_total_points);

            // check and update highest score if needed
            if new_user_points > self.highest_score.read() {
                self.highest_score.write(new_user_points);
                self.highest_scorer.write(player);
                
                // emit high score updated event
                self.emit(Event::HighScoreUpdated(HighScoreUpdated { player: player, score: new_user_points }));
            }

            // emit event
            self.emit(Event::GemstoneClaimed(GemstoneClaimed { block_id:block_id, owner: player, game_id: self.game_id.read() }));
        }

        fn buy_user_shovels(ref self: ContractState, shovels: u128) {
            let user= get_caller_address();

            let price = self.get_price(shovels);
            let pricing : u256 = price.try_into().unwrap();

            let token_address= self.payment_token.read();
            let starknet_erc20 = IERC20CamelDispatcher { contract_address: token_address };
            
            // handle developer cut
            let dev_pool = self.dev_pool.read();
            let dev_pool_cut = self.get_dev_pool_cut(price);
            let new_dev_pool = dev_pool + dev_pool_cut;
            self.dev_pool.write(new_dev_pool);
            
            // handle prize pool cut
            let prize_pool = self.prize_pool.read();
            let new_prize_pool = prize_pool + price - dev_pool_cut;
            self.prize_pool.write(new_prize_pool);

            // approve as allowance
            let approve_result = starknet_erc20.approve(get_contract_address(), pricing);
            assert(approve_result, 'approve failed');

            // transfer tokens
            let transfer_result = starknet_erc20.transferFrom(user, token_address, pricing);
            assert(transfer_result, 'transfer failed');

            let user_shovels_count = self.user_shovels_count.read(user);
            let new_user_shovel_count = user_shovels_count + shovels;
            self.user_shovels_count.write(user, new_user_shovel_count);

            // add to shovels sold for current game id
            let shovels_sold = self.shovels_sold.read(self.game_id.read());
            let new_shovels_sold = shovels_sold + shovels;
            self.shovels_sold.write(self.game_id.read(), new_shovels_sold);

            // emit event
            self.emit(Event::ShovelsSale(ShovelsSale { user: user, shovels: shovels }));
        }

        fn get_highest_score(self: @ContractState) -> u256 {
            // Return the highest score recorded
            self.highest_score.read()
        }

        fn get_highest_scorer(self: @ContractState) -> ContractAddress {
            // Return the address of the player with the highest score
            self.highest_scorer.read()
        }
    }


    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_neighbours_from_block(self: @ContractState, block_id: felt252) -> Span<neighbour_map> {
            let coords = self.get_coordinates_from_blockid(block_id);
            if coords.len() != 3 {
                let empty_array: Array<neighbour_map> = ArrayTrait::new();
                return empty_array.span();
            }

            let x = *coords.at(0);
            let y = *coords.at(1);
            let z = *coords.at(2);

            let mut neighbours = ArrayTrait::new();

            // Check neighbors in all directions within a radius of 2
            let mut i : i32 = -2;
            loop {
                if i > 2 {
                    break;
                }

                let mut j : i32 = -2;
                loop {
                    if j > 2 {
                        break;
                    }

                    let mut k: i32 = -2;
                    loop {
                        if k > 2 {
                            break;
                        }

                        // Skip the block itself
                        if i == 0 && j == 0 && k == 0 {
                            k += 1;
                            continue;
                        }

                        // Calculate neighbor coordinates
                        let nx = if x.try_into().unwrap() + i < 0 {
                            0
                        } else {
                            (x.try_into().unwrap() + i).try_into().unwrap()
                        };

                        let ny = if y.try_into().unwrap() + j < 0 {
                            0
                        } else {
                            (y.try_into().unwrap() + j).try_into().unwrap()
                        };

                        let nz = if z.try_into().unwrap() + k < 0 {
                            0
                        } else {
                            (z.try_into().unwrap() + k).try_into().unwrap()
                        };

                        // Skip if out of bounds
                        if nx >= self.x_dimension.read() || ny >= self.y_dimension.read() || nz >= self.z_dimension.read() {
                            k += 1;
                            continue;
                        }

                        // Compute the block ID for the neighbor
                        let neighbor_block_id = nx + ny * 1024 + nz * 1024 * 1024;
                        let felt_neighbor_block_id: felt252 = neighbor_block_id.into();

                        // Check if the block is mined
                        let is_mined = self.open_status.read(felt_neighbor_block_id);
                        if is_mined {
                            let owner = self.user_mine_registry.read(felt_neighbor_block_id);
                            neighbours.append(neighbour_map { block_id: felt_neighbor_block_id, user: owner });
                        }

                        k += 1;
                    };
                    j += 1;
                };
                i += 1;
            };

            neighbours.span()
        }

        fn get_price(self: @ContractState, shovels: u128)-> Wad {
            let number_of_blocks_mined = self.blocks_mined.read(self.game_id.read());
            let mut starting_price:Wad = self.get_initial_price(shovels);

            let increment= 500000000000000000;


            let price_bump_threshold = self.price_bump_threshold.read();

            if (number_of_blocks_mined <= price_bump_threshold) {
                return starting_price;
            }
            else if (number_of_blocks_mined >price_bump_threshold && number_of_blocks_mined <=2*price_bump_threshold){
                starting_price =starting_price + (Wad { val: increment } * starting_price);
            }
            else if (number_of_blocks_mined >2*price_bump_threshold && number_of_blocks_mined <=3*price_bump_threshold){
                starting_price = starting_price + (Wad { val: increment } * starting_price * Wad { val: 2 * WAD_SCALE });
            }
            else if (number_of_blocks_mined >3*price_bump_threshold && number_of_blocks_mined <=4*price_bump_threshold){
                starting_price = starting_price +  (Wad { val: increment } * starting_price * Wad { val: 3 * WAD_SCALE });
            }
            else if (number_of_blocks_mined >4*price_bump_threshold && number_of_blocks_mined <=5*price_bump_threshold){
                starting_price = starting_price + (Wad { val: increment } * starting_price * Wad { val: 4 * WAD_SCALE });
            }
            starting_price
        }

        fn get_dev_pool_cut(self: @ContractState, price: Wad) -> Wad {
            // Calculate the developer's cut from the price (e.g., 10%)
            let dev_cut_percentage = Wad { val: 100000000000000000 }; // 10%
            price * dev_cut_percentage
        }
        
        fn verify_proof(self: @ContractState, proof: Span<felt252>, game_id: u128, mut current_node: felt252) -> bool {
            let location_root = self.gemstone_location.read(game_id);
            let mut mutable_proof = proof.clone();
            let mut merkle_tree: MerkleTree<Hasher> = MerkleTreeImpl::new();
            let is_valid = merkle_tree.verify(location_root, current_node, mutable_proof);
            is_valid
        }

        fn get_initial_price(self: @ContractState, shovels: u128) -> Wad {
            let mut starting_price: Wad = Wad { val: self.initial_price.read().low.into() };
            let max_price = Wad { val: 1000 * WAD_SCALE };
            if shovels == 5 {
                starting_price
            }
            else if shovels == 10  {
                let ratio = Wad { val: 900000000000000000 };
                (starting_price*ratio* Wad { val: 2 * WAD_SCALE })
            }
            else if shovels == 20 {
                let ratio = Wad { val: 800000000000000000 };
                (starting_price*ratio* Wad { val: 4 * WAD_SCALE })
            }
            else if shovels == 30 {
                let ratio = Wad { val: 700000000000000000 };
                (starting_price*ratio* Wad { val: 6 * WAD_SCALE })
            }
            else{
                max_price
            }
        }

        fn get_coordinates_from_blockid(self: @ContractState, block_id: felt252) -> Span<u128> {
            let mut block_id_formatted : u128= block_id.try_into().unwrap();
            let mut assets: Array<u128> = ArrayTrait::new();
            let mut i = 0;
            let divider: NonZero<u128> = 1024_u128.try_into().unwrap();
            loop {
                if i == 3 {
                    break;
                }
                let (q, r) = DivRem::<u128>::div_rem(block_id_formatted, divider);
                assets.append(r.try_into().unwrap());
                block_id_formatted = q;
                i += 1;
            };
            assets.span()

        }

        fn image_id_to_assets(self: @ContractState, mut image_id: u128) -> Span<u128> {
            let mut assets = ArrayTrait::new();
            let mut i = 0;
            let divider: NonZero<u128> = 1024_u128.try_into().unwrap();
            loop {
                if i == 3 {
                    break;
                }
                let (q, r) = DivRem::<u128>::div_rem(image_id, divider);
                assets.append(r.try_into().unwrap());
                image_id = q;
                i += 1;
            };
            assets.span()
        }

        fn assets_to_image_id(self: @ContractState, mut assets: Span<u128>) -> u128 {
            let mut acc = 0_u128;
            let mut mult = 1_u128;

            loop {
                if assets.len() == 0 {
                    break;
                }
                let asset = assets.pop_front().unwrap();
                acc += (*asset * mult);
                mult *= 1024_u128;
            };
            acc
        }

        fn get_prize_pool_cut(self: @ContractState, amount: Wad) -> Wad {
            let prize_pool_cut = Wad { val:  900000000000000000 };
            let prize_pool_cut_amount = (amount * prize_pool_cut);

            prize_pool_cut_amount

        }
    }
}