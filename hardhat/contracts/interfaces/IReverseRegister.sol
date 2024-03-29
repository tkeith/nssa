// SPDX-License-Identifier: UNLICENSED
// !! THIS FILE WAS AUTOGENERATED BY abi-to-sol v0.8.0. SEE SOURCE BELOW. !!
pragma solidity ^0.8.4;

interface IReverseRegister {
    event ControllerChanged(address indexed controller, bool enabled);
    event DefaultResolverChanged(address indexed resolver);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event ReverseClaimed(address indexed addr, bytes32 indexed node);

    function claim(address owner) external returns (bytes32);

    function claimForAddr(
        address addr,
        address owner,
        address resolver
    ) external returns (bytes32);

    function claimWithResolver(address owner, address resolver)
        external
        returns (bytes32);

    function controllers(address) external view returns (bool);

    function defaultResolver() external view returns (address);

    function ens() external view returns (address);

    function node(address addr) external pure returns (bytes32);

    function owner() external view returns (address);

    function renounceOwnership() external;

    function setController(address controller, bool enabled) external;

    function setDefaultResolver(address resolver) external;

    function setName(string memory name) external returns (bytes32);

    function setNameForAddr(
        address addr,
        address owner,
        address resolver,
        string memory name
    ) external returns (bytes32);

    function transferOwnership(address newOwner) external;
}

// THIS FILE WAS AUTOGENERATED FROM THE FOLLOWING ABI JSON:
/*
[{"inputs":[{"internalType":"contract ENS","name":"ensAddr","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"controller","type":"address"},{"indexed":false,"internalType":"bool","name":"enabled","type":"bool"}],"name":"ControllerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract NameResolver","name":"resolver","type":"address"}],"name":"DefaultResolverChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"ReverseClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"claim","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"}],"name":"claimForAddr","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"}],"name":"claimWithResolver","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"defaultResolver","outputs":[{"internalType":"contract NameResolver","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ens","outputs":[{"internalType":"contract ENS","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"node","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"controller","type":"address"},{"internalType":"bool","name":"enabled","type":"bool"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"resolver","type":"address"}],"name":"setDefaultResolver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"setName","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"string","name":"name","type":"string"}],"name":"setNameForAddr","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
*/