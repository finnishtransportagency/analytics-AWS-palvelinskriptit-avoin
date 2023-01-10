import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
export declare class VPCStack extends cdk.Stack {
    readonly sharedvpc: ec2.Vpc;
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps);
}
