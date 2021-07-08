#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { CICDStack } from '../lib/cicd-stack';
import { EC2Stack } from '../lib/ec2-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { ServiceStack } from '../lib/service-stack';
import { VPCStack } from '../lib/vpc-stack';
import { ECRStack } from '../lib/ecr-stack';
import { CommitStack } from '../lib/codecommit-stack';



const app = new cdk.App();
const envEU  = { account: app.node.tryGetContext('prodaccountid'), region: 'eu-central-1' };
new SecretsStack(app, 'AIS-secrets-prod', {env:envEU});
const vpcdev=new VPCStack(app, 'AIS-vpc-prod',{  env:envEU} );
new ServiceStack(app, 'AIS-service-prod',{  env:envEU,
});
new CICDStack(app, 'AIS-cicd-prod', {env:envEU
     });

