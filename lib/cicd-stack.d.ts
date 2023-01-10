import * as cdk from '@aws-cdk/core';
import { Construct, Stack } from '@aws-cdk/core';
interface ServiceStackProps extends cdk.StackProps {
}
export declare class CICDStack extends Stack {
    constructor(scope: Construct, id: string, props: ServiceStackProps);
}
export {};
