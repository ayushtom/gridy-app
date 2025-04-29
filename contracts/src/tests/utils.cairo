use core::serde::Serde;
use core::array::ArrayTrait;
use core::result::ResultTrait;
use core::option::OptionTrait;
use starknet::{ContractAddress, SyscallResultTrait};
use core::traits::TryInto;
use starknet::testing::set_contract_address;
use grid_game::tests::account_mock::SnakeAccountMock;
use grid_game::main::GridGame;
use grid_game::interface::{
        IGridGame, IGridGameDispatcher, IGridGameDispatcherTrait
};
use openzeppelin::token::erc20::interface::{
    IERC20Camel, IERC20CamelDispatcher, IERC20CamelDispatcherTrait
};
use grid_game::tests::erc20_mock::CamelERC20Mock;
use wadray::{Wad,WAD_SCALE};

fn deploy(contract_class_hash: felt252, calldata: Array<felt252>) -> ContractAddress {
    let (address, _) = starknet::syscalls::deploy_syscall(
        contract_class_hash.try_into().unwrap(), 0, calldata.span(), false
    )
        .unwrap_syscall();
    address
}


pub fn deploy_contracts() -> (
    IGridGameDispatcher, ContractAddress, ContractAddress, IERC20CamelDispatcher
) {
    let owner = setup_account('PUBKEY');
    let user = setup_account('PUBKEY_USER');
    set_contract_address(owner);


    let mut token_calldata=array![];

    let token_name: ByteArray="ether";
    let token_symbol: ByteArray="ETH";
    let initial_supply: u256= 400000000000000000000000;

    token_name.serialize(ref token_calldata);
    token_symbol.serialize(ref token_calldata);
    initial_supply.serialize(ref token_calldata);
    user.serialize(ref token_calldata);

    let eth = deploy(CamelERC20Mock::TEST_CLASS_HASH,token_calldata);

    let x_dimension = 1000;
    let y_dimension = 1000;
    let z_dimension = 7;

    let mut calldata = array![];
    owner.serialize(ref calldata);
    eth.serialize(ref calldata);
    
    let address = deploy(
        GridGame::TEST_CLASS_HASH,
        calldata
    );

    (
        IGridGameDispatcher { contract_address: address },
        owner,
        user,
        IERC20CamelDispatcher { contract_address: eth }
    )
}


fn setup_account(pub_key: felt252) -> ContractAddress {
    let mut calldata = array![pub_key];
    deploy(SnakeAccountMock::TEST_CLASS_HASH, calldata)
}