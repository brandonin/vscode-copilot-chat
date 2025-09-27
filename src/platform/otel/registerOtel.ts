import { ITelemetrySender } from '../common/telemetry';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { buildOtelConfig } from './otelConfig';
import { OTelTelemetrySender } from './otelTelemetrySender';
import { WrappedTelemetrySender } from './wrappedSender';

/**
 * Returns a (possibly) wrapped sender. If disabled, returns the original.
 * This function is intentionally async; caller may ignore the promise
 * without breaking base telemetry.
 */
export async function maybeWrapWithOtel(
  baseSender: ITelemetrySender,
  configurationService: IConfigurationService
): Promise<ITelemetrySender> {
  const cfg = buildOtelConfig(<T>(k: string, d: T) => configurationService.getValue<T>(k) ?? d);
  if (!cfg.enabled) {
    return baseSender;
  }
  const otel = new OTelTelemetrySender(cfg);
  await otel.init();
  return new WrappedTelemetrySender(baseSender, otel);
}
