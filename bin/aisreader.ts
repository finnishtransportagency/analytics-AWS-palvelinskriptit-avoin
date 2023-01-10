#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { CICDStack } from '../lib/cicd-stack';
import { ServiceStack } from '../lib/service-stack';
import { VPCStack } from '../lib/vpc-stack';




const app = new cdk.App();
const { accountId, region } = new cdk.ScopedAws(app);
const environment = (accountId == "715757124801" ? "prod" : (accountId == "593223377027") ? "dev" : "undefined")
const envEU  = { account: accountId, region: region };
//new SecretsStack(app, 'AIS-secrets-prod', {env:envEU});
//const vpcdev=new VPCStack(app, 'AIS-vpc-prod',{  env:envEU} ); provided by account
new CICDStack(app, 'AIS-cicd-'+environment, {env:envEU
     });

