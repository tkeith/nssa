"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { namehash } from "viem";
import { normalize } from "viem/ens";

import sepoliaArtifact from "../../../hardhat/ignition/deployments/chain-11155111/artifacts/FactoryModule#Factory.json";
import sepoliaDeployedAddresses from "../../../hardhat/ignition/deployments/chain-11155111/deployed_addresses.json";

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
  const [oracles, setOracles] = useState<{ name: string; address: string }[]>(
    [],
  );

  const deploymentByChainId = {
    // sepolia
    [11155111]: {
      abi: sepoliaArtifact.abi,
      address: sepoliaDeployedAddresses[
        "FactoryModule#Factory"
      ] as `0x${string}`,
    },
  };

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const factory = new ethers.Contract(
    deploymentByChainId[11155111].address,
    deploymentByChainId[11155111].abi,
    signer,
  );

  useEffect(() => {
    const fetchOracles = async () => {
      const numberOfOracles = await factory.numberOfOracles();

      console.log(`Number of Oracles: ${numberOfOracles}`);
      console.log(factory.address);

      const oracleList = [];
      for (let i = 0; i < numberOfOracles; i++) {
        const oracleAddress = await factory.oraclesById(i);
        const oracleName = await factory.namesByOracleId(oracleAddress);
        oracleList.push({
          name: oracleName + ".nssa.eth",
          address: oracleAddress,
        });
      }
      setOracles(oracleList);
      console.log(oracleList);
    };

    void fetchOracles();
  }, []);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const address = await signer.getAddress();

    const res = await factory.createOracle(
      data.name,
      namehash(normalize(data.name + ".nssa.eth")),
      data.script,
      data.stakeRequirement,
      data.bountyAmount,
      data.cooloffPeriod,
      { from: address },
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
            {[...oracles.map((o) => o.name), "New Oracle"].map(
              (oracle, index) => (
                <div
                  key={index}
                  className={`mb-1 cursor-pointer rounded border p-2 ${
                    selectedOracle === oracle
                      ? "border-indigo-500 bg-indigo-100"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedOracle(oracle)}
                >
                  {oracle}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="w-3/4 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
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
