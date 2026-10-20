"use client";
import { useSyncExternalStore } from "react";
import { browserJavaUsed, serverJavaUsed, subscribeJavaRunner } from "./javaExecution";

export default function JavaRunnerBrand() {
  const visible = useSyncExternalStore(subscribeJavaRunner, browserJavaUsed, serverJavaUsed);
  if (!visible) return null;
  // Vendor logo is served locally; CheerpJ is loaded only after Run code in online mode.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="java-runner-brand">Java 8 · Powered by <img src="/cheerpj.svg" alt="CheerpJ" width="76" height="22" /></span>;
}
