/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICopilotTokenStore } from '../../authentication/common/copilotTokenStore';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { ICAPIClientService } from '../../endpoint/common/capiClient';
import { IDomainService } from '../../endpoint/common/domainService';
import { IEnvService } from '../../env/common/envService';
import { BaseTelemetryService } from '../common/baseTelemetryService';
import { ITelemetryUserConfig } from '../common/telemetry';
import { GitHubTelemetrySender } from './githubTelemetrySender';
import { MicrosoftTelemetrySender } from './microsoftTelemetrySender';

import { maybeWrapWithOtel } from '../common/otel/registerOtel';

export class TelemetryService extends BaseTelemetryService {
	declare readonly _serviceBrand: undefined;
	constructor(
		extensionName: string,
		internalMSFTAIKey: string,
		internalLargeEventMSFTAIKey: string,
		externalMSFTAIKey: string,
		externalGHAIKey: string,
		estrictedGHAIKey: string,
		@IConfigurationService configService: IConfigurationService,
		@ICopilotTokenStore tokenStore: ICopilotTokenStore,
		@ICAPIClientService capiClientService: ICAPIClientService,
		@IEnvService envService: IEnvService,
		@ITelemetryUserConfig telemetryUserConfig: ITelemetryUserConfig,
		@IDomainService domainService: IDomainService
	) {
		const microsoftTelemetrySender = new MicrosoftTelemetrySender(internalMSFTAIKey, internalLargeEventMSFTAIKey, externalMSFTAIKey, tokenStore);
		const ghTelemetrySender = new GitHubTelemetrySender(
			configService,
			envService,
			telemetryUserConfig,
			domainService,
			capiClientService,
			extensionName,
			externalGHAIKey,
			estrictedGHAIKey,
			tokenStore
		);

		// Fire-and-forget optional wrapping. Base telemetry works even if wrapping fails or is async.
		maybeWrapWithOtel(ghTelemetrySender, configService).then(wrapped => {
			// After wrapping, replace internal reference so subsequent sends mirror to OTel as well.
			// @ts-ignore (protected field access workaround if necessary)
			this._ghTelemetrySender = wrapped;
		}).catch(() => { /* swallow errors */ });

		super(tokenStore, microsoftTelemetrySender, ghTelemetrySender);
	}
}