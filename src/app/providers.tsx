"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { config } from "./wagmi";

export function Providers(props: { children: ReactNode }) {
  return <WagmiProvider config={config}>{props.children}</WagmiProvider>;
}
