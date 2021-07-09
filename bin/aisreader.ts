#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { CICDStack } from '../lib/cicd-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { ServiceStack } from '../lib/service-stack';
import { VPCStack } from '../lib/vpc-stack';




const app = new cdk.App();
const envEU  = { account: app.node.tryGetContext('prodaccountid'), region: 'eu-central-1' };
//new SecretsStack(app, 'AIS-secrets-prod', {env:envEU});
//const vpcdev=new VPCStack(app, 'AIS-vpc-prod',{  env:envEU} ); provided by account
new CICDStack(app, 'AIS-cicd-prod', {env:envEU
     });

