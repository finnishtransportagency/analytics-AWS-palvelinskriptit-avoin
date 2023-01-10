#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SecretcdkStack } from '../lib/secretcdk-stack';

const app = new cdk.App();
new SecretcdkStack(app, 'AIS-secrets-prod');
new SecretcdkStack(app, 'AIS-secrets-dev');
