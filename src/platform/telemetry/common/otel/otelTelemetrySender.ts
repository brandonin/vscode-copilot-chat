/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITelemetrySender, TelemetryEventMeasurements, TelemetryEventProperties } from '../telemetry';
import { CopilotOtelConfig } from './otelConfig';

type OtelApi = typeof import('@opentelemetry/api');

interface OtelRuntime {
	api: OtelApi;
	tracer: import('@opentelemetry/api').Tracer;
}

export class OTelTelemetrySender implements ITelemetrySender {
	private runtime: OtelRuntime | undefined;
	private disposed = false;

	constructor(private readonly config: CopilotOtelConfig) { }

	async init(): Promise<void> {
		if (this.runtime || !this.config.enabled) {
			return;
		}
		try {
			const [
				api,
				sdkTraceNode,
				resources,
				semantic,
				otlpHttp
			] = await Promise.all([
				import('@opentelemetry/api'),
				import('@opentelemetry/sdk-trace-node'),
				import('@opentelemetry/resources'),
				import('@opentelemetry/semantic-conventions'),
				import('@opentelemetry/exporter-trace-otlp-http')
			]);

			const { NodeTracerProvider, BatchSpanProcessor } = sdkTraceNode;
			const { Resource } = resources;
			const { SemanticResourceAttributes } = semantic;
			const { OTLPTraceExporter } = otlpHttp;

			const provider = new NodeTracerProvider({
				resource: new Resource({
					[SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName || 'copilot-chat',
					'copilot.telemetry.channel': 'otel-mirror'
				})
			});

			if (this.config.endpoint) {
				const exporter = new OTLPTraceExporter({
					url: this.config.endpoint,
					headers: this.config.headers
				});
				provider.addSpanProcessor(new BatchSpanProcessor(exporter));
			}

			provider.register();

			const tracer = api.trace.getTracer('copilot-chat-otel');
			this.runtime = { api, tracer };
		} catch {
			// Silent failure: keeps original telemetry path intact if OTel setup fails.
		}
	}

	dispose(): void {
		this.disposed = true;
	}

	sendTelemetryEvent(eventName: string, properties?: TelemetryEventProperties, measurements?: TelemetryEventMeasurements): void {
		if (!this.runtime || this.disposed) {
			return;
		}
		const { tracer } = this.runtime;
		const span = tracer.startSpan(eventName);
		try {
			if (properties) {
				for (const [k, v] of Object.entries(properties)) {
					if (v !== undefined) {
						span.setAttribute(`prop.${k}`, truncate(String(v)));
					}
				}
			}
			if (measurements) {
				for (const [k, v] of Object.entries(measurements)) {
					if (v !== undefined) {
						span.setAttribute(`measure.${k}`, v as number);
					}
				}
			}
			span.setAttribute('telemetry.event_name', eventName);
		} finally {
			span.end();
		}
	}

	sendTelemetryErrorEvent(eventName: string, properties?: TelemetryEventProperties, measurements?: TelemetryEventMeasurements): void {
		if (!this.runtime || this.disposed) {
			return;
		}
		const { tracer, api } = this.runtime;
		const span = tracer.startSpan(eventName);
		try {
			span.setAttribute('error', true);
			if (properties) {
				for (const [k, v] of Object.entries(properties)) {
					if (v !== undefined) {
						span.setAttribute(`prop.${k}`, truncate(String(v)));
					}
				}
			}
			if (measurements) {
				for (const [k, v] of Object.entries(measurements)) {
					if (v !== undefined) {
						span.setAttribute(`measure.${k}`, v as number);
					}
				}
			}
			span.recordException(new Error(`telemetryError:${eventName}`));
			span.setStatus({ code: api.SpanStatusCode.ERROR });
		} finally {
			span.end();
		}
	}
}

function truncate(s: string): string {
	return s.length > 8000 ? s.slice(0, 8000) + '…(truncated)' : s;
}
