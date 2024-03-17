"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  namehash,
} from "viem";
import { normalize } from "viem/ens";
import * as sepoliaArtifact from "../../../hardhat/ignition/deployments/chain-11155111/artifacts/FactoryModule#Factory.json";
import * as sepoliaDeployedAddresses from "../../../hardhat/ignition/deployments/chain-11155111/deployed_addresses.json";
import { sepolia } from "viem/chains";

interface FormData {
  name: string;
  script: string;
  stakeRequirement: number;
  bountyAmount: number;
  cooloffPeriod: number;
}

export default function Oracles() {
  const [selectedOracle, setSelectedOracle] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<FormData>();

  const deploymentByChainId = {
    // sepolia
    [11155111]: {
      abi: sepoliaArtifact.abi,
      address: sepoliaDeployedAddresses[
        "FactoryModule#Factory"
      ] as `0x${string}`,
    },
  };

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    transport: custom((window as any).ethereum!),
  });

  const factory = getContract({
    address: deploymentByChainId[11155111].address,
    abi: deploymentByChainId[11155111].abi,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  const oracles = ["Oracle 1", "Oracle 2", "Oracle 3", "New Oracle"]; // Replace with actual oracle list

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // function createOracle(
    //   string memory name,
    //   bytes32 node,
    //   string memory script,
    //   uint256 stakeRequirement,
    //   uint256 bountyAmount,
    //   uint256 cooloff
    // )

    const address = (await walletClient.getAddresses())[0]!;

    const res = await factory?.write?.createOracle?.(
      [
        data.name,
        namehash(normalize(data.name + ".nssa.eth")),
        data.script,
        data.stakeRequirement,
        data.bountyAmount,
        data.cooloffPeriod,
      ],
      { account: address },
    );
  };

  return (
    <div className="flex">
      <div className="w-1/4 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Oracles
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            {oracles.map((oracle, index) => (
              <div
                key={index}
                className={`cursor-pointer rounded border p-2 ${
                  selectedOracle === oracle
                    ? "border-indigo-500 bg-indigo-100"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedOracle(oracle)}
              >
                {oracle}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-3/4 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Node Information
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            {selectedOracle === "New Oracle" ? (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col">
                  <label className="font-bold text-gray-700">Name:</label>
                  <input
                    className="rounded-lg border-2 border-gray-200 p-2"
                    {...register("name")}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-bold text-gray-700">Script:</label>
                  <textarea
                    className="rounded-lg border-2 border-gray-200 p-2"
                    {...register("script")}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-bold text-gray-700">
                    Stake Requirement:
                  </label>
                  <input
                    className="rounded-lg border-2 border-gray-200 p-2"
                    type="number"
                    {...register("stakeRequirement", { valueAsNumber: true })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-bold text-gray-700">
                    Bounty Amount:
                  </label>
                  <input
                    className="rounded-lg border-2 border-gray-200 p-2"
                    type="number"
                    {...register("bountyAmount", { valueAsNumber: true })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-bold text-gray-700">
                    Cooloff Period:
                  </label>
                  <input
                    className="rounded-lg border-2 border-gray-200 p-2"
                    type="number"
                    {...register("cooloffPeriod", { valueAsNumber: true })}
                  />
                </div>
                <input
                  className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                  type="submit"
                />
              </form>
            ) : (
              <p>Display node information and status here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
