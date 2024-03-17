"use client";

import { IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { namehash } from "viem";
import { normalize } from "viem/ens";

import { defaultAbiCoder } from "ethers/lib/utils";
import { deployment } from "@/lib/contract-link";

interface NewOracleFormData {
  name: string;
  script: string;
  stakeRequirement: number;
  bountyAmount: number;
  cooloffPeriod: number;
}

interface FundBountyFormData {
  amount: number;
}

export default function Oracles(props: { address: string }) {
  const [selectedOracle, setSelectedOracle] = useState<string | null>(null);
  const [hasStakedSelectedOracle, setHasStakedSelectedOracle] =
    useState<boolean>(false);
  const { register, handleSubmit } = useForm<NewOracleFormData>();
  const { register: registerFundBounty, handleSubmit: handleSubmitFundBounty } =
    useForm<FundBountyFormData>();
  const [oracles, setOracles] = useState<{ name: string; address: string }[]>(
    [],
  );
  const [oracleBalance, setOracleBalance] = useState<number>(0);
  const [oracleLastUpdated, setOracleLastUpdated] = useState<number>(0);
  const [oracleCurrentValue, setOracleCurrentValue] = useState<number>(0);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const factory = new ethers.Contract(
    deployment.address,
    deployment.abi,
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

  useEffect(() => {
    const checkStake = async () => {
      if (selectedOracle) {
        const oracleAddress = oracles.find((o) => o.name === selectedOracle)
          ?.address;
        if (oracleAddress) {
          const oracle = new ethers.Contract(
            oracleAddress,
            deployment.oracleAbi,
            signer,
          );
          const stakeAmount = await oracle.stakeAmountsByStakerAddress(
            signer.getAddress(),
          );
          setHasStakedSelectedOracle(stakeAmount > 0);

          // Fetch the balance of the oracle address
          const balance = await provider.getBalance(oracleAddress);
          setOracleBalance(balance.toNumber());

          // Fetch the last updated time and current value of the oracle
          const lastUpdated = await oracle.lastUpdatedAt();
          const currentValue = await oracle.value();
          setOracleLastUpdated(lastUpdated.toNumber());
          setOracleCurrentValue(currentValue.toNumber());
        }
      }
    };

    void checkStake();
  }, [selectedOracle]);

  const onSubmit: SubmitHandler<NewOracleFormData> = async (data) => {
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

  const onFundBounty: SubmitHandler<FundBountyFormData> = async (data) => {
    const oracleAddress = oracles.find((o) => o.name === selectedOracle)
      ?.address;
    if (!oracleAddress) {
      throw new Error("Oracle not found");
    }

    console.log(`Oracle Address: ${oracleAddress}`);

    const oracle = new ethers.Contract(
      oracleAddress,
      deployment.oracleAbi,
      signer,
    );

    const fundTransaction = await signer.sendTransaction({
      to: oracleAddress,
      value: data.amount,
    });
    console.log(`Fund Transaction: ${fundTransaction}`);
  };

  const onSuccess = async (successResult: ISuccessResult) => {
    console.log(successResult);
    // {verification_level: 'orb', nullifier_hash: '0x286a5f6c0a81e575867f57fb5ac7173bdb14bae700842c077b8ec082e38b10ba', proof: '0x165a35d74952588e1f91d3b81243f72e12a3754e9f56e8b7…7a5777481b5384e9cc950ae5001da6ef07318b64745dca728', credential_type: 'orb', merkle_root: '0x288b800086b6b5a01ef99e00cf78ba2d2ab80edd3948af1123d642950205de13'}

    const oracleAddress = oracles.find((o) => o.name === selectedOracle)
      ?.address;
    if (!oracleAddress) {
      throw new Error("Oracle not found");
    }

    const oracle = new ethers.Contract(
      oracleAddress,
      deployment.oracleAbi,
      signer,
    );

    const stakeAmount = await oracle.stakeRequirement();
    console.log(`Stake Amount: ${stakeAmount}`);

    console.log("props.address: ", props.address);

    const signal = props.address;
    const root = successResult.merkle_root;
    const nullifierHash = successResult.nullifier_hash;
    const proof = successResult.proof;
    const unpackedProof = defaultAbiCoder.decode(["uint256[8]"], proof)[0];
    const unpackedRoot = defaultAbiCoder.decode(["uint256"], root)[0];
    const unpackedNullifierHash = defaultAbiCoder.decode(
      ["uint256"],
      nullifierHash,
    )[0];

    console.log(
      JSON.stringify({
        signal,
        unpackedRoot,
        unpackedNullifierHash,
        unpackedProof,
        other: {
          value: stakeAmount,
          from: props.address,
        },
      }),
    );

    const stakeTransaction = await oracle.stake(
      signal,
      root,
      nullifierHash,
      unpackedProof,
      {
        value: stakeAmount,
        from: props.address,
      },
    );
  };

  const onUnstake = async () => {
    const oracleAddress = oracles.find((o) => o.name === selectedOracle)
      ?.address;
    if (!oracleAddress) {
      throw new Error("Oracle not found");
    }

    const oracle = new ethers.Contract(
      oracleAddress,
      deployment.oracleAbi,
      signer,
    );

    const unstakeTransaction = await oracle.unstake();
    console.log(`Unstake Transaction: ${unstakeTransaction}`);
  };

  return (
    <div className="flex">
      <div className="w-1/4 bg-white shadow sm:rounded-lg">
        <div className="h-60 px-4 py-5 sm:p-6">
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
      <div className="w-3/4 bg-white  sm:rounded-lg">
        <div className="px-4 ">
          <div className="max-w-xl text-sm text-gray-500">
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
            ) : selectedOracle ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="h-60 h-full rounded p-4 shadow">
                  <h3 className="mb-2 text-base font-semibold leading-6 text-gray-900">
                    Staking
                  </h3>
                  <IDKitWidget
                    app_id="app_e48accc29bd23fe37afbd70ce56ecc8a" // must be an app set to on-chain in Developer Portal
                    action="nssa"
                    signal={props.address} // proof will only verify if the signal is unchanged, this prevents tampering
                    onSuccess={onSuccess} // use onSuccess to call your smart contract
                    // no use for handleVerify, so it is removed
                    // use default verification_level (orb-only), as device credentials are not supported on-chain
                  >
                    {({ open }) =>
                      hasStakedSelectedOracle ? (
                        <button
                          onClick={onUnstake}
                          className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
                        >
                          Unstake
                        </button>
                      ) : (
                        <button
                          onClick={open}
                          className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                        >
                          Stake
                        </button>
                      )
                    }
                  </IDKitWidget>
                </div>
                <div className="h-60 h-full rounded p-4 shadow">
                  <h3 className="mb-2 text-base font-semibold leading-6 text-gray-900">
                    Fund Bounty
                  </h3>
                  <p>Current balance: {oracleBalance}</p>
                  <form
                    className="space-y-4"
                    onSubmit={handleSubmitFundBounty(onFundBounty)}
                  >
                    <div className="flex flex-col">
                      <label className="font-bold text-gray-700">Amount:</label>
                      <input
                        className="rounded-lg border-2 border-gray-200 p-2"
                        type="number"
                        {...registerFundBounty("amount", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <input
                      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                      type="submit"
                      value="Fund"
                    />
                  </form>
                </div>
                <div className="h-60 h-full w-96 rounded p-4 shadow">
                  <h3 className="mb-2 text-base font-semibold leading-6 text-gray-900">
                    Oracle Status
                  </h3>
                  <p>
                    Address:{" "}
                    {oracles.find((o) => o.name === selectedOracle)?.address}
                  </p>
                  <p>
                    Last updated at:{" "}
                    {oracleLastUpdated === 0
                      ? "never updated"
                      : new Date(oracleLastUpdated * 1000).toLocaleString()}
                  </p>
                  <p>Current value: {oracleCurrentValue}</p>
                </div>
              </div>
            ) : (
              <div>
                <p>Select an oracle or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
