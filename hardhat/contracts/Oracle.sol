// SPDX-License-Identifier: UNLICENSED

// by: tkeith.eth
// trevor@tk.co

pragma solidity ^0.8.13;

import { ByteHasher } from "./helpers/ByteHasher.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";

contract Oracle {

  using ByteHasher for bytes;

  IWorldID internal immutable worldId;
  uint256 internal immutable externalNullifier;
  uint256 internal immutable groupId = 1;

  event Updated(
    uint256 value,
    uint256 updatedAt,
    address updatedBy
  );

  event Staked(address staker, uint256 amount);
  event Unstaked(address staker, uint256 amount);

  // permanent
  string public name;
  string public script;
  uint256 public stakeRequirement;
  uint256 public bountyAmount;
  uint256 public cooloff;

  // mutable
  uint256 public value;
  address public lastUpdatedBy;
  uint256 public lastUpdatedAt;
  mapping(address => uint256) public stakeAmountsByStakerAddress;
  mapping(address => uint256) public nullifierHashesByStakerAddress;
  mapping(uint256 => address) public stakerAddressesByNullifierHash;
  mapping(address => uint256) public votesToBanStakerByStakerAddress;
  mapping(address => mapping(address => bool)) public voterToVoteeToVoted;

  constructor(
    string memory _name,
    string memory _script,
    uint256 _stakeRequirement,
    uint256 _bountyAmount,
    uint256 _cooloff,
    IWorldID _worldId,
    string memory _appId,
    string memory _actionId
  ) {
    name = _name;
    script = _script;
    stakeRequirement = _stakeRequirement;
    bountyAmount = _bountyAmount;
    cooloff = _cooloff;
    worldId = _worldId;
    externalNullifier = abi
      .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
      .hashToField();
  }

  function stake(
    address signal,
    uint256 root,
    uint256 nullifierHash,
    uint256[8] calldata proof
  ) public payable {
    require(msg.value >= stakeRequirement, "Incorrect stake amount");
    require(stakeAmountsByStakerAddress[msg.sender] == 0, "Already staked");
    require(stakerAddressesByNullifierHash[nullifierHash] == address(0), "Nullifier hash already used");

    worldId.verifyProof(
      root,
      groupId,
      abi.encodePacked(signal).hashToField(),
      nullifierHash,
      externalNullifier,
      proof
    );


    stakeAmountsByStakerAddress[msg.sender] = msg.value;
    stakerAddressesByNullifierHash[nullifierHash] = msg.sender;
    nullifierHashesByStakerAddress[msg.sender] = nullifierHash;
    emit Staked(msg.sender, msg.value);
  }

  function unstake() public {
    require(stakeAmountsByStakerAddress[msg.sender] > 0, "Not staked");
    require(votesToBanStakerByStakerAddress[msg.sender] < 5, "Staker is banned");
    payable(msg.sender).transfer(stakeAmountsByStakerAddress[msg.sender]);
    emit Unstaked(msg.sender, stakeAmountsByStakerAddress[msg.sender]);
    stakeAmountsByStakerAddress[msg.sender] = 0;
  }

  function updateValue(uint256 newValue) public {
    require(block.timestamp >= lastUpdatedAt + cooloff, "Cooloff period not yet passed");
    require(address(this).balance >= bountyAmount, "Insufficient balance to pay bounty");
    require(stakeAmountsByStakerAddress[msg.sender] > 0, "Not a staker");
    require(votesToBanStakerByStakerAddress[msg.sender] < 5, "Staker is banned");
    value = newValue;
    lastUpdatedBy = msg.sender;
    lastUpdatedAt = block.timestamp;
    payable(msg.sender).transfer(bountyAmount);
    emit Updated(newValue, block.timestamp, msg.sender);
  }

  function voteToBanStaker(address staker) public {
    require(stakeAmountsByStakerAddress[msg.sender] > 0, "Not a staker");
    require(staker != msg.sender, "Cannot vote to ban self");
    require(voterToVoteeToVoted[msg.sender][staker] == false, "Already voted");
    votesToBanStakerByStakerAddress[staker]++;
    voterToVoteeToVoted[msg.sender][staker] = true;
  }
  
}
