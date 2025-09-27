/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITelemetrySender, TelemetryEventMeasurements, TelemetryEventProperties } from '../telemetry';
import { OTelTelemetrySender } from './otelTelemetrySender';

export class WrappedTelemetrySender implements ITelemetrySender {
	constructor(
		private readonly base: ITelemetrySender,
		private readonly otel: OTelTelemetrySender
	) { }

	dispose(): void {
		this.base.dispose();
		this.otel.dispose();
	}

	sendTelemetryEvent(eventName: string, properties?: TelemetryEventProperties, measurements?: TelemetryEventMeasurements): void {
		this.base.sendTelemetryEvent(eventName, properties, measurements);
		this.otel.sendTelemetryEvent(eventName, properties, measurements);
	}

	sendTelemetryErrorEvent(eventName: string, properties?: TelemetryEventProperties, measurements?: TelemetryEventMeasurements): void {
		this.base.sendTelemetryErrorEvent(eventName, properties, measurements);
		this.otel.sendTelemetryErrorEvent(eventName, properties, measurements);
	}
}
