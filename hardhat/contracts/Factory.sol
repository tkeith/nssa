// SPDX-License-Identifier: UNLICENSED

// by: tkeith.eth
// trevor@tk.co

pragma solidity ^0.8.0;

import "./Oracle.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";
// import { INameWrapper } from "./interfaces/INameWrapper.sol";
// import { IPublicResolver } from "./interfaces/IPublicResolver.sol";
// import { IReverseRegister } from "./interfaces/IReverseRegister.sol";

contract Factory {
  event OracleCreated(
    uint256 indexed index,
    address addr
  );

  // permanent - worldcoin
  bool internal immutable worldEnabled;
  IWorldID internal immutable worldId;
  string internal appId;
  string internal actionId;

  // permanent - ens
  bool internal ensEnabled;
  // INameWrapper internal immutable nameWrapper;
  // IReverseRegister internal immutable reverseRegister;
  // IPublicResolver internal immutable publicResolver;

  // mutable
  address[] public oracles;
  mapping(string => address) public oraclesByName;
  mapping(bytes32 => address) public oraclesByNode;

  constructor(
    bool _worldEnabled,
    IWorldID _worldId,
    string memory _appId,
    string memory _actionId,
    bool _ensEnabled
    // INameWrapper _nameWrapper,
    // IReverseRegister _reverseRegister,
    // IPublicResolver _publicResolver
  ) {
    worldEnabled = _worldEnabled;
    worldId = _worldId;
    appId = _appId;
    actionId = _actionId;
    ensEnabled = _ensEnabled;
    // nameWrapper = _nameWrapper;
    // reverseRegister = _reverseRegister;
    // publicResolver = _publicResolver;
  }

  function addr(bytes32 node) public view returns (address) {
    return oraclesByNode[node];
  }

  function createOracle(
    string memory name,
    bytes32 node,
    string memory script,
    uint256 stakeRequirement,
    uint256 bountyAmount,
    uint256 cooloff
  ) public {
    require(oraclesByName[name] == address(0), "Name already exists");
    require(oraclesByNode[node] == address(0), "Node already exists");
    Oracle oracle = new Oracle(
      name,
      node,
      script,
      stakeRequirement,
      bountyAmount,
      cooloff,
      worldEnabled,
      worldId,
      appId,
      actionId,
      ensEnabled
      // nameWrapper,
      // reverseRegister,
      // publicResolver
    );
    oracles.push(address(oracle));
    oraclesByName[name] = address(oracle);
    oraclesByNode[node] = address(oracle);

    emit OracleCreated(oracles.length - 1, address(oracle));
  }
  
}
