import React from 'react';
import { Divider } from '@fluentui/react-components';
import { ActionExample } from './ActionExample';
import { MessageBoxExample } from './MessageBoxExample';
import { SharedStateExample } from './SharedStateExample';
import { ErrorMessageExample } from './ErrorMessageExample';
import "../../../styles.scss";
import { TabContentProps } from '../ClientSDKPlaygroundModel';

export function ApiActionDialog(props: TabContentProps) {
    const { sampleWorkloadName, workloadClient } = props;

    return (
        <span>
            {/* Action API usage example */}
            <Divider alignContent="start">Action</Divider>
            <ActionExample sampleWorkloadName={sampleWorkloadName}
                workloadClient={workloadClient} />

            {/* Dialog MessageBox API usage example */}
            <Divider alignContent="start">Dialog Message Box</Divider>
            <MessageBoxExample
                sampleWorkloadName={sampleWorkloadName}
                workloadClient={workloadClient}
            />

            {/* Shared state API usage example */}
            <Divider alignContent="start">Shared State</Divider>
            <SharedStateExample
                sampleWorkloadName={sampleWorkloadName}
                workloadClient={workloadClient}
            />

            {/* Error Handling API usage example */}
            <Divider alignContent="start">Error Handling</Divider>
            <ErrorMessageExample
                sampleWorkloadName={sampleWorkloadName}
                workloadClient={workloadClient}
            />
        </span>
    );
};

export default ApiActionDialog;