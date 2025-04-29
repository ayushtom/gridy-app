use starknet::ContractAddress;
use starknet::testing;
use starknet::testing::{set_contract_address, set_block_timestamp};
use starknet::contract_address_const;
use core::hash::LegacyHash;
use super::utils::{deploy_contracts};
use grid_game::interface::{
        IGridGame, IGridGameDispatcher, IGridGameDispatcherTrait
};
use openzeppelin::token::erc20::interface::{
    IERC20Camel, IERC20CamelDispatcher, IERC20CamelDispatcherTrait
};
use wadray::{Wad,WAD_SCALE};

#[test]
#[available_gas(20000000000)]
fn test_buying_click() {
    let (game_contract, owner, user, erc20) = deploy_contracts();
    let block_id: felt252 = 1050625;   
    let user_initial_balance= erc20.balanceOf(user); 
    let initial_price = 10000000000000000000;
    let additional_price = 34000000000000000000;

    // owner operations 
    set_contract_address(owner);

    // enable contract
    game_contract.enable_contract();
    
    // user operations 
    set_contract_address(user);

    erc20.approve(game_contract.contract_address, 1100000000000000000000);
    
    // mine
    game_contract.buy_user_shovels(1);

    // verify balance change
    let user_final_balance= erc20.balanceOf(user);
    assert_eq!(user_final_balance, user_initial_balance - initial_price );


    // check click count
    let user_clicks = game_contract.get_user_pending_shovels(user);
    assert_eq!(user_clicks, 5);


    // buy more clicks
    erc20.approve(game_contract.contract_address, additional_price);
    game_contract.buy_user_shovels(20);

    // verify balance change
    let user_final_balance= erc20.balanceOf(user);
    assert_eq!(user_final_balance, user_initial_balance - initial_price - additional_price );

    // check click count
    let user_clicks = game_contract.get_user_pending_shovels(user);
    assert_eq!(user_clicks, 25);
}


#[test]
#[available_gas(20000000000)]
fn test_buying_click_inflation() {
    let (game_contract, owner, user, erc20) = deploy_contracts();
    let mut block_id: felt252 = 1050625;   
    let initial_price = 48000000000000000000;
    let user_initial_balance= erc20.balanceOf(user); 
    let price_bump= 2500000000000000000;

    // owner operations
    set_contract_address(owner);

    // enable contract
    game_contract.enable_contract();

    // user operations
    set_contract_address(user);

    erc20.approve(game_contract.contract_address, 4000000000000000000000);

    game_contract.buy_user_shovels(30);
    game_contract.buy_user_shovels(30);
    game_contract.buy_user_shovels(30);
    game_contract.buy_user_shovels(30);

    let mut arr= ArrayTrait::new();

    let user_final_balance_1= erc20.balanceOf(user);
    assert_eq!(user_final_balance_1, user_initial_balance - 4*initial_price);


    let mut flag=0;
    loop {
        arr.append(block_id);
        block_id += 1;
        flag += 1;

        if flag == 110 {
            break;
        }
    };

    game_contract.mine(arr.span());

    game_contract.buy_user_shovels(30);

    let user_final_balance_2= erc20.balanceOf(user);
    assert_eq!(user_final_balance_2, user_initial_balance - 5 * initial_price - price_bump);

}

#[test]
#[available_gas(20000000000)]
fn test_claim_gemstone_price() {
    let (game_contract, owner, user, erc20) = deploy_contracts();
    let game_id: u128 = 1;
    let user_initial_balance= erc20.balanceOf(user); 
    let prize = 1000000000000000000;

    let proof: Span<felt252> = array![
        3257458000077256068496651147184406467328369242261030017864176987702506556894,
        1479270287436152531333472575339567204925512377018822897129033770608210140917,
        2840348863186440969995368572885728426913859553447302220040541957649118388824,
        2616833200628548322954457342066810701069461450585280565189812090199775586352,
        1839285185942297528503004443045849016034458970542100811958221619032415903802
      ].span();

    let block_id: felt252 = 4203522;
    let nonce : felt252 = 2746395;

    let root_location: felt252 = 1097733285495337211574507552307849318190491715060330167130117489707085965305; 

    // owner operations 
    set_contract_address(owner);

    // enable contract
    game_contract.enable_contract();
    game_contract.update_gemstone_locations(game_id,root_location);


    // user operations
    set_contract_address(user);

    erc20.approve(game_contract.contract_address, 4000000000000000000000);

    // buy clicks
    game_contract.buy_user_shovels(1);

    // mine
    game_contract.mine(array![block_id].span());

    // claim gemstone
    game_contract.claim_gemstone(proof,nonce,game_id,block_id,prize);

}