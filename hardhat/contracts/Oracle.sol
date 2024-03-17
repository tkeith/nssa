// SPDX-License-Identifier: UNLICENSED

// by: tkeith.eth
// trevor@tk.co

pragma solidity ^0.8.13;

import { ByteHasher } from "./helpers/ByteHasher.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";
// import { INameWrapper } from "./interfaces/INameWrapper.sol";
// import { IPublicResolver } from "./interfaces/IPublicResolver.sol";
// import { IReverseRegister } from "./interfaces/IReverseRegister.sol";

contract Oracle {

  using ByteHasher for bytes;

  event Updated(
    uint256 value,
    uint256 updatedAt,
    address updatedBy
  );

  event Staked(address staker, uint256 amount);
  event Unstaked(address staker, uint256 amount);

  // permanent - worldcoin
  bool internal immutable worldEnabled;
  IWorldID internal immutable worldId;
  uint256 internal immutable externalNullifier;
  uint256 internal immutable groupId = 1;

  // permanent - ens
  bool internal immutable ensEnabled;
  // INameWrapper internal immutable nameWrapper;
  // IReverseRegister internal immutable reverseRegister;
  // IPublicResolver internal immutable publicResolver;

  // permanent
  string public name;
  bytes32 public node;
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

  // track the amount of payments received
  uint256 public currentBountiesHeld;

  constructor(
    string memory _name,
    bytes32 _node,
    string memory _script,
    uint256 _stakeRequirement,
    uint256 _bountyAmount,
    uint256 _cooloff,
    bool _worldEnabled,
    IWorldID _worldId,
    string memory _appId,
    string memory _actionId,
    bool _ensEnabled
    // INameWrapper _nameWrapper,
    // IReverseRegister _reverseRegister,
    // IPublicResolver _publicResolver
  ) {
    name = _name;
    node = _node;
    script = _script;
    stakeRequirement = _stakeRequirement;
    bountyAmount = _bountyAmount;
    cooloff = _cooloff;
    worldEnabled = _worldEnabled;
    worldId = _worldId;
    externalNullifier = abi
      .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
      .hashToField();
    ensEnabled = _ensEnabled;
    // nameWrapper = _nameWrapper;
    // reverseRegister = _reverseRegister;
    // publicResolver = _publicResolver;
  }

  // fallback function to accept payments
  receive() external payable {
    currentBountiesHeld += msg.value;
  }

  function stake(
    address signal,
    uint256 root,
    uint256 nullifierHash,
    uint256[8] calldata proof
  ) public payable {
    require(msg.value >= stakeRequirement, "Incorrect stake amount");
    require(stakeAmountsByStakerAddress[msg.sender] == 0, "Already staked");

    if (worldEnabled) {
      require(stakerAddressesByNullifierHash[nullifierHash] == address(0), "Nullifier hash already used");

      worldId.verifyProof(
        root,
        groupId,
        abi.encodePacked(signal).hashToField(),
        nullifierHash,
        externalNullifier,
        proof
      );
        
      stakerAddressesByNullifierHash[nullifierHash] = msg.sender;
      nullifierHashesByStakerAddress[msg.sender] = nullifierHash;

    }

    stakeAmountsByStakerAddress[msg.sender] = msg.value;
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
    require(currentBountiesHeld >= bountyAmount, "Insufficient balance to pay bounty");
    require(stakeAmountsByStakerAddress[msg.sender] > 0, "Not a staker");
    require(votesToBanStakerByStakerAddress[msg.sender] < 5, "Staker is banned");
    value = newValue;
    lastUpdatedBy = msg.sender;
    lastUpdatedAt = block.timestamp;
    payable(msg.sender).transfer(bountyAmount);
    currentBountiesHeld -= bountyAmount;
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
