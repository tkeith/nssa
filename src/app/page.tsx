"use client";

/* eslint-disable @next/next/no-img-element */

import { Disclosure, Tab } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import Oracles from "@/app/_components/Oracles";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const SUPPORTED_CHAIN_IDS = [11155111, 88880, 8453];

export default function Home() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <p className="text-lg text-white">NSSA</p>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      {account.status === "connected" ? (
                        <>
                          <span className="mr-4 text-sm text-white">
                            {account.address.slice(0, 6)}...
                            {account.address.slice(-4)}
                          </span>
                          <button
                            onClick={() => disconnect()}
                            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Disconnect Wallet
                          </button>
                        </>
                      ) : (
                        connectors.map((connector, index) => (
                          <button
                            key={index}
                            onClick={() => connect({ connector })}
                            className="mr-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Connect {connector.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="absolute -inset-0.5" />
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="border-t border-gray-700 pb-3 pt-4">
                  <div className="flex items-center px-5">
                    <div className="ml-3">
                      {account.status === "connected" ? (
                        <button
                          onClick={() => disconnect()}
                          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Disconnect Wallet
                        </button>
                      ) : (
                        connectors.map((connector, index) => (
                          <button
                            key={index}
                            onClick={() => connect({ connector })}
                            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Connect {connector.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <main>
          <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {account.status === "connected" ? (
              SUPPORTED_CHAIN_IDS.includes(account.chainId) ? (
                <Oracles />
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xl">Switch to a supported chain</p>
                </div>
              )
            ) : (
              <div className="flex h-64 items-center justify-center">
                <p className="text-xl">Connect your wallet to continue</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
