// Experimental OTel configuration surface for Copilot Chat telemetry mirroring.
export interface CopilotOtelConfig {
  enabled: boolean;
  endpoint?: string;
  serviceName?: string;
  headers?: Record<string, string>;
  flushTimeoutMs: number;
  spanSampleRatio: number;
}

export function buildOtelConfig(readSetting: <T>(key: string, def: T) => T): CopilotOtelConfig {
  return {
    enabled: !!readSetting<boolean>('copilotChat.experimentalOtel.enabled', false),
    endpoint: readSetting<string | undefined>('copilotChat.experimentalOtel.endpoint', undefined),
    serviceName: readSetting<string | undefined>('copilotChat.experimentalOtel.serviceName', 'copilot-chat'),
    headers: readSetting<Record<string, string> | undefined>('copilotChat.experimentalOtel.headers', undefined),
    flushTimeoutMs: readSetting<number>('copilotChat.experimentalOtel.flushTimeoutMs', 3000),
    spanSampleRatio: readSetting<number>('copilotChat.experimentalOtel.spanSampleRatio', 1.0)
  };
}
