// SPDX-License-Identifier: UNLICENSED

// by: tkeith.eth
// trevor@tk.co

pragma solidity ^0.8.0;

import "./Oracle.sol";


contract Factory {
  event OracleCreated(
    uint256 indexed index,
    address addr
  );

  // permanent
  IWorldID internal immutable worldId;
  string internal appId;
  string internal actionId;

  // mutable
  address[] public oracles;
  mapping(string => address) public oraclesByName;

  constructor(
    IWorldID _worldId,
    string memory _appId,
    string memory _actionId
  ) {
    worldId = _worldId;
    appId = _appId;
    actionId = _actionId;
  }

  function createOracle(
    string memory name,
    string memory script,
    uint256 stakeRequirement,
    uint256 bountyAmount,
    uint256 cooloff
  ) public {
    require(oraclesByName[name] == address(0), "Name already exists");
    Oracle oracle = new Oracle(
      name,
      script,
      stakeRequirement,
      bountyAmount,
      cooloff,
      worldId,
      appId,
      actionId
    );
    oracles.push(address(oracle));
    oraclesByName[name] = address(oracle);
    emit OracleCreated(oracles.length - 1, address(oracle));
  }
  
}
