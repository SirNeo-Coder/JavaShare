"use client";

import { useEffect, useRef, useState } from "react";
import { getJavaRunner, runJava, type JavaResult } from "./javaExecution";
import type { ModuleFile } from "../backend/src/module-activities";

// Both editable Java consoles share the same live-input and cancellation behavior.
export function useJavaConsole(onOutput: (output: string) => void, projectId?: string) {
  const controller = useRef<AbortController | null>(null);
  const pending = useRef<((line: string) => void) | null>(null);
  const [active, setActive] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // True once compiling is done and the program itself runs (the run box closes then).
  const [running, setRunning] = useState(false);
  useEffect(() => {
    return () => {
      const previous = controller.current;
      controller.current = null; pending.current = null;
      previous?.abort(); setActive(false); setWaiting(false); setRunning(false);
    };
  }, [projectId]);

  const run = async (files: ModuleFile[], stdin: string, onInteractiveStart?: () => void): Promise<JavaResult> => {
    const current = new AbortController();
    controller.current?.abort(); controller.current = current;
    try {
      const config = await getJavaRunner();
      if (current.signal.aborted) return { mode: config.mode, success: false, output: "Execution stopped." };
      let result: JavaResult;
      if (config.mode !== "browser") result = await runJava(files, stdin, config);
      else {
        setActive(true); setWaiting(false); setRunning(false); onOutput(""); onInteractiveStart?.();
        const initial = stdin && !stdin.endsWith("\n") ? `${stdin}\n` : stdin;
        result = await runJava(files, initial, config, {
          signal: current.signal,
          onOutput: (text) => { if (controller.current === current) onOutput(text); },
          onStatus: (stage) => {
            if (controller.current !== current) return;
            onOutput(`${stage}…`); if (stage === "Running Java") setRunning(true);
          },
          onInput: (send) => {
            if (controller.current !== current) return;
            pending.current = send; setWaiting(!!send);
          },
        });
      }
      if (controller.current === current) onOutput(result.output);
      return result;
    } finally {
      if (controller.current === current) {
        controller.current = null; pending.current = null; setWaiting(false); setActive(false); setRunning(false);
      }
    }
  };
  const send = (line: string) => { pending.current?.(line); };
  const stop = () => { controller.current?.abort(); };
  return { run, send, stop, active, waiting, running };
}
