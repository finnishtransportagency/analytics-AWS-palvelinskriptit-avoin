import * as cdk from '@aws-cdk/core';
import { CfnOutput, Construct, StackProps, Stage } from '@aws-cdk/core';
import { ServiceStack } from './service-stack';
import { VPCStack } from '../lib/vpc-stack';


export class RAnalytisStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
  }
}


export class RAnalytisStage extends Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const app = new cdk.App();
    const envEU  = { account: "486585386139", region: 'eu-central-1' };
    const vpcprod=new VPCStack(app, 'ranalytics-vpc-prod',{  env:envEU});
    const service = new ServiceStack(this, 'r-analytics-Service', {
      
      tags: {
        Application: 'r-analytics-Service',
      }
    });
   }
}
