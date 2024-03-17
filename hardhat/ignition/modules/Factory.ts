import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FactoryModule = buildModule("FactoryModule", (m) => {
  // const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
  // const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

  // parameters:
  // IWorldID _worldId,
  // string memory _appId,
  // string memory _actionId,
  // bool _ensEnabled

  const worldEnabled = true;
  const worldId = "0x469449f251692e0779667583026b5a1e99512157";
  const appId = "app_e48accc29bd23fe37afbd70ce56ecc8a";
  const actionId = "nssa";
  const ensEnabled = true;

  const factory = m.contract(
    "Factory",
    [worldEnabled, worldId, appId, actionId, ensEnabled],
    {},
  );

  return { factory };
});

export default FactoryModule;
