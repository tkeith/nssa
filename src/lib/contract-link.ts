import oracleArtifact from "../../hardhat/artifacts/contracts/Oracle.sol/Oracle.json";
import sepoliaArtifact from "../../hardhat/ignition/deployments/chain-11155111/artifacts/FactoryModule#Factory.json";
import sepoliaDeployedAddresses from "../../hardhat/ignition/deployments/chain-11155111/deployed_addresses.json";

export const CHAIN_ID = 11155111;

const deploymentByChainId = {
  // sepolia
  [11155111]: {
    abi: sepoliaArtifact.abi,
    address: sepoliaDeployedAddresses["FactoryModule#Factory"] as `0x${string}`,
    oracleAbi: oracleArtifact.abi,
    rpcUrl: "https://rpc2.sepolia.org",
  },
};

export const deployment = deploymentByChainId[CHAIN_ID];
